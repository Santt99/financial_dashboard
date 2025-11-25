from fastapi import Header, HTTPException, Depends
from app.core.security import decode_token
from app.services.data_store import store


def get_current_user(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    token = authorization.split(" ", 1)[1]
    try:
        payload = decode_token(token)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Missing subject")
    user = store.get_user_public(user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user
