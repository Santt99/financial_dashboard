# Financial Dashboard (FastAPI + React)

This project is a local full-stack prototype for a credit card financial dashboard. Users can upload (mock) account statements via a drag-and-drop interface and view consolidated and per-card analytics, spending categories, and 6‑month balance projections.

## Stack

- Backend: FastAPI, Pydantic v2, JWT auth, in-memory mock store
- Frontend: React + TypeScript + Material UI + Context API
- No real database yet (all volatile). Ready to swap for MongoDB later.

## Features Implemented

- Register/Login (JWT)
- Drag-and-drop file upload interface (adds mock transactions & regenerates projections)
- Dashboard summary (total debt, upcoming payments)
- Per-card view (transactions, category aggregates, projections)
- Responsive single-column layout with centered dashboard
- Minimalist Uber-inspired design

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
The app uses Google's Gemini API to automatically extract transactions from:
- **PDF statements**: Extracts text and parses transaction data
- **Image statements**: Uses vision capabilities to read scanned documents

To enable:
1. Get a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Set `GEMINI_API_KEY` in your `.env` file
3. Upload statements via drag-and-drop interface

Without an API key, the app falls back to generating sample data.

## Security Notes
- Access controlled via Bearer JWT in Authorization header.
- Each request validated; only user-owned data returned.
- Tokens currently stored in memory (context). For production prefer httpOnly cookies or secure storage.
- Gemini API key should be kept secure and never committed to version control.

## Limitations (Prototype)
- No persistence (restart clears data).
- Gemini extraction accuracy depends on statement format quality.
- No refresh token / token expiry handling on frontend.

## Suggested Next Steps
- Add MongoDB persistence layer.
- Fine-tune Gemini prompts for better extraction accuracy.
- Add support for more statement formats (CSV, Excel).
- Add charts (Material UI + Recharts or Chart.js) for categories & projections.
- Improve error handling & loading states.
- Unit tests for frontend (React Testing Library) and more backend coverage.
- Add role-based access & password reset flows.

## License
Prototype code – adapt freely.
