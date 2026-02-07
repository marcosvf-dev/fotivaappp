from pydantic import BaseModel
from datetime import datetime
from typing import Optional

# ========================================
# MODELOS DE ASSINATURA
# ========================================

class SubscriptionPlan(BaseModel):
    """Plano de assinatura"""
    id: str
    name: str
    price: float
    duration_days: int
    features: list[str]
    is_active: bool = True

class UserSubscription(BaseModel):
    """Assinatura do usuário"""
    user_id: str
    plan_id: str
    status: str  # trial, active, cancelled, expired
    trial_start: Optional[datetime] = None
    trial_end: Optional[datetime] = None
    subscription_start: Optional[datetime] = None
    subscription_end: Optional[datetime] = None
    mercadopago_subscription_id: Optional[str] = None
    auto_renew: bool = True
    cancelled_at: Optional[datetime] = None

class Coupon(BaseModel):
    """Cupom de desconto"""
    code: str
    discount_type: str  # percentage, fixed, free_months
    discount_value: float  # 50 (para 50%), 10.00 (para R$10), 3 (para 3 meses)
    max_uses: Optional[int] = None
    current_uses: int = 0
    valid_from: datetime
    valid_until: Optional[datetime] = None
    is_active: bool = True
    created_by: str
    created_at: datetime

class CouponUsage(BaseModel):
    """Uso de cupom"""
    coupon_code: str
    user_id: str
    used_at: datetime
    discount_applied: float

class Payment(BaseModel):
    """Registro de pagamento"""
    id: str
    user_id: str
    amount: float
    status: str  # pending, approved, rejected, refunded
    payment_method: str
    mercadopago_payment_id: Optional[str] = None
    coupon_code: Optional[str] = None
    discount_applied: float = 0.0
    created_at: datetime
    updated_at: datetime

# ========================================
# MODELOS DE REQUEST/RESPONSE
# ========================================

class CouponCreate(BaseModel):
    """Criar cupom"""
    code: str
    discount_type: str
    discount_value: float
    max_uses: Optional[int] = None
    valid_from: datetime
    valid_until: Optional[datetime] = None

class CouponValidate(BaseModel):
    """Validar cupom"""
    code: str

class SubscriptionCreate(BaseModel):
    """Criar assinatura"""
    plan_id: str
    payment_method_id: str  # ID do método de pagamento do Mercado Pago
    coupon_code: Optional[str] = None

class SubscriptionCancel(BaseModel):
    """Cancelar assinatura"""
    reason: Optional[str] = None
