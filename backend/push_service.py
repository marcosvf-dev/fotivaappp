"""
Serviço de Push Notifications usando Web Push
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from pywebpush import webpush, WebPushException
import json
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# VAPID keys - Gerar usando: webpush.generate_vapid_keys()
VAPID_PRIVATE_KEY = os.getenv('VAPID_PRIVATE_KEY')
VAPID_PUBLIC_KEY = os.getenv('VAPID_PUBLIC_KEY')
VAPID_CLAIMS = {
    "sub": "mailto:contato@fotivaapp.com"
}


class PushSubscription(BaseModel):
    endpoint: str
    keys: dict


class PushNotificationRequest(BaseModel):
    subscription: PushSubscription
    notification: dict


@app.post("/send-notification")
async def send_push_notification(request: PushNotificationRequest):
    """Envia uma push notification para o dispositivo inscrito"""
    
    if not VAPID_PRIVATE_KEY or not VAPID_PUBLIC_KEY:
        raise HTTPException(status_code=500, detail="VAPID keys não configuradas")
    
    try:
        subscription_info = {
            "endpoint": request.subscription.endpoint,
            "keys": request.subscription.keys
        }
        
        # Enviar notificação
        webpush(
            subscription_info=subscription_info,
            data=json.dumps(request.notification),
            vapid_private_key=VAPID_PRIVATE_KEY,
            vapid_claims=VAPID_CLAIMS
        )
        
        logger.info(f"✅ Push notification enviada com sucesso")
        return {"status": "success", "message": "Notificação enviada"}
        
    except WebPushException as e:
        logger.error(f"❌ Erro ao enviar push: {e}")
        
        # Se a subscription expirou, retornar 410
        if e.response and e.response.status_code == 410:
            raise HTTPException(status_code=410, detail="Subscription expirada")
        
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/vapid-public-key")
async def get_vapid_public_key():
    """Retorna a chave pública VAPID para o frontend"""
    if not VAPID_PUBLIC_KEY:
        raise HTTPException(status_code=500, detail="VAPID public key não configurada")
    
    return {"publicKey": VAPID_PUBLIC_KEY}


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PUSH_PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
