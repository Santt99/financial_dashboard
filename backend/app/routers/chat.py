from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List
import asyncio

from app.routers.deps import get_current_user
from app.services.data_store import store
from app.services.gemini_service import gemini_service

router = APIRouter(prefix="/chat", tags=["chat"])


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    role: str
    content: str
    context_cards: int = 0


@router.post("/ask")
def ask_gemini(request: ChatRequest, user=Depends(get_current_user)):
    """Send a question to Gemini with full financial context."""
    try:
        summary = store.general_summary(user.id)
        cards = summary.get("cards", [])
        
        if not cards:
            return ChatResponse(
                role="assistant",
                content="No tienes tarjetas registradas. Por favor, carga un estado de cuenta primero.",
                context_cards=0
            )
        
        context = _build_financial_context(cards)
        response = gemini_service.chat_about_finances(
            user_question=request.message,
            financial_context=context
        )
        
        return ChatResponse(
            role="assistant",
            content=response,
            context_cards=len(cards)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.post("/ask-stream")
async def ask_gemini_stream(request: ChatRequest, user=Depends(get_current_user)):
    """Stream chat response in real-time with natural pacing."""
    try:
        summary = store.general_summary(user.id)
        cards = summary.get("cards", [])
        
        if not cards:
            async def error_stream():
                yield "No tienes tarjetas registradas. Por favor, carga un estado de cuenta primero."
            return StreamingResponse(error_stream(), media_type="text/plain; charset=utf-8")
        
        context = _build_financial_context(cards)
        
        async def stream_generator():
            try:
                response = gemini_service.get_streaming_response(
                    user_question=request.message,
                    financial_context=context
                )
                
                for chunk in response:
                    if chunk is None:
                        continue
                    
                    text = getattr(chunk, 'text', None)
                    if not text:
                        continue
                    
                    for char in text:
                        yield char
                        if char in (' ', '\n'):
                            await asyncio.sleep(0.01)
                        elif char in '.,!?:;':
                            await asyncio.sleep(0.05)
                        else:
                            await asyncio.sleep(0.02)
                    
            except StopIteration:
                pass
            except Exception as e:
                yield f"\n\nError: {str(e)}"
        
        return StreamingResponse(stream_generator(), media_type="text/plain; charset=utf-8")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


def _attr(obj, key, default=None):
    """Get attribute safely from dict or object."""
    try:
        value = getattr(obj, key) if hasattr(obj, key) else obj.get(key, default)
        # Return default if value is None
        return value if value is not None else default
    except (AttributeError, TypeError):
        return default


def _build_financial_context(cards: List) -> str:
    """Build financial summary for AI context."""
    lines = ["# Resumen de Tarjetas y Deudas\n"]
    
    for i, card in enumerate(cards, 1):
        lines.append(f"## Tarjeta {i}: {_attr(card, 'name', 'Sin nombre')} ({_attr(card, 'last4', 'N/A')})")
        lines.append(f"- Saldo: ${_attr(card, 'balance', 0):,.2f}")
        lines.append(f"- Mínimo: ${_attr(card, 'minimum_due', 0):,.2f}")
        lines.append(f"- Vencimiento: {_attr(card, 'upcoming_payment_date', 'N/A')}")
        
        txs = _attr(card, 'transactions', [])
        msi = [t for t in txs if (_attr(t, 'installments', 0) or 0) > 1]
        
        if msi:
            lines.append("\n### MSI:")
            for tx in msi:
                amt = _attr(tx, 'amount', 0)
                paid = _attr(tx, 'months_paid', 0)
                total = _attr(tx, 'installments', 0)
                lines.append(f"- {_attr(tx, 'description', 'Compra')}: ${amt:,.2f} ({paid}/{total})")
        
        lines.append("")
    
    return "\n".join(lines)
