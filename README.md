# Financial Dashboard (FastAPI + React)

This project is a local full-stack prototype for a credit card financial dashboard. Users can upload (mock) account statements via a drag-and-drop interface and view consolidated and per-card analytics, spending categories, and 6‑month balance projections.

## Stack

- Backend: FastAPI, Pydantic v2, JWT auth, in-memory mock store
- Frontend: React + TypeScript + Material UI + Context API
- No real database yet (all volatile). Ready to swap for MongoDB later.

## Features Implemented

- **Authentication**: Register/Login with JWT
- **Statement Upload**: Drag-and-drop file upload interface with Gemini AI extraction
- **Dashboard**: Summary view (total debt, upcoming payments, MSI overview)
- **Per-Card View**: Transactions, category aggregates, 6-month balance projections
- **MSI Management**: Track "Meses Sin Interés" (interest-free installments) by card
- **Interest Analysis**: Dedicated view for analyzing MSI plans and payment schedules
- **AI Chat Assistant**: Ask Gemini AI about your cards, debts, and MSI plans with real-time streaming responses
- **Responsive Design**: Single-column layout with Material UI components
- **Spanish Localization**: Full UI in Spanish (es-MX) with MXN currency

## Running Backend

```bash
cd backend
python3 -m venv .venv
source backend-venv/bin/activate
pip install -r requirements.txt

# Configure Gemini API (optional but recommended)
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY from https://aistudio.google.com/app/apikey

uvicorn app.main:app --reload --port 8000
```

Health check: `GET http://localhost:8000/health`

**Note**: Gemini AI integration extracts real transactions from PDFs and images. If no API key is configured, the app falls back to mock data.

## Running Frontend

```bash
cd frontend
npm install
npm run dev
```

App served by Vite (default http://localhost:5173).

## Basic Usage Flow
1. Register or Login in the top bar.
2. Dashboard auto loads mock cards & data.
3. Upload a statement file via drag-and-drop zone (associates to first card) – triggers mock new transactions & projections.
4. Select a card in dashboard to view card-specific details.

## Code Structure

```
backend/app/
  core/ (config, security)
  routers/ (auth, files, dashboard, cards, deps)
  services/ (data_store, processing, gemini_service)
  schemas/ (pydantic models)
  main.py
frontend/src/
  contexts/ (Auth, Data)
  components/ (dashboard components, routing)
  types/ (API typings)
  utils/ (format helpers)
  App.tsx / main.tsx
```

## AI-Powered Features

### Statement Processing with Gemini AI
Automatically extract transactions from credit card statements:
- **PDF Statements**: Text extraction and transaction parsing
- **Image Statements**: Vision capabilities for scanned documents
- Robust parsing for Mexican banks (BBVA, Citibanamex, Santander, HSBC, Amex, etc.)
- MSI (Meses Sin Intereses) plans detection with monthly payment calculation

### AI Chat Assistant (Real-time Streaming)
Ask the AI advisor about your financial situation:
- **Smart Greeting Detection**: Responds briefly to casual greetings without dumping data
- **Contextual Answers**: Gemini receives full financial context (cards, balances, MSI plans)
- **Real-Time Streaming**: Response text streams character-by-character with natural pacing
- **Markdown Formatting**: Responses are formatted with headings, lists, and inline bold text
- **Endpoints**:
  - `POST /chat/ask` – Full response (non-streaming)
  - `POST /chat/ask-stream` – Streaming response with natural delays

**Example Questions**:
- "¿Cuál es mi saldo total?" (What's my total balance?)
- "¿Cuántos MSI tengo?" (How many MSI plans do I have?)
- "Recomiéndame un plan de pago" (Recommend me a payment plan)
- "¿Cuándo vence mi siguiente pago?" (When's my next payment due?)

## Localization & Currency

- **Language**: Full Spanish (Mexico) UI
- **Currency**: MXN (Mexican Peso)
- **Date Format**: DD/MM/YYYY
- All financial amounts formatted with locale-specific separators

## Gemini AI Setup

To enable full AI features (statement extraction + chat):
1. Get a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Set `GEMINI_API_KEY` in your `.env` file
3. Chat and statement upload will now work with real AI processing

Without an API key, the app falls back to mock data and responses.

## Security Notes
- Access controlled via Bearer JWT in Authorization header.
- Each request validated; only user-owned data returned.
- Tokens currently stored in memory (context). For production prefer httpOnly cookies or secure storage.
- Gemini API key should be kept secure and never committed to version control.

## Limitations (Prototype)
- No persistence (restart clears data).
- Gemini extraction accuracy depends on statement format quality.
- Chat context includes all user cards (for accuracy, but design considerations for large portfolios).
- No refresh token / token expiry handling on frontend.

## Suggested Next Steps
- Add MongoDB persistence layer.
- Enhance Gemini prompts for multi-language support and better extraction accuracy.
- Add support for more statement formats (CSV, Excel).
- Persistent chat history (save conversations to DB).
- Charts and visualizations (Recharts for spending trends, projections).
- Advanced analytics: category trends, spending patterns, savings recommendations.
- Improved error handling and loading states.
- Unit tests (Jest/React Testing Library + pytest).
- Role-based access control and password reset flows.

## License
Prototype code – adapt freely.
