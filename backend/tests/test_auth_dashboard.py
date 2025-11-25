"""Backend integration tests for auth & dashboard.

Ensures the in-memory data store works with registration and chat flow.
Includes a path adjustment to make sure the `app` package is discoverable when
pytest modifies working directories.
"""
import sys
from pathlib import Path

# Add project backend root to PYTHONPATH if not present
BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from fastapi.testclient import TestClient  # type: ignore
from app.main import app

client = TestClient(app)


def register_and_get_token(suffix: str = ""):
    email = f"testuser{suffix}@example.com"
    payload = {"email": email, "password": "secret123"}
    r = client.post("/auth/register", json=payload)
    assert r.status_code == 200, r.text
    token = r.json()["access_token"]
    return token


def test_register_and_summary_flow():
    token = register_and_get_token("a")
    headers = {"Authorization": f"Bearer {token}"}
    r = client.get("/dashboard/summary", headers=headers)
    assert r.status_code == 200
    data = r.json()
    assert "total_debt" in data
    assert isinstance(data.get("cards"), list)


def test_chat_send():
    token = register_and_get_token("b")
    headers = {"Authorization": f"Bearer {token}"}
    r = client.post("/chat/send", json={"content": "Hello assistant"}, headers=headers)
    assert r.status_code == 200
    msg = r.json()["message"]
    assert msg["role"] == "assistant"