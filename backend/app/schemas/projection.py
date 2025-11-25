from pydantic import BaseModel
from typing import Optional


class MonthlyProjection(BaseModel):
    month: str  # e.g. 2025-11
    projected_balance: float  # Current balance (saldo)
    projected_min_payment: float
    no_interest_payment: float  # Payment needed to avoid interest
    total_debt: float = 0.0  # Total debt including all MSI pending
    projected_interest: Optional[float] = None  # Interest if only paying minimum
