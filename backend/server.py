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

app = FastAPI()

# ============== CORS MIDDLEWARE (MUST BE BEFORE ROUTES) ==============
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter(prefix="/api")

# ============== MODELS ==============

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    full_name: str
    password: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class Client(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    email: EmailStr
    phone: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ClientCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str

class Event(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    client_id: str
    client_name: str
    name: str
    date: str
    time: str
    location: str
    total_value: float
    paid_amount: float = 0
    remaining_installments: int = 1
    notes: Optional[str] = None
    status: str = "confirmado"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EventCreate(BaseModel):
    client_id: str
    client_name: str
    name: str
    date: str
    time: str
    location: str
    total_value: float
    paid_amount: float = 0
    remaining_installments: int = 1
    notes: Optional[str] = None
    status: str = "confirmado"

class EventUpdate(BaseModel):
    client_id: Optional[str] = None
    client_name: Optional[str] = None
    name: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    location: Optional[str] = None
    total_value: Optional[float] = None
    paid_amount: Optional[float] = None
    remaining_installments: Optional[int] = None
    notes: Optional[str] = None
    status: Optional[str] = None

class Payment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    event_id: str
    client_id: str
    client_name: str
    event_name: str
    installment_number: int
    total_installments: int
    amount: float
    due_date: str
    paid: bool = False
    paid_date: Optional[str] = None
    payment_link: Optional[str] = None  # ← NOVO: Link de pagamento
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PaymentCreate(BaseModel):
    event_id: str
    client_id: str
    client_name: str
    event_name: str
    installment_number: int
    total_installments: int
    amount: float
    due_date: str

class PaymentUpdate(BaseModel):
    amount: Optional[float] = None
    due_date: Optional[str] = None
    paid: Optional[bool] = None
    paid_date: Optional[str] = None

class Gallery(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    event_id: Optional[str] = None
    name: str
    date: str
    photo_count: int = 0
    thumbnail: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class GalleryCreate(BaseModel):
    event_id: Optional[str] = None
    name: str
    date: str
    thumbnail: Optional[str] = None

class DashboardMetrics(BaseModel):
    monthly_revenue: float
    confirmed_events: int
    photos_delivered: int
    pending_payments: float
    revenue_trend: float
    upcoming_events: List[Event]
    monthly_revenue_chart: List[dict]

# ============== AUTH FUNCTIONS ==============

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
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
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception
    user = await db.users.find_one({"email": token_data.email}, {"_id": 0})
    if user is None:
        raise credentials_exception
    if isinstance(user['created_at'], str):
        user['created_at'] = datetime.fromisoformat(user['created_at'])
    return User(**user)

# ============== HELPER FUNCTIONS ==============

def generate_payment_link(payment_id: str, amount: float, client_name: str) -> str:
    """
    Gera um link de pagamento fictício (pode ser integrado com Mercado Pago, Stripe, etc.)
    """
    # Por enquanto, retorna um link fictício
    # Em produção, você pode integrar com:
    # - Mercado Pago
    # - PicPay
    # - PagSeguro
    # - Stripe
    # - etc.
    
    return f"https://pay.fotiva.app/p/{payment_id}?amount={amount}&name={client_name.replace(' ', '+')}"

# ============== AUTH ROUTES ==============

@api_router.post("/auth/register", response_model=User)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    user = User(**user_data.model_dump())
    user.password = get_password_hash(user.password)
    doc = user.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.users.insert_one(doc)
    return user

@api_router.post("/auth/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user_doc = await db.users.find_one({"email": form_data.username})
    if not user_doc or not verify_password(form_data.password, user_doc['password']):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user_doc['email']})
    return {"access_token": access_token, "token_type": "bearer"}

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

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

# ============== EVENT ROUTES ==============

@api_router.post("/events", response_model=Event)
async def create_event(event_data: EventCreate, current_user: User = Depends(get_current_user)):
    event = Event(user_id=current_user.id, **event_data.model_dump())
    doc = event.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.events.insert_one(doc)
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
async def update_event(event_id: str, event_data: EventUpdate, current_user: User = Depends(get_current_user)):
    update_data = {k: v for k, v in event_data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="Nenhum dado para atualizar")
    
    result = await db.events.update_one(
        {"id": event_id, "user_id": current_user.id},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    
    updated_event = await db.events.find_one({"id": event_id}, {"_id": 0})
    if isinstance(updated_event['created_at'], str):
        updated_event['created_at'] = datetime.fromisoformat(updated_event['created_at'])
    return Event(**updated_event)

@api_router.delete("/events/{event_id}")
async def delete_event(event_id: str, current_user: User = Depends(get_current_user)):
    result = await db.events.delete_one({"id": event_id, "user_id": current_user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    
    # Delete associated payments
    await db.payments.delete_many({"event_id": event_id, "user_id": current_user.id})
    
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

@api_router.put("/payments/{payment_id}", response_model=Payment)
async def update_payment(payment_id: str, payment_data: PaymentUpdate, current_user: User = Depends(get_current_user)):
    """
    Atualiza um pagamento (editar valor, data de vencimento, status de pago)
    """
    update_data = {k: v for k, v in payment_data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="Nenhum dado para atualizar")
    
    result = await db.payments.update_one(
        {"id": payment_id, "user_id": current_user.id},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Pagamento não encontrado")
    
    # Se marcou como pago, atualizar o paid_amount do evento
    if update_data.get('paid'):
        payment_doc = await db.payments.find_one({"id": payment_id}, {"_id": 0, "event_id": 1})
        if payment_doc:
            event_id = payment_doc['event_id']
            all_payments = await db.payments.find({"event_id": event_id}, {"_id": 0, "amount": 1, "paid": 1}).to_list(1000)
            total_paid = sum(p['amount'] for p in all_payments if p.get('paid', False))
            await db.events.update_one({"id": event_id}, {"$set": {"paid_amount": total_paid}})
    
    updated_payment = await db.payments.find_one({"id": payment_id}, {"_id": 0})
    if isinstance(updated_payment['created_at'], str):
        updated_payment['created_at'] = datetime.fromisoformat(updated_payment['created_at'])
    return Payment(**updated_payment)

@api_router.delete("/payments/{payment_id}")
async def delete_payment(payment_id: str, current_user: User = Depends(get_current_user)):
    """
    Deleta um pagamento
    """
    # Get payment info before deleting
    payment_doc = await db.payments.find_one({"id": payment_id, "user_id": current_user.id}, {"_id": 0, "event_id": 1, "amount": 1, "paid": 1})
    if not payment_doc:
        raise HTTPException(status_code=404, detail="Pagamento não encontrado")
    
    result = await db.payments.delete_one({"id": payment_id, "user_id": current_user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Pagamento não encontrado")
    
    # Update event paid_amount if payment was paid
    if payment_doc.get('paid'):
        event_id = payment_doc['event_id']
        all_payments = await db.payments.find({"event_id": event_id}, {"_id": 0, "amount": 1, "paid": 1}).to_list(1000)
        total_paid = sum(p['amount'] for p in all_payments if p.get('paid', False))
        await db.events.update_one({"id": event_id}, {"$set": {"paid_amount": total_paid}})
    
    return {"message": "Pagamento deletado com sucesso"}

@api_router.patch("/payments/{payment_id}/mark-paid")
async def mark_payment_paid(payment_id: str, current_user: User = Depends(get_current_user)):
    paid_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    result = await db.payments.update_one(
        {"id": payment_id, "user_id": current_user.id},
        {"$set": {"paid": True, "paid_date": paid_date}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Pagamento não encontrado")
    
    # Update event paid_amount
    payment_doc = await db.payments.find_one({"id": payment_id}, {"_id": 0, "event_id": 1, "amount": 1})
    if payment_doc:
        event_id = payment_doc['event_id']
        all_payments = await db.payments.find({"event_id": event_id}, {"_id": 0, "amount": 1, "paid": 1}).to_list(1000)
        total_paid = sum(p['amount'] for p in all_payments if p.get('paid', False))
        await db.events.update_one({"id": event_id}, {"$set": {"paid_amount": total_paid}})
    
    return {"message": "Pagamento marcado como pago"}

@api_router.post("/payments/{payment_id}/generate-link")
async def generate_payment_link_route(payment_id: str, current_user: User = Depends(get_current_user)):
    """
    Gera um link de pagamento para a parcela
    """
    payment = await db.payments.find_one({"id": payment_id, "user_id": current_user.id}, {"_id": 0})
    if not payment:
        raise HTTPException(status_code=404, detail="Pagamento não encontrado")
    
    # Gerar link de pagamento
    payment_link = generate_payment_link(payment_id, payment['amount'], payment['client_name'])
    
    # Salvar o link no pagamento
    await db.payments.update_one(
        {"id": payment_id, "user_id": current_user.id},
        {"$set": {"payment_link": payment_link}}
    )
    
    return {"payment_link": payment_link, "message": "Link de pagamento gerado com sucesso"}

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

@api_router.get("/dashboard/metrics", response_model=DashboardMetrics)
async def get_dashboard_metrics(current_user: User = Depends(get_current_user)):
    # Get current month revenue
    events = await db.events.find({"user_id": current_user.id}, {"_id": 0}).to_list(1000)
    payments = await db.payments.find({"user_id": current_user.id, "paid": True}, {"_id": 0}).to_list(1000)
    pending_payments = await db.payments.find({"user_id": current_user.id, "paid": False}, {"_id": 0}).to_list(1000)
    galleries = await db.galleries.find({"user_id": current_user.id}, {"_id": 0}).to_list(1000)
    
    monthly_revenue = sum(p['amount'] for p in payments)
    confirmed_events = len([e for e in events if e['status'] == 'confirmado'])
    photos_delivered = sum(g['photo_count'] for g in galleries)
    pending_payments_total = sum(p['amount'] for p in pending_payments)
    
    # Upcoming events (próximos 5)
    sorted_events = sorted(events, key=lambda x: x['date'])[:5]
    for event in sorted_events:
        if isinstance(event['created_at'], str):
            event['created_at'] = datetime.fromisoformat(event['created_at'])
    
    # Monthly revenue chart
    months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
    monthly_data = [{"month": month, "revenue": 0} for month in months]
    
    return DashboardMetrics(
        monthly_revenue=monthly_revenue,
        confirmed_events=confirmed_events,
        photos_delivered=photos_delivered,
        pending_payments=pending_payments_total,
        revenue_trend=5.2,
        upcoming_events=sorted_events,
        monthly_revenue_chart=monthly_data
    )

app.include_router(api_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
