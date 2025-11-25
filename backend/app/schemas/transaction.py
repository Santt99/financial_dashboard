from pydantic import BaseModel
from typing import Literal, Optional


class Transaction(BaseModel):
    id: str
    user_id: str
    card_id: str
    date: str  # ISO date
    description: str
    category: str
    amount: float  # positive for charge, negative for payment/credit
    type: Literal["charge", "payment"]
    installment_plan: Optional[int] = None  # Months without interest (MSI), None if not applicable


class CategoryAggregate(BaseModel):
    category: str
    total: float
