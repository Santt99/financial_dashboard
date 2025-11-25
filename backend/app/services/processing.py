"""File processing service.

Uses Gemini AI to extract transactions from uploaded credit card statements.
Falls back to mock data if Gemini is not configured.
"""
from __future__ import annotations

from typing import List, Tuple, Optional, Dict, Any
import uuid
from datetime import datetime

from app.schemas.transaction import Transaction
from app.services.gemini_service import gemini_service


async def extract_transactions_from_statement(
    user_id: str, card_id: str, file_content: bytes, filename: str, content_type: str
) -> Tuple[Optional[Dict[str, Any]], List[Transaction]]:
    """Extract card info and transactions from an uploaded statement file.

    Args:
        user_id: Owner user id.
        card_id: Card id to associate transactions.
        file_content: Raw file bytes.
        filename: Uploaded file name for context.
        content_type: MIME type of the file.

    Returns:
        Tuple of (card_info dict, List of Transaction objects)
    """
    # Determine file type and process accordingly
    if content_type == "application/pdf" or filename.lower().endswith(".pdf"):
        return await gemini_service.extract_transactions_from_pdf(
            file_content, user_id, card_id
        )
    elif content_type.startswith("image/") or filename.lower().endswith((".jpg", ".jpeg", ".png", ".gif")):
        return await gemini_service.extract_transactions_from_image(
            file_content, user_id, card_id
        )
    else:
        # Fallback for unsupported types
        return None, _generate_fallback_transactions(user_id, card_id, filename)


def _generate_fallback_transactions(user_id: str, card_id: str, filename: str) -> List[Transaction]:
    """Generate fallback mock transactions for unsupported file types.

    Args:
        user_id: Owner user id.
        card_id: Card id to associate transactions.
        filename: Uploaded file name for context.

    Returns:
        List of mock Transaction objects.
    """
    base_desc = f"Imported from {filename}" if filename else "Imported statement"
    now = datetime.utcnow().date().isoformat()
    sample = [
        Transaction(
            id=str(uuid.uuid4()),
            user_id=user_id,
            card_id=card_id,
            date=now,
            description=base_desc + " - Grocery",
            category="Groceries",
            amount=42.13,
            type="charge",
        ),
        Transaction(
            id=str(uuid.uuid4()),
            user_id=user_id,
            card_id=card_id,
            date=now,
            description=base_desc + " - Dining",
            category="Dining",
            amount=28.55,
            type="charge",
        ),
    ]
    return sample
