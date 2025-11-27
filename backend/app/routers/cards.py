from fastapi import APIRouter, Depends, HTTPException
from app.routers.deps import get_current_user
from app.services.data_store import store

router = APIRouter(prefix="/cards", tags=["cards"])


@router.get("/")
def list_cards(user=Depends(get_current_user)):
    return store.list_cards(user.id)


@router.get("/{card_id}")
def get_card(card_id: str, user=Depends(get_current_user)):
    card = store.get_card(user.id, card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Not found")
    return card
