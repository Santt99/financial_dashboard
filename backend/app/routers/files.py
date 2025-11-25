from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from app.routers.deps import get_current_user
from app.services.data_store import store
from app.services.processing import extract_transactions_from_statement

router = APIRouter(prefix="/files", tags=["files"])


@router.post("/upload")
async def upload_statement(f: UploadFile = File(...), user=Depends(get_current_user)):
    """Upload and process a credit card statement.
    
    Supports PDF and image files. Uses Gemini AI to extract card info and transactions.
    Creates a new card if it doesn't exist based on extracted information.
    """
    print(f"📁 Processing file: {f.filename} ({f.content_type})")
    
    # Read file content
    file_content = await f.read()
    print(f"📦 File size: {len(file_content)} bytes")
    
    # Process with Gemini AI - extract card info and transactions
    card_info, new_txs = await extract_transactions_from_statement(
        user.id, "temp", file_content, f.filename or "unknown", f.content_type or "application/octet-stream"
    )
    
    print(f"🤖 Gemini extracted: card_info={card_info}, transactions={len(new_txs)}")
    
    # Create or update card based on extracted info
    if card_info:
        card = store.create_or_update_card(user.id, card_info)
        print(f"💳 Card created/updated: {card.name} (id: {card.id})")
    else:
        # If no card info extracted, use first existing card or create default
        existing_cards = store.list_cards(user.id)
        if existing_cards:
            card = existing_cards[0]
            print(f"💳 Using existing card: {card.name}")
        else:
            # Create a default card
            card = store.create_or_update_card(user.id, {
                "name": "Imported Card",
                "issuer": "Unknown",
                "last4": "0000",
                "credit_limit": 10000,
                "balance": 0,
                "due_date_day": 15
            })
            print(f"💳 Created default card: {card.name}")
    
    # Update card_id in transactions
    for tx in new_txs:
        tx.card_id = card.id
    
    # Add only new (non-duplicate) transactions
    added_txs = store.add_new_transactions(user.id, card.id, new_txs)
    
    # Update balance: add only new charges to existing balance
    if added_txs:
        new_charges = sum(tx.amount for tx in added_txs if tx.type == "charge")
        card.balance = card.balance + new_charges
        print(f"✅ Added {len(added_txs)} new transactions, new charges: ${new_charges:.2f}")
        print(f"💰 Updated card balance: ${card.balance:.2f}")
    else:
        print(f"ℹ️ No new transactions (all duplicates)")
    
    # Refresh projections
    store._generate_mock_projections(user.id, card.id)
    
    response = {
        "added": len(added_txs),
        "card_id": card.id,
        "card_name": card.name,
        "transactions": [
            {
                "description": tx.description,
                "amount": tx.amount,
                "date": tx.date,
                "category": tx.category
            } for tx in added_txs
        ]
    }
    
    print(f"📤 Returning response: {len(added_txs)} new transactions")
    return response
