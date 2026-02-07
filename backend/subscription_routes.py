# ========================================
# ROTAS DE ASSINATURA E CUPONS
# Cole estas rotas no seu server.py
# ========================================

from subscription_models import *
from subscription_service import SubscriptionService
from mercadopago_service import MercadoPagoService

# Inicializar serviços
mp_service = MercadoPagoService()

# ========================================
# ROTAS DE ASSINATURA
# ========================================

@app.get("/api/subscription/status")
async def get_subscription_status(request: Request):
    """Retorna status da assinatura do usuário"""
    
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    user = verify_token(token)
    
    if not user:
        raise HTTPException(status_code=401, detail="Não autorizado")
    
    subscription = SubscriptionService.get_subscription(user["id"])
    
    if not subscription:
        # Criar trial automático para novo usuário
        subscription = SubscriptionService.create_trial(user["id"])
    
    is_active = SubscriptionService.is_subscription_active(user["id"])
    days_remaining = SubscriptionService.get_days_remaining(user["id"])
    
    return {
        "subscription": subscription,
        "is_active": is_active,
        "days_remaining": days_remaining,
        "requires_payment": subscription["status"] == "trial" and days_remaining and days_remaining <= 0
    }

@app.post("/api/subscription/create")
async def create_subscription(data: SubscriptionCreate, request: Request):
    """Cria uma assinatura paga"""
    
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    user = verify_token(token)
    
    if not user:
        raise HTTPException(status_code=401, detail="Não autorizado")
    
    # Preço base
    plan_price = 19.90
    final_price = plan_price
    discount_applied = 0.0
    free_months = 0
    
    # Validar cupom se fornecido
    if data.coupon_code:
        validation = SubscriptionService.validate_coupon(data.coupon_code, user["id"])
        
        if not validation["valid"]:
            raise HTTPException(status_code=400, detail=validation["message"])
        
        # Aplicar desconto
        if validation["discount_type"] == "percentage":
            discount_applied = plan_price * (validation["discount_value"] / 100)
            final_price = plan_price - discount_applied
        elif validation["discount_type"] == "fixed":
            discount_applied = validation["discount_value"]
            final_price = max(0, plan_price - discount_applied)
        elif validation["discount_type"] == "free_months":
            free_months = int(validation["discount_value"])
            final_price = 0.0  # Primeiro pagamento grátis
    
    try:
        # Criar pagamento no Mercado Pago
        payment_result = mp_service.create_payment(
            amount=final_price,
            description=f"Fotiva - Assinatura Mensal",
            payer_email=user["email"],
            payment_method_id=data.payment_method_id
        )
        
        if payment_result["status"] != 201:
            raise HTTPException(status_code=400, detail="Erro ao processar pagamento")
        
        payment_data = payment_result["response"]
        
        # Se pagamento aprovado, criar assinatura recorrente
        if payment_data["status"] == "approved":
            subscription_result = mp_service.create_subscription(
                user_email=user["email"],
                plan_price=plan_price,
                payer_id=payment_data["payer"]["id"],
                payment_method_id=data.payment_method_id
            )
            
            if subscription_result["status"] != 201:
                raise HTTPException(status_code=400, detail="Erro ao criar assinatura")
            
            subscription_data = subscription_result["response"]
            
            # Ativar assinatura no sistema
            months_to_add = 1 + free_months
            subscription = SubscriptionService.activate_subscription(
                user_id=user["id"],
                plan_id="monthly_19_90",
                mercadopago_subscription_id=subscription_data["id"],
                months=months_to_add
            )
            
            # Registrar uso do cupom
            if data.coupon_code:
                SubscriptionService.use_coupon(data.coupon_code, user["id"], discount_applied)
            
            return {
                "success": True,
                "subscription": subscription,
                "payment_id": payment_data["id"],
                "message": "Assinatura ativada com sucesso!"
            }
        else:
            return {
                "success": False,
                "payment_status": payment_data["status"],
                "message": "Aguardando aprovação do pagamento"
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao criar assinatura: {str(e)}")

@app.post("/api/subscription/cancel")
async def cancel_subscription(data: SubscriptionCancel, request: Request):
    """Cancela assinatura"""
    
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    user = verify_token(token)
    
    if not user:
        raise HTTPException(status_code=401, detail="Não autorizado")
    
    subscription = SubscriptionService.get_subscription(user["id"])
    
    if not subscription or subscription["status"] != "active":
        raise HTTPException(status_code=400, detail="Nenhuma assinatura ativa encontrada")
    
    try:
        # Cancelar no Mercado Pago
        if subscription.get("mercadopago_subscription_id"):
            mp_service.cancel_subscription(subscription["mercadopago_subscription_id"])
        
        # Cancelar no sistema
        cancelled_subscription = SubscriptionService.cancel_subscription(user["id"], data.reason)
        
        return {
            "success": True,
            "message": "Assinatura cancelada com sucesso",
            "subscription": cancelled_subscription
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao cancelar assinatura: {str(e)}")

# ========================================
# ROTAS DE CUPONS
# ========================================

@app.post("/api/coupons/create")
async def create_coupon(data: CouponCreate, request: Request):
    """Cria um cupom de desconto (apenas admin)"""
    
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    user = verify_token(token)
    
    if not user:
        raise HTTPException(status_code=401, detail="Não autorizado")
    
    # TODO: Adicionar verificação de admin
    # if user.get("role") != "admin":
    #     raise HTTPException(status_code=403, detail="Apenas administradores")
    
    try:
        coupon = SubscriptionService.create_coupon(
            code=data.code,
            discount_type=data.discount_type,
            discount_value=data.discount_value,
            created_by=user["id"],
            max_uses=data.max_uses,
            valid_from=data.valid_from,
            valid_until=data.valid_until
        )
        
        return {
            "success": True,
            "coupon": coupon,
            "message": f"Cupom {data.code} criado com sucesso!"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao criar cupom: {str(e)}")

@app.post("/api/coupons/validate")
async def validate_coupon(data: CouponValidate, request: Request):
    """Valida um cupom"""
    
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    user = verify_token(token)
    
    if not user:
        raise HTTPException(status_code=401, detail="Não autorizado")
    
    validation = SubscriptionService.validate_coupon(data.code, user["id"])
    
    if validation["valid"]:
        # Calcular quanto seria o desconto
        plan_price = 19.90
        
        if validation["discount_type"] == "percentage":
            discount_amount = plan_price * (validation["discount_value"] / 100)
            final_price = plan_price - discount_amount
            message = f"Desconto de {validation['discount_value']}% aplicado! De R$ {plan_price:.2f} por R$ {final_price:.2f}"
        elif validation["discount_type"] == "fixed":
            final_price = max(0, plan_price - validation["discount_value"])
            message = f"Desconto de R$ {validation['discount_value']:.2f} aplicado! De R$ {plan_price:.2f} por R$ {final_price:.2f}"
        elif validation["discount_type"] == "free_months":
            months = int(validation["discount_value"])
            message = f"{months} {'mês' if months == 1 else 'meses'} grátis! Primeiro pagamento isento."
            final_price = 0.0
        
        return {
            "valid": True,
            "message": message,
            "discount_type": validation["discount_type"],
            "discount_value": validation["discount_value"],
            "original_price": plan_price,
            "final_price": final_price
        }
    
    return validation

@app.get("/api/coupons/list")
async def list_coupons(request: Request):
    """Lista todos os cupons (apenas admin)"""
    
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    user = verify_token(token)
    
    if not user:
        raise HTTPException(status_code=401, detail="Não autorizado")
    
    # TODO: Adicionar verificação de admin
    
    coupons = SubscriptionService.list_coupons()
    
    return {
        "coupons": coupons,
        "total": len(coupons)
    }

@app.post("/api/coupons/{code}/deactivate")
async def deactivate_coupon(code: str, request: Request):
    """Desativa um cupom (apenas admin)"""
    
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    user = verify_token(token)
    
    if not user:
        raise HTTPException(status_code=401, detail="Não autorizado")
    
    # TODO: Adicionar verificação de admin
    
    coupon = SubscriptionService.deactivate_coupon(code)
    
    if not coupon:
        raise HTTPException(status_code=404, detail="Cupom não encontrado")
    
    return {
        "success": True,
        "message": f"Cupom {code} desativado",
        "coupon": coupon
    }

# ========================================
# WEBHOOK MERCADO PAGO
# ========================================

@app.post("/api/payments/webhook")
async def mercadopago_webhook(request: Request):
    """Webhook para notificações do Mercado Pago"""
    
    try:
        data = await request.json()
        
        # Processar notificação
        if data.get("type") == "payment":
            payment_id = data["data"]["id"]
            payment_info = mp_service.get_payment(payment_id)
            
            # Atualizar status do pagamento no seu sistema
            # TODO: Implementar lógica de atualização
            
            print(f"Pagamento recebido: {payment_id} - Status: {payment_info['status']}")
        
        return {"success": True}
        
    except Exception as e:
        print(f"Erro no webhook: {str(e)}")
        return {"success": False, "error": str(e)}

# ========================================
# MIDDLEWARE DE VERIFICAÇÃO DE ASSINATURA
# ========================================

async def check_subscription(request: Request, call_next):
    """Middleware para verificar se usuário tem assinatura ativa"""
    
    # Rotas públicas (não precisam de assinatura)
    public_routes = [
        "/api/auth/login",
        "/api/auth/register",
        "/api/subscription/status",
        "/api/subscription/create",
        "/api/payments/webhook"
    ]
    
    # Se for rota pública, continua
    if any(request.url.path.startswith(route) for route in public_routes):
        return await call_next(request)
    
    # Verificar token
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    user = verify_token(token)
    
    if user:
        # Verificar se tem assinatura ativa
        is_active = SubscriptionService.is_subscription_active(user["id"])
        
        if not is_active:
            return JSONResponse(
                status_code=403,
                content={
                    "detail": "Sua assinatura expirou. Renove para continuar usando o Fotiva.",
                    "requires_payment": True
                }
            )
    
    return await call_next(request)

# Adicionar middleware ao app
# app.middleware("http")(check_subscription)
