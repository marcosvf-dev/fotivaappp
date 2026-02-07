"""
Sistema de Notificações para Eventos Fotográficos
Envia notificações via WhatsApp e Push Notifications em 48h, 24h e 12h antes do evento
"""

from datetime import datetime, timezone, timedelta
from typing import List, Optional
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from twilio.rest import Client
import httpx
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class NotificationService:
    def __init__(self, mongo_url: str, db_name: str):
        self.client = AsyncIOMotorClient(mongo_url)
        self.db = self.client[db_name]
        
        # Configurações WhatsApp (Twilio)
        self.twilio_account_sid = os.getenv('TWILIO_ACCOUNT_SID')
        self.twilio_auth_token = os.getenv('TWILIO_AUTH_TOKEN')
        self.twilio_whatsapp_from = os.getenv('TWILIO_WHATSAPP_FROM', 'whatsapp:+14155238886')
        
        # Push notification configuration
        self.push_service_url = os.getenv('PUSH_SERVICE_URL')
        
    async def check_and_send_notifications(self):
        """Verifica eventos e envia notificações nos horários programados"""
        logger.info("🔔 Verificando eventos para notificações...")
        
        now = datetime.now(timezone.utc)
        
        # Definir janelas de notificação (48h, 24h, 12h antes)
        notification_windows = [
            {'hours': 48, 'label': '48 horas'},
            {'hours': 24, 'label': '24 horas'},
            {'hours': 12, 'label': '12 horas'},
        ]
        
        for window in notification_windows:
            await self._check_window(now, window['hours'], window['label'])
    
    async def _check_window(self, now: datetime, hours_before: int, label: str):
        """Verifica eventos em uma janela específica de tempo"""
        
        # Calcular intervalo de tempo (30 min de margem)
        target_time = now + timedelta(hours=hours_before)
        start_window = target_time - timedelta(minutes=30)
        end_window = target_time + timedelta(minutes=30)
        
        # Buscar eventos nesta janela
        events = await self.db.events.find({
            'event_date': {
                '$gte': start_window.isoformat(),
                '$lte': end_window.isoformat()
            },
            'status': {'$in': ['confirmado', 'pendente']}
        }).to_list(1000)
        
        logger.info(f"📅 Encontrados {len(events)} eventos para notificar em {label}")
        
        for event in events:
            # Verificar se já foi notificado nesta janela
            notification_key = f"notified_{hours_before}h"
            if event.get(notification_key, False):
                continue
            
            # Buscar dados do usuário e cliente
            user = await self.db.users.find_one({'id': event['user_id']})
            client = await self.db.clients.find_one({'id': event['client_id']})
            
            if user and client:
                await self._send_notifications(event, user, client, label)
                
                # Marcar como notificado
                await self.db.events.update_one(
                    {'id': event['id']},
                    {'$set': {notification_key: True}}
                )
    
    async def _send_notifications(self, event: dict, user: dict, client: dict, time_label: str):
        """Envia notificações via WhatsApp e Push"""
        
        event_date = datetime.fromisoformat(event['event_date'])
        event_date_str = event_date.strftime('%d/%m/%Y às %H:%M')
        
        message = self._format_notification_message(event, client, event_date_str, time_label)
        
        # Enviar WhatsApp para o CLIENTE (se tiver número cadastrado)
        # IMPORTANTE: Só funciona em PRODUÇÃO com número Twilio real
        # No Sandbox, você precisa registrar cada número manualmente
        if client.get('phone') and os.getenv('ENABLE_WHATSAPP', 'false').lower() == 'true':
            await self._send_whatsapp(client['phone'], message)
        else:
            logger.info(f"⚠️ WhatsApp desabilitado ou cliente sem telefone. Configure ENABLE_WHATSAPP=true no .env")
        
        # Enviar Push Notification para o USUÁRIO (fotógrafo)
        if user.get('push_subscription'):
            await self._send_push(user['push_subscription'], event, time_label)
        
        logger.info(f"✅ Notificações enviadas para evento {event['event_type']} - {time_label}")
    
    def _format_notification_message(self, event: dict, client: dict, event_date_str: str, time_label: str) -> str:
        """Formata mensagem de notificação"""
        
        emoji_map = {
            '48 horas': '📅',
            '24 horas': '⏰',
            '12 horas': '🔔'
        }
        emoji = emoji_map.get(time_label, '📸')
        
        message = f"""
{emoji} *LEMBRETE DE EVENTO FOTOGRÁFICO*

Faltam *{time_label}* para o seu evento!

*Tipo:* {event['event_type']}
*Cliente:* {client['name']}
*Data:* {event_date_str}
*Local:* {event.get('location', 'Não informado')}

📋 *Valor Total:* R$ {event['total_value']:.2f}
💰 *Já Pago:* R$ {event['amount_paid']:.2f}
⚠️ *Restante:* R$ {event['total_value'] - event['amount_paid']:.2f}

{event.get('notes', '')}

Boa sorte no evento! 📸✨
        """.strip()
        
        return message
    
    async def _send_whatsapp(self, phone: str, message: str):
        """Envia mensagem via WhatsApp usando Twilio"""
        
        if not self.twilio_account_sid or not self.twilio_auth_token:
            logger.warning("⚠️ Credenciais do Twilio não configuradas")
            return
        
        try:
            client = Client(self.twilio_account_sid, self.twilio_auth_token)
            
            # Formatar número para WhatsApp
            # O número deve estar no formato internacional: +5511999999999
            # Se não tiver +, adiciona (assumindo Brasil +55)
            if not phone.startswith('+'):
                phone = '+55' + phone.replace('-', '').replace('(', '').replace(')', '').replace(' ', '')
            
            to_whatsapp = f"whatsapp:{phone}" if not phone.startswith('whatsapp:') else phone
            
            logger.info(f"📱 Enviando WhatsApp para: {to_whatsapp}")
            
            message_sent = client.messages.create(
                body=message,
                from_=self.twilio_whatsapp_from,
                to=to_whatsapp
            )
            
            logger.info(f"✅ WhatsApp enviado: {message_sent.sid}")
            
        except Exception as e:
            logger.error(f"❌ Erro ao enviar WhatsApp: {e}")
            logger.info("💡 DICA: No Sandbox do Twilio, cada número precisa ser registrado manualmente primeiro!")
            logger.info("💡 Para usar em produção, você precisa de um número Twilio verificado.")
    
    async def _send_push(self, subscription: dict, event: dict, time_label: str):
        """Envia Push Notification"""
        
        if not self.push_service_url:
            logger.warning("⚠️ URL do serviço de Push não configurada")
            return
        
        try:
            payload = {
                'subscription': subscription,
                'notification': {
                    'title': f'Evento em {time_label}! 📸',
                    'body': f"{event['event_type']} - {event.get('location', '')}",
                    'icon': '/logo192.png',
                    'badge': '/badge.png',
                    'data': {
                        'event_id': event['id'],
                        'url': f'/eventos/{event["id"]}'
                    }
                }
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.push_service_url}/send-notification",
                    json=payload,
                    timeout=10
                )
                
                if response.status_code == 200:
                    logger.info(f"🔔 Push notification enviada")
                else:
                    logger.error(f"❌ Erro no push: {response.text}")
                    
        except Exception as e:
            logger.error(f"❌ Erro ao enviar Push: {e}")


async def run_notification_scheduler():
    """Executa o verificador de notificações periodicamente"""
    
    mongo_url = os.getenv('MONGO_URL')
    db_name = os.getenv('DB_NAME')
    
    if not mongo_url or not db_name:
        logger.error("❌ MONGO_URL ou DB_NAME não configurados")
        return
    
    service = NotificationService(mongo_url, db_name)
    
    logger.info("🚀 Iniciando serviço de notificações...")
    
    while True:
        try:
            await service.check_and_send_notifications()
        except Exception as e:
            logger.error(f"❌ Erro no scheduler: {e}")
        
        # Verificar a cada 30 minutos
        await asyncio.sleep(1800)


if __name__ == "__main__":
    asyncio.run(run_notification_scheduler())
