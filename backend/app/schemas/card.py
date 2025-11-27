from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class Card(BaseModel):
    id: str
    user_id: str
    name: str
    issuer: str
    last4: str
    credit_limit: float
    balance: float
    due_date_day: int  # day of month
    minimum_payment: Optional[float] = None  # From statement
    no_interest_payment: Optional[float] = None  # From statement
    cat: Optional[float] = None  # Annual interest rate (CAT) from statement
    statement_date: Optional[str] = None  # Date of the statement (ISO format) - prevents stale updates


class TransactionSummary(BaseModel):
    """Lightweight transaction for summary views"""
    id: str
    date: str
    description: str
    category: str
    amount: float
    type: str
    installments: Optional[int] = None
    months_paid: int = 0  # Default to 0, not None
    
    class Config:
        # Ensure all fields are serialized, even if None
        exclude_none = False


class CardSummary(BaseModel):
    id: str
    name: str
    last4: str
    balance: float
    upcoming_payment_date: str
    minimum_due: float
    transactions: List[TransactionSummary] = []


class CardUpdate(BaseModel):
    name: Optional[str] = None
    credit_limit: Optional[float] = None
    due_date_day: Optional[int] = None
