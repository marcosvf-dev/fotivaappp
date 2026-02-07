"""
Sistema de Notificações Automáticas - Fotiva
Envia notificações para o FOTÓGRAFO (não cliente) em 48h, 24h e 12h antes dos eventos
"""

import os
import asyncio
import httpx
from datetime import datetime, timedelta
from typing import List, Dict, Any

class NotificationScheduler:
    """Scheduler de notificações"""
    
    def __init__(self):
        self.api_url = os.getenv('BACKEND_URL', 'http://localhost:8000')
        self.enable_whatsapp = os.getenv('ENABLE_WHATSAPP', 'false').lower() == 'true'
    
    async def check_and_send_notifications(self):
        """Verifica eventos e envia notificações quando necessário"""
        
        print("🔔 Verificando eventos para notificar...")
        
        # Pegar todos os eventos
        events = await self.get_all_events()
        
        if not events:
            print("✅ Nenhum evento encontrado")
            return
        
        now = datetime.now()
        notifications_sent = 0
        
        for event in events:
            try:
                # Converter event_date para datetime
                if isinstance(event['event_date'], str):
                    event_date = datetime.fromisoformat(event['event_date'].replace('Z', '+00:00'))
                else:
                    event_date = event['event_date']
                
                # Calcular diferença em horas
                time_until_event = event_date - now
                hours_until = time_until_event.total_seconds() / 3600
                
                # Verificar se precisa notificar
                should_notify = False
                notification_type = ""
                
                # 48 horas antes (entre 47h50 e 48h10)
                if 47.8 <= hours_until <= 48.2:
                    should_notify = True
                    notification_type = "48h"
                
                # 24 horas antes (entre 23h50 e 24h10)
                elif 23.8 <= hours_until <= 24.2:
                    should_notify = True
                    notification_type = "24h"
                
                # 12 horas antes (entre 11h50 e 12h10)
                elif 11.8 <= hours_until <= 12.2:
                    should_notify = True
                    notification_type = "12h"
                
                if should_notify:
                    # Buscar dados do fotógrafo (usuário dono do evento)
                    photographer = await self.get_photographer(event['user_id'])
                    
                    if photographer:
                        await self.send_notification(event, photographer, notification_type)
                        notifications_sent += 1
                        print(f"✅ Notificação enviada: {event['event_type']} - {notification_type}")
                    
            except Exception as e:
                print(f"❌ Erro ao processar evento {event.get('id')}: {str(e)}")
                continue
        
        print(f"🎉 Total de notificações enviadas: {notifications_sent}")
    
    async def get_all_events(self) -> List[Dict[str, Any]]:
        """Busca todos os eventos do sistema"""
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.api_url}/api/events/all")
                
                if response.status_code == 200:
                    return response.json()
                
                return []
                
        except Exception as e:
            print(f"❌ Erro ao buscar eventos: {str(e)}")
            return []
    
    async def get_photographer(self, user_id: str) -> Dict[str, Any]:
        """Busca dados do fotógrafo pelo ID"""
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.api_url}/api/users/{user_id}")
                
                if response.status_code == 200:
                    return response.json()
                
                return None
                
        except Exception as e:
            print(f"❌ Erro ao buscar fotógrafo: {str(e)}")
            return None
    
    async def send_notification(
        self,
        event: Dict[str, Any],
        photographer: Dict[str, Any],
        notification_type: str
    ):
        """Envia notificação para o fotógrafo"""
        
        # Preparar mensagem
        message = self.create_notification_message(event, notification_type)
        
        # Enviar Push Notification
        await self.send_push_notification(photographer, message, event)
        
        # Enviar WhatsApp (apenas se ativado e fotógrafo tiver telefone)
        if self.enable_whatsapp and photographer.get('phone'):
            await self.send_whatsapp(photographer['phone'], message)
    
    def create_notification_message(
        self,
        event: Dict[str, Any],
        notification_type: str
    ) -> str:
        """Cria mensagem de notificação"""
        
        # Emojis para cada tipo
        emoji_map = {
            "48h": "📅",
            "24h": "⏰",
            "12h": "🚨"
        }
        
        emoji = emoji_map.get(notification_type, "🔔")
        time_text = notification_type.replace('h', ' horas')
        
        # Formatar data/hora
        if isinstance(event['event_date'], str):
            event_date = datetime.fromisoformat(event['event_date'].replace('Z', '+00:00'))
        else:
            event_date = event['event_date']
        
        date_str = event_date.strftime('%d/%m/%Y às %H:%M')
        
        # Calcular valores
        total = event.get('total_value', 0)
        paid = event.get('amount_paid', 0)
        remaining = total - paid
        
        message = f"""{emoji} Lembrete: Faltam {time_text}!

📸 Evento: {event['event_type']}
👤 Cliente: {event['client_name']}
📍 Local: {event['location']}
🗓️ Data: {date_str}

💰 Valores:
• Total: R$ {total:.2f}
• Pago: R$ {paid:.2f}
• Restante: R$ {remaining:.2f}

Boa sorte no evento! 📸✨"""
        
        return message
    
    async def send_push_notification(
        self,
        photographer: Dict[str, Any],
        message: str,
        event: Dict[str, Any]
    ):
        """Envia Push Notification para o fotógrafo"""
        
        try:
            if not photographer.get('push_subscription'):
                print(f"⚠️ Fotógrafo {photographer.get('name')} não tem push ativado")
                return
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.api_url}/api/push/send",
                    json={
                        "user_id": photographer['id'],
                        "title": f"Evento: {event['event_type']}",
                        "body": message,
                        "icon": "/fotiva-icon-192.png",
                        "badge": "/fotiva-icon-192.png"
                    }
                )
                
                if response.status_code == 200:
                    print(f"✅ Push enviado para {photographer.get('name')}")
                else:
                    print(f"❌ Erro ao enviar push: {response.status_code}")
                    
        except Exception as e:
            print(f"❌ Erro ao enviar push notification: {str(e)}")
    
    async def send_whatsapp(self, phone: str, message: str):
        """Envia mensagem via WhatsApp (Twilio)"""
        
        if not self.enable_whatsapp:
            print("⚠️ WhatsApp desativado (ENABLE_WHATSAPP=false)")
            return
        
        try:
            from twilio.rest import Client
            
            account_sid = os.getenv('TWILIO_ACCOUNT_SID')
            auth_token = os.getenv('TWILIO_AUTH_TOKEN')
            from_whatsapp = os.getenv('TWILIO_WHATSAPP_FROM')
            
            if not all([account_sid, auth_token, from_whatsapp]):
                print("❌ Credenciais do Twilio não configuradas")
                return
            
            client = Client(account_sid, auth_token)
            
            # Formatar número (adicionar +55 se não tiver)
            if not phone.startswith('+'):
                phone = '+55' + phone.replace('(', '').replace(')', '').replace('-', '').replace(' ', '')
            
            # Enviar mensagem
            client.messages.create(
                from_=f'whatsapp:{from_whatsapp}',
                to=f'whatsapp:{phone}',
                body=message
            )
            
            print(f"✅ WhatsApp enviado para {phone}")
            
        except Exception as e:
            print(f"❌ Erro ao enviar WhatsApp: {str(e)}")


# ========================================
# EXECUTAR SCHEDULER
# ========================================

async def run_scheduler():
    """Roda o scheduler em loop infinito"""
    
    scheduler = NotificationScheduler()
    
    print("🚀 Scheduler de notificações iniciado!")
    print(f"⏰ Verificando eventos a cada 10 minutos")
    print(f"📱 WhatsApp: {'✅ Ativado' if scheduler.enable_whatsapp else '❌ Desativado'}")
    print("")
    
    while True:
        try:
            await scheduler.check_and_send_notifications()
            
            # Aguardar 10 minutos antes da próxima verificação
            await asyncio.sleep(600)  # 600 segundos = 10 minutos
            
        except Exception as e:
            print(f"❌ Erro no scheduler: {str(e)}")
            await asyncio.sleep(60)  # Em caso de erro, aguarda 1 minuto


if __name__ == "__main__":
    # Rodar o scheduler
    asyncio.run(run_scheduler())
