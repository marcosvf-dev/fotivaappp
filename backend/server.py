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

# ============== SEGURANÇA ==============
SECRET_KEY = os.environ['SECRET_KEY']
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 dias

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# ============== BANCO DE DADOS ==============
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# ============== CRIAR APP ==============
app = FastAPI()

# ============== CONFIGURAÇÃO DO CORS (IMPORTANTE!) ==============
# 
# Esta configuração permite que seu FRONTEND se comunique com o BACKEND
# sem ser bloqueado pelo navegador.
#
# O que cada parâmetro faz:
# - allow_credentials: permite envio de cookies e headers de autenticação
# - allow_origins: lista de URLs que podem acessar a API
# - allow_methods: quais métodos HTTP são permitidos (GET, POST, etc)
# - allow_headers: quais headers podem ser enviados nas requisições
#
# ⚠️ IMPORTANTE: Configure a variável CORS_ORIGINS no seu arquivo .env
#    Exemplo: CORS_ORIGINS=https://seu-frontend.com,http://localhost:3000
#
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
    payment_link: Optional[str] = None
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

# ============== FUNÇÕES DE AUTENTICAÇÃO ==============

def verify_password(plain_password, hashed_password):
    """Verifica se a senha está correta"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    """Cria um hash da senha para armazenar no banco"""
    return pwd_context.hash(password)

def create_access_token(data: dict):
    """Cria um token JWT para autenticação"""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    """
    Pega o usuário atual baseado no token JWT
    Esta função é usada em todas as rotas protegidas
    """
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
    
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if user is None:
        raise credentials_exception
    
    if isinstance(user['created_at'], str):
        user['created_at'] = datetime.fromisoformat(user['created_at'])
    
    return User(**user)

# ============== FUNÇÃO AUXILIAR PARA GERAR LINK DE PAGAMENTO ==============
def generate_payment_link(payment_id: str, amount: float, client_name: str) -> str:
    """
    Gera um link de pagamento (você pode integrar com Mercado Pago, PagSeguro, etc)
    Por enquanto retorna um link de exemplo
    """
    # TODO: Integrar com gateway de pagamento real
    base_url = "https://fotivaapp.onrender.com"
    return f"{base_url}/payment/{payment_id}?amount={amount}&name={client_name}"

# ============== ROTAS DE AUTENTICAÇÃO ==============

@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    """Registra um novo usuário"""
    # Verifica se já existe usuário com este email
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    # Cria o usuário com senha hasheada
    hashed_password = get_password_hash(user_data.password)
    user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        password=hashed_password
    )
    
    # Salva no banco
    doc = user.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.users.insert_one(doc)
    
    # Cria o token de acesso
    access_token = create_access_token(data={"sub": user.email})
    return Token(access_token=access_token, token_type="bearer")

@api_router.post("/auth/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Faz login e retorna um token JWT"""
    # Busca o usuário no banco
    user = await db.users.find_one({"email": form_data.username}, {"_id": 0})
    if not user or not verify_password(form_data.password, user['password']):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Cria o token de acesso
    access_token = create_access_token(data={"sub": user['email']})
    return Token(access_token=access_token, token_type="bearer")

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    """
    Retorna os dados do usuário logado
    Esta rota é usada pelo frontend para verificar se o token ainda é válido
    """
    return current_user

# ============== ROTAS DE CLIENTES ==============

@api_router.post("/clients", response_model=Client)
async def create_client(client_data: ClientCreate, current_user: User = Depends(get_current_user)):
    """Cria um novo cliente"""
    client = Client(user_id=current_user.id, **client_data.model_dump())
    doc = client.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.clients.insert_one(doc)
    return client

@api_router.get("/clients", response_model=List[Client])
async def get_clients(current_user: User = Depends(get_current_user)):
    """Lista todos os clientes do usuário logado"""
    clients = await db.clients.find({"user_id": current_user.id}, {"_id": 0}).to_list(1000)
    for client in clients:
        if isinstance(client['created_at'], str):
            client['created_at'] = datetime.fromisoformat(client['created_at'])
    return clients

@api_router.get("/clients/{client_id}", response_model=Client)
async def get_client(client_id: str, current_user: User = Depends(get_current_user)):
    """Retorna um cliente específico"""
    client = await db.clients.find_one({"id": client_id, "user_id": current_user.id}, {"_id": 0})
    if not client:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    if isinstance(client['created_at'], str):
        client['created_at'] = datetime.fromisoformat(client['created_at'])
    return Client(**client)

