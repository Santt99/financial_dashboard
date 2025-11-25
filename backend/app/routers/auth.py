from fastapi import APIRouter, HTTPException
from app.schemas.user import UserCreate, UserLogin, Token
from app.core.security import verify_password, create_access_token
from app.services.data_store import store

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=Token)
def register(data: UserCreate):
    existing = store.get_user_by_email(data.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = store.create_user(data.email, data.password)
    store.add_mock_cards(user.id)
    token = create_access_token(subject=user.id)
    return Token(access_token=token)


@router.post("/login", response_model=Token)
def login(data: UserLogin):
    record = store.get_user_by_email(data.email)
    if not record or not verify_password(data.password, record.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(subject=record.id)
    return Token(access_token=token)
