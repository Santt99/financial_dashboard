from fastapi import APIRouter, Depends, HTTPException
from app.routers.deps import get_current_user
from app.services.data_store import store

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary")
def summary(user=Depends(get_current_user)):
    return store.general_summary(user.id)


@router.get("/card/{card_id}")
def card_details(card_id: str, user=Depends(get_current_user)):
    card = store.get_card(user.id, card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    txs = store.list_transactions(user.id, card_id)
    cats = store.category_aggregates(user.id, card_id)
    projections = store.list_projections(user.id, card_id)
    return {
        "card": card,
        "transactions": txs,
        "category_aggregates": cats,
        "projections": projections,
    }