@api_router.delete("/clients/{client_id}")
async def delete_client(client_id: str, current_user: User = Depends(get_current_user)):
    """Deleta um cliente"""
    result = await db.clients.delete_one({"id": client_id, "user_id": current_user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return {"message": "Cliente deletado com sucesso"}

# ============== ROTAS DE EVENTOS ==============

@api_router.post("/events", response_model=Event)
async def create_event(event_data: EventCreate, current_user: User = Depends(get_current_user)):
    """Cria um novo evento"""
    event = Event(user_id=current_user.id, **event_data.model_dump())
    doc = event.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.events.insert_one(doc)
    return event

@api_router.get("/events", response_model=List[Event])
async def get_events(current_user: User = Depends(get_current_user)):
    """Lista todos os eventos do usuário logado"""
    events = await db.events.find({"user_id": current_user.id}, {"_id": 0}).to_list(1000)
    for event in events:
        if isinstance(event['created_at'], str):
            event['created_at'] = datetime.fromisoformat(event['created_at'])
    return events

@api_router.get("/events/{event_id}", response_model=Event)
async def get_event(event_id: str, current_user: User = Depends(get_current_user)):
    """Retorna um evento específico"""
    event = await db.events.find_one({"id": event_id, "user_id": current_user.id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    if isinstance(event['created_at'], str):
        event['created_at'] = datetime.fromisoformat(event['created_at'])
    return Event(**event)

@api_router.put("/events/{event_id}", response_model=Event)
async def update_event(event_id: str, event_data: EventUpdate, current_user: User = Depends(get_current_user)):
    """Atualiza um evento"""
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
    """Deleta um evento e todos os pagamentos associados"""
    result = await db.events.delete_one({"id": event_id, "user_id": current_user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    
    # Deleta os pagamentos associados
    await db.payments.delete_many({"event_id": event_id, "user_id": current_user.id})
    
    return {"message": "Evento deletado com sucesso"}

# ============== ROTAS DE PAGAMENTOS ==============

@api_router.post("/payments", response_model=Payment)
async def create_payment(payment_data: PaymentCreate, current_user: User = Depends(get_current_user)):
    """Cria um novo pagamento"""
    payment = Payment(user_id=current_user.id, **payment_data.model_dump())
    doc = payment.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.payments.insert_one(doc)
    return payment

@api_router.get("/payments", response_model=List[Payment])
async def get_payments(current_user: User = Depends(get_current_user)):
    """Lista todos os pagamentos do usuário logado"""
    payments = await db.payments.find({"user_id": current_user.id}, {"_id": 0}).to_list(1000)
    for payment in payments:
        if isinstance(payment['created_at'], str):
            payment['created_at'] = datetime.fromisoformat(payment['created_at'])
    return payments

@api_router.get("/payments/{payment_id}", response_model=Payment)
async def get_payment(payment_id: str, current_user: User = Depends(get_current_user)):
    """Retorna um pagamento específico"""
    payment = await db.payments.find_one({"id": payment_id, "user_id": current_user.id}, {"_id": 0})
    if not payment:
        raise HTTPException(status_code=404, detail="Pagamento não encontrado")
    if isinstance(payment['created_at'], str):
        payment['created_at'] = datetime.fromisoformat(payment['created_at'])
    return Payment(**payment)

@api_router.put("/payments/{payment_id}", response_model=Payment)
async def update_payment(payment_id: str, payment_data: PaymentUpdate, current_user: User = Depends(get_current_user)):
    """Atualiza um pagamento (valor, data, status)"""
    update_data = {k: v for k, v in payment_data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="Nenhum dado para atualizar")
    
    result = await db.payments.update_one(
        {"id": payment_id, "user_id": current_user.id},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Pagamento não encontrado")
    
    # Se marcou como pago, atualiza o paid_amount do evento
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
    """Deleta um pagamento"""
    # Pega info do pagamento antes de deletar
    payment_doc = await db.payments.find_one({"id": payment_id, "user_id": current_user.id}, {"_id": 0, "event_id": 1, "amount": 1, "paid": 1})
    if not payment_doc:
        raise HTTPException(status_code=404, detail="Pagamento não encontrado")
    
    result = await db.payments.delete_one({"id": payment_id, "user_id": current_user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Pagamento não encontrado")
    
    # Atualiza o paid_amount do evento se o pagamento estava pago
    if payment_doc.get('paid'):
        event_id = payment_doc['event_id']
        all_payments = await db.payments.find({"event_id": event_id}, {"_id": 0, "amount": 1, "paid": 1}).to_list(1000)
        total_paid = sum(p['amount'] for p in all_payments if p.get('paid', False))
        await db.events.update_one({"id": event_id}, {"$set": {"paid_amount": total_paid}})
    
    return {"message": "Pagamento deletado com sucesso"}

@api_router.patch("/payments/{payment_id}/mark-paid")
async def mark_payment_paid(payment_id: str, current_user: User = Depends(get_current_user)):
    """Marca um pagamento como pago"""
    paid_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    result = await db.payments.update_one(
        {"id": payment_id, "user_id": current_user.id},
        {"$set": {"paid": True, "paid_date": paid_date}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Pagamento não encontrado")
    
    # Atualiza o paid_amount do evento
    payment_doc = await db.payments.find_one({"id": payment_id}, {"_id": 0, "event_id": 1, "amount": 1})
    if payment_doc:
        event_id = payment_doc['event_id']
        all_payments = await db.payments.find({"event_id": event_id}, {"_id": 0, "amount": 1, "paid": 1}).to_list(1000)
        total_paid = sum(p['amount'] for p in all_payments if p.get('paid', False))
        await db.events.update_one({"id": event_id}, {"$set": {"paid_amount": total_paid}})
    
    return {"message": "Pagamento marcado como pago"}

@api_router.post("/payments/{payment_id}/generate-link")
async def generate_payment_link_route(payment_id: str, current_user: User = Depends(get_current_user)):
    """Gera um link de pagamento para a parcela"""
    payment = await db.payments.find_one({"id": payment_id, "user_id": current_user.id}, {"_id": 0})
    if not payment:
        raise HTTPException(status_code=404, detail="Pagamento não encontrado")
    
    # Gera o link de pagamento
    payment_link = generate_payment_link(payment_id, payment['amount'], payment['client_name'])
    
    # Salva o link no pagamento
    await db.payments.update_one(
        {"id": payment_id, "user_id": current_user.id},
        {"$set": {"payment_link": payment_link}}
    )
    
    return {"payment_link": payment_link, "message": "Link de pagamento gerado com sucesso"}

# ============== ROTAS DE GALERIA ==============

@api_router.post("/galleries", response_model=Gallery)
async def create_gallery(gallery_data: GalleryCreate, current_user: User = Depends(get_current_user)):
    """Cria uma nova galeria"""
    gallery = Gallery(user_id=current_user.id, **gallery_data.model_dump())
    doc = gallery.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.galleries.insert_one(doc)
    return gallery

@api_router.get("/galleries", response_model=List[Gallery])
async def get_galleries(current_user: User = Depends(get_current_user)):
    """Lista todas as galerias do usuário logado"""
    galleries = await db.galleries.find({"user_id": current_user.id}, {"_id": 0}).to_list(1000)
    for gallery in galleries:
        if isinstance(gallery['created_at'], str):
            gallery['created_at'] = datetime.fromisoformat(gallery['created_at'])
    return galleries

# ============== ROTAS DO DASHBOARD ==============

@api_router.get("/dashboard/metrics", response_model=DashboardMetrics)
async def get_dashboard_metrics(current_user: User = Depends(get_current_user)):
    """Retorna as métricas do dashboard"""
    # Busca todos os dados do usuário
    events = await db.events.find({"user_id": current_user.id}, {"_id": 0}).to_list(1000)
    payments = await db.payments.find({"user_id": current_user.id, "paid": True}, {"_id": 0}).to_list(1000)
    pending_payments = await db.payments.find({"user_id": current_user.id, "paid": False}, {"_id": 0}).to_list(1000)
    galleries = await db.galleries.find({"user_id": current_user.id}, {"_id": 0}).to_list(1000)
    
    # Calcula as métricas
    monthly_revenue = sum(p['amount'] for p in payments)
    confirmed_events = len([e for e in events if e['status'] == 'confirmado'])
    photos_delivered = sum(g['photo_count'] for g in galleries)
    pending_payments_total = sum(p['amount'] for p in pending_payments)
    
    # Próximos 5 eventos
    sorted_events = sorted(events, key=lambda x: x['date'])[:5]
    for event in sorted_events:
        if isinstance(event['created_at'], str):
            event['created_at'] = datetime.fromisoformat(event['created_at'])
    
    # Dados do gráfico mensal
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

# ============== REGISTRAR ROTAS ==============
app.include_router(api_router)

# ============== INICIAR SERVIDOR ==============
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
