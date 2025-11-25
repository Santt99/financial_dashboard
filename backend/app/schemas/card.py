from pydantic import BaseModel
from typing import Optional


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


class CardSummary(BaseModel):
    id: str
    name: str
    balance: float
    upcoming_payment_date: str
    minimum_due: float


class CardUpdate(BaseModel):
    name: Optional[str] = None
    credit_limit: Optional[float] = None
    due_date_day: Optional[int] = None
