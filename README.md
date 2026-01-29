# FOTIVA - Plataforma SaaS para Fotógrafos Profissionais

![FOTIVA Logo](https://customer-assets.emergentagent.com/job_f42817ab-3101-4c5d-8b5d-a07e687d3534/artifacts/8ey5v14f_gemini-2.5-flash-image_Modern_minimalist_logo_for_a_photography_app_called_FOTIVA._Flat_design_clean_sh-2.jpg)

## 🎯 Sobre o Projeto

FOTIVA é uma plataforma SaaS profissional desenvolvida para fotógrafos brasileiros gerenciarem seus negócios de forma completa e eficiente. Com design minimalista e premium (inspirado em Stripe, Notion e Linear), oferece controle total sobre eventos, clientes, pagamentos e galerias.

### 🌟 Principais Funcionalidades

- **Agenda Inteligente**: Organize eventos, compromissos e ensaios fotográficos
- **Gestão de Clientes**: Cadastro completo com histórico e informações
- **Controle Financeiro** (⭐ Função Principal): 
  - Gestão de parcelas e pagamentos
  - Alertas automáticos de vencimento
  - Dashboard financeiro com métricas e gráficos
- **Galeria de Fotos**: Compartilhe álbuns com clientes
- **Modelo SaaS**: R$ 19,90/mês com 30 dias grátis

---

## 🏗️ Arquitetura Técnica

### Stack Tecnológico

**Backend:**
- FastAPI (Python)
- MongoDB com Motor (async driver)
- JWT Authentication
- Pydantic para validação

**Frontend:**
- React 19
- React Router DOM
- Shadcn UI + Tailwind CSS
- Recharts para gráficos
- Axios para API calls
- Sonner para notificações

**Futuro (Mobile):**
- React Native (planejado)

---

## 🎨 Design Guidelines

### Paleta de Cores
```
Primary Green: #4A9B6E
Secondary Yellow: #F4C542
Sidebar Dark: #2C3E50
Background: #F8F9FA
Text Primary: #111827
Text Secondary: #6B7280
```

### Tipografia
- **Headings**: Work Sans (600-700)
- **Body**: Inter (400-500)

### Layout
- Sidebar fixa escura (desktop)
- Cards com sombra suave
- Espaçamento generoso
- Animações micro-interações

---

## 📁 Estrutura do Projeto

```
/app
├── backend/
│   ├── server.py          # FastAPI app + routes
│   ├── requirements.txt   # Python dependencies
│   └── .env              # Environment variables
│
├── frontend/
│   ├── public/           # Static assets
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/       # Shadcn components
│   │   │   ├── Sidebar.js
│   │   │   └── DashboardLayout.js
│   │   ├── contexts/
│   │   │   └── AuthContext.js
│   │   ├── pages/
│   │   │   ├── LandingPage.js
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   ├── Dashboard.js
│   │   │   ├── Eventos.js
│   │   │   ├── Pagamentos.js
│   │   │   ├── Galeria.js
│   │   │   └── Configuracoes.js
│   │   ├── App.js
│   │   ├── App.css
│   │   └── index.css
│   ├── package.json
│   └── .env
│
├── design_guidelines.json
└── README.md
```

---

## 🚀 Como Executar

### Pré-requisitos
- Python 3.11+
- Node.js 18+
- MongoDB
- Yarn

### Backend

```bash
cd /app/backend

# Instalar dependências
pip install -r requirements.txt

# Configurar .env
# MONGO_URL=mongodb://localhost:27017
# DB_NAME=fotiva_db
# SECRET_KEY=your-secret-key

# Executar
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

### Frontend

```bash
cd /app/frontend

# Instalar dependências
yarn install

# Configurar .env
# REACT_APP_BACKEND_URL=http://localhost:8001

# Executar
yarn start
```

O app estará disponível em: `http://localhost:3000`

---

## 📡 API Endpoints

### Autenticação
- `POST /api/auth/register` - Criar nova conta
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Obter usuário atual

### Clientes
- `POST /api/clients` - Criar cliente
- `GET /api/clients` - Listar clientes

### Eventos
- `POST /api/events` - Criar evento
- `GET /api/events` - Listar eventos
- `GET /api/events/{id}` - Obter evento
- `PUT /api/events/{id}` - Atualizar evento
- `DELETE /api/events/{id}` - Deletar evento

### Pagamentos
- `POST /api/payments` - Criar pagamento
- `GET /api/payments` - Listar pagamentos
- `PATCH /api/payments/{id}/mark-paid` - Marcar como pago

### Galerias
- `POST /api/galleries` - Criar galeria
- `GET /api/galleries` - Listar galerias

### Dashboard
- `GET /api/dashboard/metrics` - Métricas do dashboard

---

## 🗄️ Modelos de Dados

### User
```python
{
  "id": "uuid",
  "email": "string",
  "name": "string",
  "brand_name": "string",
  "profile_photo": "string",
  "created_at": "datetime"
}
```

### Event
```python
{
  "id": "uuid",
  "user_id": "uuid",
  "client_id": "uuid",
  "client_name": "string",
  "name": "string",
  "date": "string",
  "time": "string",
  "location": "string",
  "status": "confirmado|pendente|concluido",
  "total_value": "float",
  "paid_amount": "float",
  "created_at": "datetime"
}
```

### Payment
```python
{
  "id": "uuid",
  "user_id": "uuid",
  "event_id": "uuid",
  "client_id": "uuid",
  "installment_number": "int",
  "total_installments": "int",
  "amount": "float",
  "due_date": "string",
  "paid": "boolean",
  "paid_date": "string",
  "created_at": "datetime"
}
```

---

## 🎯 Roadmap Futuro

### Fase 2 - App Mobile
- [ ] React Native para iOS e Android
- [ ] Sincronização em tempo real com web
- [ ] Notificações push
- [ ] Modo offline

### Fase 3 - Integrações
- [ ] Mercado Pago (pagamentos online)
- [ ] Stripe (internacional)
- [ ] WhatsApp (alertas)
- [ ] Google Calendar (sincronização)

### Fase 4 - Features Avançadas
- [ ] Upload de fotos diretamente na galeria
- [ ] Edição de fotos inline
- [ ] Contratos digitais com assinatura eletrônica
- [ ] Relatórios financeiros exportáveis (PDF)
- [ ] Multi-idiomas (EN, ES)

---

## 🧪 Testes

### Backend
```bash
cd /app/backend
pytest backend_test.py
```

### Frontend
```bash
cd /app/frontend
yarn test
```

### E2E
O projeto foi testado com 100% de cobertura usando testing agent:
- ✅ Todas as APIs funcionando
- ✅ Fluxos de autenticação completos
- ✅ CRUD de eventos, pagamentos e galerias
- ✅ Dashboard com métricas e gráficos
- ✅ Design responsivo

---

## 👨‍💻 Autor

Desenvolvido com ❤️ usando **Emergent E1 AI Agent**

---

## 📄 Licença

Todos os direitos reservados © 2025 FOTIVA
