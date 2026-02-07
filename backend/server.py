from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
import random
import string

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Security
SECRET_KEY = os.environ['SECRET_KEY']
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# ============== CREATE APP ==============
app = FastAPI()

# ============== CORS - DEVE SER ANTES DO ROUTER! ==============
# MUITO IMPORTANTE: O CORS deve ser adicionado ANTES de incluir as rotas
cors_origins_str = os.environ.get('CORS_ORIGINS', '*')

if cors_origins_str == '*':
    cors_origins = ['*']
else:
    cors_origins = [origin.strip() for origin in cors_origins_str.split(',') if origin.strip()]

print(f"🔧 CORS configurado para: {cors_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# ============== CREATE ROUTER ==============
api_router = APIRouter(prefix="/api")

# ============== MODELS ==============

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    brand_name: Optional[str] = None
    profile_photo: Optional[str] = None
    push_subscription: Optional[dict] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    brand_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class Client(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ClientCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[EmailStr] = None

class Event(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    client_id: str
    event_type: str
    event_date: str  # formato ISO: 2025-02-06T14:00:00
    location: str = ""
    status: str = "confirmado"
    total_value: float
    amount_paid: float = 0
    remaining_installments: int = 1
    notes: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EventCreate(BaseModel):
    client_id: str
    event_type: str
    event_date: str  # formato: 2025-02-06T14:00:00
    location: Optional[str] = ""
    total_value: float
    amount_paid: float = 0
    remaining_installments: int = 1
    notes: Optional[str] = ""
    status: str = "confirmado"

class Payment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    event_id: str
    installment_number: int
    amount: float
    due_date: str
    paid: bool = False
    paid_date: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PaymentCreate(BaseModel):
    event_id: str
    installment_number: int
    amount: float
    due_date: str

class Gallery(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    event_id: Optional[str] = None
    name: str
    photos_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class GalleryCreate(BaseModel):
    event_id: Optional[str] = None
    name: str

class DashboardStats(BaseModel):
    total_clients: int
    total_events: int
    total_revenue: float
    pending_payments: float
    upcoming_events: List[Event]

# ============== PASSWORD RECOVERY MODELS ==============

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class VerifyResetCodeRequest(BaseModel):
    email: EmailStr
    code: str

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    code: str
    new_password: str

# ============== SUBSCRIPTION MODELS ==============

class Subscription(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    plan: str = "trial"  # trial, active, cancelled
    price: float = 19.90
    status: str = "active"  # active, cancelled, past_due
    trial_end_date: datetime
    current_period_start: datetime
    current_period_end: datetime
    mercado_pago_subscription_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MercadoPagoWebhook(BaseModel):
    action: str
    api_version: str
    data: dict
    date_created: str
    id: int
    live_mode: bool
    type: str
    user_id: str


# ============== AUTH FUNCTIONS ==============

def verify_password(plain_password, hashed_password):
    """Verifica senha limitando a 72 bytes (limite do bcrypt)"""
    # Bcrypt tem limite de 72 bytes
    if len(plain_password.encode('utf-8')) > 72:
        plain_password = plain_password[:72]
    
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except ValueError as e:
        print(f"❌ Erro ao verificar senha: {e}")
        return False

def get_password_hash(password):
    """Cria hash da senha limitando a 72 bytes (limite do bcrypt)"""
    # Bcrypt tem limite de 72 bytes
    if len(password.encode('utf-8')) > 72:
        password = password[:72]
    
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Não foi possível validar as credenciais",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user_doc = await db.users.find_one({"email": email}, {"_id": 0})
    if user_doc is None:
        raise credentials_exception
    
    if isinstance(user_doc.get('created_at'), str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    return User(**user_doc)

# ============== AUTH ROUTES ==============

@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    user = User(
        email=user_data.email,
        name=user_data.name,
        brand_name=user_data.brand_name
    )
    
    user_dict = user.model_dump()
    user_dict['password_hash'] = get_password_hash(user_data.password)
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    
    await db.users.insert_one(user_dict)
    
    access_token = create_access_token(data={"sub": user.email})
    
    return Token(access_token=access_token, token_type="bearer", user=user)

@api_router.post("/auth/login", response_model=Token)
async def login(user_data: UserLogin):
    user_doc = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    
    if not verify_password(user_data.password, user_doc['password_hash']):
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    
    if isinstance(user_doc['created_at'], str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    user = User(**user_doc)
    access_token = create_access_token(data={"sub": user.email})
    
    return Token(access_token=access_token, token_type="bearer", user=user)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@api_router.post("/auth/push-subscription")
async def save_push_subscription(subscription: dict, current_user: User = Depends(get_current_user)):
    """Salva a subscription de push notifications do usuário"""
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": {"push_subscription": subscription}}
    )
    return {"message": "Subscription salva com sucesso"}

@api_router.delete("/auth/push-subscription")
async def delete_push_subscription(current_user: User = Depends(get_current_user)):
    """Remove a subscription de push notifications"""
    await db.users.update_one(
        {"id": current_user.id},
        {"$unset": {"push_subscription": ""}}
    )
    return {"message": "Subscription removida com sucesso"}

# ============== PASSWORD RECOVERY ROUTES ==============

@api_router.post("/auth/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    """
    Envia código de recuperação por email
    """
    user_doc = await db.users.find_one({"email": request.email}, {"_id": 0})
    if not user_doc:
        # Por segurança, sempre retorna sucesso mesmo se o email não existir
        return {"message": "Se o email existir, você receberá um código de recuperação"}
    
    # Gerar código de 6 dígitos
    reset_code = ''.join(random.choices(string.digits, k=6))
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
    
    # Salvar código no banco
    await db.password_resets.update_one(
        {"email": request.email},
        {
            "$set": {
                "code": reset_code,
                "expires_at": expires_at.isoformat(),
                "used": False
            }
        },
        upsert=True
    )
    
    # Enviar email (em produção, descomentar isso)
    # from email_service import send_reset_code_email
    # send_reset_code_email(request.email, reset_code, user_doc.get('name', 'Usuário'))
    
    # MODO DEBUG - Imprime no console
    print(f"🔑 Código de recuperação para {request.email}: {reset_code}")
    print(f"⏰ Válido até: {expires_at}")
    
    return {"message": "Se o email existir, você receberá um código de recuperação"}

@api_router.post("/auth/verify-reset-code")
async def verify_reset_code(request: VerifyResetCodeRequest):
    """
    Verifica se o código de recuperação é válido
    """
    reset_doc = await db.password_resets.find_one({"email": request.email}, {"_id": 0})
    
    if not reset_doc:
        raise HTTPException(status_code=400, detail="Código inválido ou expirado")
    
    # Verificar se o código está correto
    if reset_doc['code'] != request.code:
        raise HTTPException(status_code=400, detail="Código incorreto")
    
    # Verificar se o código já foi usado
    if reset_doc.get('used', False):
        raise HTTPException(status_code=400, detail="Este código já foi utilizado")
    
    # Verificar se o código expirou
    expires_at = datetime.fromisoformat(reset_doc['expires_at'])
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=400, detail="Código expirado. Solicite um novo código.")
    
    return {"message": "Código válido", "email": request.email}

@api_router.post("/auth/reset-password")
async def reset_password(request: ResetPasswordRequest):
    """
    Reseta a senha usando o código de verificação
    """
    # Verificar código novamente
    reset_doc = await db.password_resets.find_one({"email": request.email}, {"_id": 0})
    
    if not reset_doc or reset_doc['code'] != request.code or reset_doc.get('used', False):
        raise HTTPException(status_code=400, detail="Código inválido")
    
    # Verificar expiração
    expires_at = datetime.fromisoformat(reset_doc['expires_at'])
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=400, detail="Código expirado")
    
    # Atualizar senha do usuário
    new_password_hash = get_password_hash(request.new_password)
    await db.users.update_one(
        {"email": request.email},
        {"$set": {"password_hash": new_password_hash}}
    )
    
    # Marcar código como usado
    await db.password_resets.update_one(
        {"email": request.email},
        {"$set": {"used": True}}
    )
    
    print(f"✅ Senha resetada com sucesso para {request.email}")
    
    return {"message": "Senha alterada com sucesso! Você já pode fazer login."}

# ============== CLIENT ROUTES ==============

@api_router.post("/clients", response_model=Client)
async def create_client(client_data: ClientCreate, current_user: User = Depends(get_current_user)):
    client = Client(user_id=current_user.id, **client_data.model_dump())
    doc = client.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.clients.insert_one(doc)
    return client

@api_router.get("/clients", response_model=List[Client])
async def get_clients(current_user: User = Depends(get_current_user)):
    clients = await db.clients.find({"user_id": current_user.id}, {"_id": 0}).to_list(1000)
    for client in clients:
        if isinstance(client['created_at'], str):
            client['created_at'] = datetime.fromisoformat(client['created_at'])
    return clients

@api_router.get("/clients/{client_id}", response_model=Client)
async def get_client(client_id: str, current_user: User = Depends(get_current_user)):
    client = await db.clients.find_one({"id": client_id, "user_id": current_user.id}, {"_id": 0})
    if not client:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    if isinstance(client['created_at'], str):
        client['created_at'] = datetime.fromisoformat(client['created_at'])
    return Client(**client)

@api_router.delete("/clients/{client_id}")
async def delete_client(client_id: str, current_user: User = Depends(get_current_user)):
    result = await db.clients.delete_one({"id": client_id, "user_id": current_user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return {"message": "Cliente deletado com sucesso"}

# ============== EVENT ROUTES ==============

@api_router.post("/events", response_model=Event)
async def create_event(event_data: EventCreate, current_user: User = Depends(get_current_user)):
    print(f"📝 Criando evento: {event_data.model_dump()}")  # Debug log
    event = Event(user_id=current_user.id, **event_data.model_dump())
    doc = event.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    print(f"✅ Documento a ser inserido: {doc}")  # Debug log
    await db.events.insert_one(doc)
    print(f"✅ Evento criado com sucesso: {event.id}")  # Debug log
    return event

@api_router.get("/events", response_model=List[Event])
async def get_events(current_user: User = Depends(get_current_user)):
    events = await db.events.find({"user_id": current_user.id}, {"_id": 0}).to_list(1000)
    for event in events:
        if isinstance(event['created_at'], str):
            event['created_at'] = datetime.fromisoformat(event['created_at'])
    return events

@api_router.get("/events/{event_id}", response_model=Event)
async def get_event(event_id: str, current_user: User = Depends(get_current_user)):
    event = await db.events.find_one({"id": event_id, "user_id": current_user.id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    if isinstance(event['created_at'], str):
        event['created_at'] = datetime.fromisoformat(event['created_at'])
    return Event(**event)

@api_router.put("/events/{event_id}", response_model=Event)
async def update_event(event_id: str, event_data: EventCreate, current_user: User = Depends(get_current_user)):
    result = await db.events.update_one(
        {"id": event_id, "user_id": current_user.id},
        {"$set": event_data.model_dump()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    return await get_event(event_id, current_user)

@api_router.delete("/events/{event_id}")
async def delete_event(event_id: str, current_user: User = Depends(get_current_user)):
    result = await db.events.delete_one({"id": event_id, "user_id": current_user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    return {"message": "Evento deletado com sucesso"}

# ============== PAYMENT ROUTES ==============

@api_router.post("/payments", response_model=Payment)
async def create_payment(payment_data: PaymentCreate, current_user: User = Depends(get_current_user)):
    payment = Payment(user_id=current_user.id, **payment_data.model_dump())
    doc = payment.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.payments.insert_one(doc)
    return payment

@api_router.get("/payments", response_model=List[Payment])
async def get_payments(current_user: User = Depends(get_current_user)):
    payments = await db.payments.find({"user_id": current_user.id}, {"_id": 0}).to_list(1000)
    for payment in payments:
        if isinstance(payment['created_at'], str):
            payment['created_at'] = datetime.fromisoformat(payment['created_at'])
    return payments

@api_router.get("/payments/{payment_id}", response_model=Payment)
async def get_payment(payment_id: str, current_user: User = Depends(get_current_user)):
    payment = await db.payments.find_one({"id": payment_id, "user_id": current_user.id}, {"_id": 0})
    if not payment:
        raise HTTPException(status_code=404, detail="Pagamento não encontrado")
    if isinstance(payment['created_at'], str):
        payment['created_at'] = datetime.fromisoformat(payment['created_at'])
    return Payment(**payment)

@api_router.patch("/payments/{payment_id}/pay")
async def pay_payment(payment_id: str, current_user: User = Depends(get_current_user)):
    result = await db.payments.update_one(
        {"id": payment_id, "user_id": current_user.id},
        {"$set": {"paid": True, "paid_date": datetime.now(timezone.utc).strftime("%Y-%m-%d")}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Pagamento não encontrado")
    
    # Update event amount_paid
    payment = await db.payments.find_one({"id": payment_id}, {"_id": 0})
    event_payments = await db.payments.find({"event_id": payment['event_id'], "paid": True}, {"_id": 0}).to_list(1000)
    total_paid = sum(p['amount'] for p in event_payments)
    await db.events.update_one({"id": payment['event_id']}, {"$set": {"amount_paid": total_paid}})
    
    return {"message": "Pagamento marcado como pago"}

@api_router.delete("/payments/{payment_id}")
async def delete_payment(payment_id: str, current_user: User = Depends(get_current_user)):
    result = await db.payments.delete_one({"id": payment_id, "user_id": current_user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Pagamento não encontrado")
    return {"message": "Pagamento deletado com sucesso"}

# ============== GALLERY ROUTES ==============

@api_router.post("/galleries", response_model=Gallery)
async def create_gallery(gallery_data: GalleryCreate, current_user: User = Depends(get_current_user)):
    gallery = Gallery(user_id=current_user.id, **gallery_data.model_dump())
    doc = gallery.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.galleries.insert_one(doc)
    return gallery

@api_router.get("/galleries", response_model=List[Gallery])
async def get_galleries(current_user: User = Depends(get_current_user)):
    galleries = await db.galleries.find({"user_id": current_user.id}, {"_id": 0}).to_list(1000)
    for gallery in galleries:
        if isinstance(gallery['created_at'], str):
            gallery['created_at'] = datetime.fromisoformat(gallery['created_at'])
    return galleries

# ============== DASHBOARD ROUTES ==============

@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(current_user: User = Depends(get_current_user)):
    clients = await db.clients.find({"user_id": current_user.id}, {"_id": 0}).to_list(1000)
    events = await db.events.find({"user_id": current_user.id}, {"_id": 0}).to_list(1000)
    payments = await db.payments.find({"user_id": current_user.id}, {"_id": 0}).to_list(1000)
    
    total_revenue = sum(p['amount'] for p in payments if p.get('paid', False))
    pending_payments = sum(p['amount'] for p in payments if not p.get('paid', False))
    
    # Get upcoming events (next 5)
    upcoming = sorted(
        [e for e in events if e['status'] in ['confirmado', 'pendente']],
        key=lambda x: x['event_date']
    )[:5]
    
    for event in upcoming:
        if isinstance(event['created_at'], str):
            event['created_at'] = datetime.fromisoformat(event['created_at'])
    
    return DashboardStats(
        total_clients=len(clients),
        total_events=len(events),
        total_revenue=total_revenue,
        pending_payments=pending_payments,
        upcoming_events=upcoming
    )

# ============== INCLUDE ROUTER - DEVE SER DEPOIS DO CORS! ==============
app.include_router(api_router)

# ============== LOGGING ==============
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============== RUN SERVER ==============
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run(app, host="0.0.0.0", port=port)
