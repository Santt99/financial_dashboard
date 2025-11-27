# Backend - Financial Dashboard API

FastAPI application providing JWT authentication, AI-powered chat, intelligent file parsing with Gemini, and comprehensive financial dashboard APIs for managing credit cards with MSI (interest-free installment) tracking.

## Features

- **Authentication**: JWT-based register/login with secure password hashing
- **AI Chat Assistant**: Streaming chat endpoint with Gemini AI integration
  - Real-time streaming responses with natural pacing
  - Smart greeting detection (no unsolicited data dumps)
  - Financial context-aware responses
- **Statement Processing**: Gemini AI extracts transactions from PDFs and images
  - Automatic MSI (Meses Sin Intereses) detection
  - Robust parsing for Mexican banks
  - Monthly payment calculation for installment plans
- **Dashboard APIs**: Consolidated and per-card financial views
  - Transaction history with categories
  - Balance projections (6-month)
  - MSI tracking and payment schedules
- **In-Memory Data Store**: Mock data with ready-to-replace MongoDB adapter

## Tech Stack

- **Framework**: FastAPI
- **Validation**: Pydantic v2
- **Authentication**: python-jose (JWT), passlib + bcrypt
- **AI**: Google Generative AI (Gemini)
- **PDF Processing**: PyPDF2
- **Image Processing**: Pillow

## API Endpoints

### Authentication
- `POST /auth/register` – Create new user
- `POST /auth/login` – Login and get JWT token

### Dashboard
- `GET /dashboard/summary` – Overall financial summary
- `GET /cards/` – List all user cards
- `GET /cards/{id}` – Card details with transactions

### Files
- `POST /files/upload` – Upload statement (PDF/image)

### Chat (AI Assistant)
- `POST /chat/ask` – Non-streaming response
- `POST /chat/ask-stream` – Real-time streaming response

## Setup & Running

Install dependencies:

```bash
cd backend
python -m venv backend-venv
source backend-venv/bin/activate  # WSL/Linux
pip install -r requirements.txt
```

Configure Gemini API (optional but recommended):

```bash
cp .env.example .env
# Add your GEMINI_API_KEY from https://aistudio.google.com/app/apikey
```

Start the server:

```bash
uvicorn app.main:app --reload --port 8000
```

Test health check:

```bash
curl http://localhost:8000/health
```

## Example Workflow

```bash
# 1. Register
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secret"}'

# 2. Login (get token)
TOKEN=$(curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secret"}' | jq -r '.access_token')

# 3. Get dashboard
curl http://localhost:8000/dashboard/summary \
  -H "Authorization: Bearer $TOKEN"

# 4. Chat with AI
curl -X POST http://localhost:8000/chat/ask-stream \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"¿Cuál es mi saldo total?"}'
```

## Project Structure

```
app/
  core/
    config.py       # Settings & Gemini API key
    security.py     # JWT token creation/validation
  routers/
    auth.py         # Register/Login endpoints
    cards.py        # Card management
    dashboard.py    # Dashboard summaries
    files.py        # File upload & parsing
    chat.py         # AI chat endpoints
    deps.py         # Dependency injection (JWT validation)
  services/
    data_store.py   # In-memory mock store
    processing.py   # Statement parsing
    gemini_service.py  # Gemini AI integration
  schemas/
    user.py         # User models
    card.py         # Card models
    transaction.py  # Transaction models
    projection.py   # Projection models
  main.py           # FastAPI app setup
```

## Chat Feature Details

### Streaming Response (`/chat/ask-stream`)
- Character-by-character streaming with variable delays
- 10ms for spaces/line breaks (fast transitions)
- 20ms for regular text (natural reading pace)
- 50ms for punctuation (natural pause points)
- Markdown-like formatting in responses (bold, lists, headings)

### Financial Context
The AI receives full context including:
- All user cards (name, last 4 digits, balance, minimum due, due date)
- Active MSI plans (description, amount, progress, monthly payment)
- Encouragement to ask for details on demand (no unsolicited data dumps)

### Gemini Model
Currently using `gemini-2.5-flash` for optimal speed and accuracy.

## Security Notes

- **JWT Auth**: Bearer token in Authorization header required for all protected endpoints
- **Password Hashing**: bcrypt with salt rounds configured in settings
- **Data Access**: Each request validated; only user-owned data returned
- **Gemini API Key**: Keep in `.env`, never commit to version control
- **Tokens**: Stored in memory (context API on frontend); for production use httpOnly cookies

## Data Structure

### User
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "hashed_password": "...",
  "cards": ["card_ids"]
}
```

### Card
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "name": "BBVA Classic",
  "last4": "1234",
  "balance": 5000.00,
  "minimum_due": 150.00,
  "upcoming_payment_date": "2025-12-05",
  "transactions": ["transaction_ids"],
  "projections": ["projection_ids"]
}
```

### Transaction
```json
{
  "id": "uuid",
  "card_id": "uuid",
  "description": "Purchase",
  "amount": 250.00,
  "date": "2025-11-20",
  "category": "shopping",
  "installments": 3,          // 0 or null = single payment
  "months_paid": 0,           // Progress on MSI
  "monthly_amount": 83.33     // Individual MSI payment
}
```

## Limitations & Notes

- All data is **volatile** (in-memory). Restart clears everything.
- Gemini extraction accuracy depends on statement format and quality.
- No refresh token / token expiry handling (add for production).
- MSI detection relies on statement structure (varies by bank).

## Suggested Improvements

- **Persistence**: Add MongoDB with proper migrations
- **Caching**: Redis for frequently accessed summaries
- **Advanced Parsing**: Handle more bank formats and edge cases
- **Chat History**: Store and retrieve past conversations
- **Analytics**: Spending trends, category insights, savings goals
- **Rate Limiting**: Prevent abuse of Gemini API calls
- **Testing**: pytest with fixtures for all services
- **Logging**: Structured logging instead of print statements
- **Error Handling**: Custom exception classes and proper HTTP status codes

## License

Prototype code – adapt and extend freely.

