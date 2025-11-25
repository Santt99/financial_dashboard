# Backend - Financial Dashboard API

FastAPI application providing authentication, chat, file upload parsing (mock), and financial dashboard data for credit card management.

## Features

- JWT auth (register/login)
- Upload account statements (mock parse -> new transactions)
- Chat endpoint with stubbed assistant response
- Dashboard summary & per-card details (transactions, category aggregates, projections)
- In-memory mock data store (replace later with MongoDB)

## Tech Stack

- FastAPI
- Pydantic v2
- python-jose for JWT
- passlib + bcrypt for hashing

## Run Locally

Install dependencies:

```bash
python -m venv .venv
source .venv/bin/activate  # (WSL/Linux)
pip install -r requirements.txt
```

Start server:

```bash
uvicorn app.main:app --reload --port 8000
```

Test health:

```bash
curl http://localhost:8000/health
```

## Example Flow
1. Register: POST /auth/register {"email":"user@example.com","password":"secret"}
2. Use returned bearer token.
3. GET /dashboard/summary
4. List cards: GET /cards/
5. Upload file: POST /files/upload?card_id=... (multipart form with file field 'f')
6. Send chat message: POST /chat/send {"content":"Give me a summary"}

## Notes
- All data is volatile (memory). Restart clears state.
- Statement parsing & chat responses are mocked for now.

## Next Steps (Suggested)
- Persist data with MongoDB.
- Real file parsing (PDF/CSV).
- Integrate OpenAI ChatGPT.
- Add refresh tokens & stricter auth.
- Add rate limiting.
