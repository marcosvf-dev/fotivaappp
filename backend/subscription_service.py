from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
import uuid

class SubscriptionService:
    """Serviço de gerenciamento de assinaturas"""
    
    # Simulação de banco de dados (você vai substituir por SQLite/PostgreSQL)
    subscriptions: Dict[str, Any] = {}
    coupons: Dict[str, Any] = {}
    coupon_usage: List[Dict[str, Any]] = []
    
    @staticmethod
    def create_trial(user_id: str) -> Dict[str, Any]:
        """
        Cria período de trial de 30 dias para novo usuário
        
        Args:
            user_id: ID do usuário
            
        Returns:
            Dados da assinatura trial
        """
        
        now = datetime.now()
        trial_end = now + timedelta(days=30)
        
        subscription = {
            "user_id": user_id,
            "plan_id": "trial",
            "status": "trial",
            "trial_start": now,
            "trial_end": trial_end,
            "subscription_start": None,
            "subscription_end": None,
            "auto_renew": True,
            "created_at": now
        }
        
        SubscriptionService.subscriptions[user_id] = subscription
        return subscription
    
    @staticmethod
    def get_subscription(user_id: str) -> Optional[Dict[str, Any]]:
        """
        Busca assinatura do usuário
        
        Args:
            user_id: ID do usuário
            
        Returns:
            Dados da assinatura ou None
        """
        
        return SubscriptionService.subscriptions.get(user_id)
    
    @staticmethod
    def is_subscription_active(user_id: str) -> bool:
        """
        Verifica se a assinatura está ativa
        
        Args:
            user_id: ID do usuário
            
        Returns:
            True se ativa, False caso contrário
        """
        
        subscription = SubscriptionService.get_subscription(user_id)
        
        if not subscription:
            return False
        
        now = datetime.now()
        
        # Trial ativo
        if subscription["status"] == "trial":
            if isinstance(subscription["trial_end"], str):
                trial_end = datetime.fromisoformat(subscription["trial_end"])
            else:
                trial_end = subscription["trial_end"]
            return now < trial_end
        
        # Assinatura ativa
        if subscription["status"] == "active":
            if isinstance(subscription["subscription_end"], str):
                sub_end = datetime.fromisoformat(subscription["subscription_end"])
            else:
                sub_end = subscription["subscription_end"]
            return now < sub_end if sub_end else True
        
        return False
    
    @staticmethod
    def get_days_remaining(user_id: str) -> Optional[int]:
        """
        Retorna quantos dias faltam no trial/assinatura
        
        Args:
            user_id: ID do usuário
            
        Returns:
            Número de dias restantes ou None
        """
        
        subscription = SubscriptionService.get_subscription(user_id)
        
        if not subscription:
            return None
        
        now = datetime.now()
        
        if subscription["status"] == "trial":
            if isinstance(subscription["trial_end"], str):
                trial_end = datetime.fromisoformat(subscription["trial_end"])
            else:
                trial_end = subscription["trial_end"]
            delta = trial_end - now
            return max(0, delta.days)
        
        if subscription["status"] == "active" and subscription["subscription_end"]:
            if isinstance(subscription["subscription_end"], str):
                sub_end = datetime.fromisoformat(subscription["subscription_end"])
            else:
                sub_end = subscription["subscription_end"]
            delta = sub_end - now
            return max(0, delta.days)
        
        return None
    
    @staticmethod
    def activate_subscription(
        user_id: str,
        plan_id: str,
        mercadopago_subscription_id: str,
        months: int = 1
    ) -> Dict[str, Any]:
        """
        Ativa assinatura paga
        
        Args:
            user_id: ID do usuário
            plan_id: ID do plano
            mercadopago_subscription_id: ID da assinatura no Mercado Pago
            months: Número de meses
            
        Returns:
            Dados da assinatura atualizada
        """
        
        now = datetime.now()
        subscription_end = now + timedelta(days=30 * months)
        
        subscription = SubscriptionService.subscriptions.get(user_id, {})
        subscription.update({
            "plan_id": plan_id,
            "status": "active",
            "subscription_start": now,
            "subscription_end": subscription_end,
            "mercadopago_subscription_id": mercadopago_subscription_id,
            "activated_at": now
        })
        
        SubscriptionService.subscriptions[user_id] = subscription
        return subscription
    
    @staticmethod
    def cancel_subscription(user_id: str, reason: Optional[str] = None) -> Dict[str, Any]:
        """
        Cancela assinatura
        
        Args:
            user_id: ID do usuário
            reason: Motivo do cancelamento
            
        Returns:
            Dados da assinatura cancelada
        """
        
        subscription = SubscriptionService.subscriptions.get(user_id)
        
        if subscription:
            subscription["status"] = "cancelled"
            subscription["cancelled_at"] = datetime.now()
            subscription["cancellation_reason"] = reason
            subscription["auto_renew"] = False
        
        return subscription
    
    # ========================================
    # CUPONS
    # ========================================
    
    @staticmethod
    def create_coupon(
        code: str,
        discount_type: str,
        discount_value: float,
        created_by: str,
        max_uses: Optional[int] = None,
        valid_from: Optional[datetime] = None,
        valid_until: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Cria um cupom de desconto
        
        Args:
            code: Código do cupom (ex: BEMVINDO)
            discount_type: percentage, fixed, free_months
            discount_value: Valor do desconto
            created_by: ID do usuário que criou
            max_uses: Máximo de usos
            valid_from: Data de início
            valid_until: Data de fim
            
        Returns:
            Dados do cupom criado
        """
        
        code = code.upper()
        
        coupon = {
            "code": code,
            "discount_type": discount_type,
            "discount_value": discount_value,
            "max_uses": max_uses,
            "current_uses": 0,
            "valid_from": valid_from or datetime.now(),
            "valid_until": valid_until,
            "is_active": True,
            "created_by": created_by,
            "created_at": datetime.now()
        }
        
        SubscriptionService.coupons[code] = coupon
        return coupon
    
    @staticmethod
    def validate_coupon(code: str, user_id: str) -> Dict[str, Any]:
        """
        Valida um cupom
        
        Args:
            code: Código do cupom
            user_id: ID do usuário
            
        Returns:
            Dict com valid (bool), message (str), discount_value (float)
        """
        
        code = code.upper()
        coupon = SubscriptionService.coupons.get(code)
        
        if not coupon:
            return {"valid": False, "message": "Cupom não encontrado"}
        
        if not coupon["is_active"]:
            return {"valid": False, "message": "Cupom inativo"}
        
        now = datetime.now()
        
        # Verificar validade
        if isinstance(coupon["valid_from"], str):
            valid_from = datetime.fromisoformat(coupon["valid_from"])
        else:
            valid_from = coupon["valid_from"]
            
        if now < valid_from:
            return {"valid": False, "message": "Cupom ainda não está válido"}
        
        if coupon["valid_until"]:
            if isinstance(coupon["valid_until"], str):
                valid_until = datetime.fromisoformat(coupon["valid_until"])
            else:
                valid_until = coupon["valid_until"]
                
            if now > valid_until:
                return {"valid": False, "message": "Cupom expirado"}
        
        # Verificar usos
        if coupon["max_uses"] and coupon["current_uses"] >= coupon["max_uses"]:
            return {"valid": False, "message": "Cupom esgotado"}
        
        # Verificar se usuário já usou
        user_usage = [u for u in SubscriptionService.coupon_usage if u["user_id"] == user_id and u["coupon_code"] == code]
        if user_usage:
            return {"valid": False, "message": "Você já usou este cupom"}
        
        return {
            "valid": True,
            "message": "Cupom válido",
            "discount_type": coupon["discount_type"],
            "discount_value": coupon["discount_value"]
        }
    
    @staticmethod
    def use_coupon(code: str, user_id: str, discount_applied: float) -> None:
        """
        Registra uso de cupom
        
        Args:
            code: Código do cupom
            user_id: ID do usuário
            discount_applied: Desconto aplicado em reais
        """
        
        code = code.upper()
        coupon = SubscriptionService.coupons.get(code)
        
        if coupon:
            coupon["current_uses"] += 1
            
            SubscriptionService.coupon_usage.append({
                "coupon_code": code,
                "user_id": user_id,
                "discount_applied": discount_applied,
                "used_at": datetime.now()
            })
    
    @staticmethod
    def list_coupons() -> List[Dict[str, Any]]:
        """
        Lista todos os cupons
        
        Returns:
            Lista de cupons
        """
        
        return list(SubscriptionService.coupons.values())
    
    @staticmethod
    def deactivate_coupon(code: str) -> Dict[str, Any]:
        """
        Desativa um cupom
        
        Args:
            code: Código do cupom
            
        Returns:
            Cupom desativado
        """
        
        code = code.upper()
        coupon = SubscriptionService.coupons.get(code)
        
        if coupon:
            coupon["is_active"] = False
        
        return coupon
