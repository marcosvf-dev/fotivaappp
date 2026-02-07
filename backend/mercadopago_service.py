import mercadopago
import os
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

class MercadoPagoService:
    """Serviço de integração com Mercado Pago"""
    
    def __init__(self):
        self.access_token = os.getenv('MERCADOPAGO_ACCESS_TOKEN')
        self.sdk = mercadopago.SDK(self.access_token)
        
    def create_subscription(
        self,
        user_email: str,
        plan_price: float,
        payer_id: str,
        payment_method_id: str,
        description: str = "Assinatura Fotiva"
    ) -> Dict[str, Any]:
        """
        Cria uma assinatura recorrente no Mercado Pago
        
        Args:
            user_email: Email do usuário
            plan_price: Preço do plano (ex: 19.90)
            payer_id: ID do pagador no Mercado Pago
            payment_method_id: ID do método de pagamento
            description: Descrição da assinatura
            
        Returns:
            Dict com dados da assinatura criada
        """
        
        # Data de início (próximo mês)
        start_date = datetime.now() + timedelta(days=30)
        
        subscription_data = {
            "reason": description,
            "auto_recurring": {
                "frequency": 1,
                "frequency_type": "months",
                "transaction_amount": plan_price,
                "currency_id": "BRL",
                "start_date": start_date.isoformat(),
            },
            "back_url": os.getenv('FRONTEND_URL', 'http://localhost:3000') + "/subscription/success",
            "payer_email": user_email,
            "payment_method_id": payment_method_id,
        }
        
        result = self.sdk.subscription().create(subscription_data)
        return result
    
    def create_payment(
        self,
        amount: float,
        description: str,
        payer_email: str,
        payment_method_id: str,
        installments: int = 1
    ) -> Dict[str, Any]:
        """
        Cria um pagamento único (para o primeiro mês)
        
        Args:
            amount: Valor a cobrar
            description: Descrição do pagamento
            payer_email: Email do pagador
            payment_method_id: ID do método de pagamento
            installments: Número de parcelas
            
        Returns:
            Dict com dados do pagamento
        """
        
        payment_data = {
            "transaction_amount": float(amount),
            "description": description,
            "payment_method_id": payment_method_id,
            "installments": installments,
            "payer": {
                "email": payer_email
            },
            "notification_url": os.getenv('BACKEND_URL', 'http://localhost:8000') + "/api/payments/webhook"
        }
        
        result = self.sdk.payment().create(payment_data)
        return result
    
    def cancel_subscription(self, subscription_id: str) -> Dict[str, Any]:
        """
        Cancela uma assinatura
        
        Args:
            subscription_id: ID da assinatura no Mercado Pago
            
        Returns:
            Dict com resultado do cancelamento
        """
        
        result = self.sdk.subscription().update(
            subscription_id,
            {"status": "cancelled"}
        )
        return result
    
    def get_subscription(self, subscription_id: str) -> Dict[str, Any]:
        """
        Busca informações de uma assinatura
        
        Args:
            subscription_id: ID da assinatura
            
        Returns:
            Dict com dados da assinatura
        """
        
        result = self.sdk.subscription().get(subscription_id)
        return result
    
    def get_payment(self, payment_id: str) -> Dict[str, Any]:
        """
        Busca informações de um pagamento
        
        Args:
            payment_id: ID do pagamento
            
        Returns:
            Dict com dados do pagamento
        """
        
        result = self.sdk.payment().get(payment_id)
        return result
    
    def apply_discount(self, amount: float, discount_type: str, discount_value: float) -> float:
        """
        Aplica desconto a um valor
        
        Args:
            amount: Valor original
            discount_type: Tipo de desconto (percentage, fixed)
            discount_value: Valor do desconto
            
        Returns:
            Valor final com desconto aplicado
        """
        
        if discount_type == "percentage":
            discount = amount * (discount_value / 100)
            return round(amount - discount, 2)
        elif discount_type == "fixed":
            return round(max(0, amount - discount_value), 2)
        
        return amount
