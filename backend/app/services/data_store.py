"""Simple in-memory mock data store simulating non-relational collections.

This keeps data per user id. In a future iteration this can be replaced by MongoDB.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List
import uuid
from datetime import datetime, timedelta

from app.schemas.user import User
from app.schemas.card import Card, CardSummary
from app.schemas.transaction import Transaction, CategoryAggregate
from app.schemas.projection import MonthlyProjection
from app.core.security import hash_password


@dataclass
class _UserRecord:
    id: str
    email: str
    password_hash: str


class DataStore:
    def __init__(self) -> None:
        self.users: Dict[str, _UserRecord] = {}
        self.cards: Dict[str, List[Card]] = {}
        self.transactions: Dict[str, List[Transaction]] = {}
        self.projections: Dict[str, Dict[str, List[MonthlyProjection]]] = {}  # user -> card_id -> projections

    # User operations
    def create_user(self, email: str, password: str) -> User:
        user_id = str(uuid.uuid4())
        record = _UserRecord(id=user_id, email=email, password_hash=hash_password(password))
        self.users[email] = record
        # initialize containers
        self.cards[user_id] = []
        self.transactions[user_id] = []
        self.projections[user_id] = {}
        return User(id=user_id, email=email)

    def get_user_by_email(self, email: str) -> _UserRecord | None:
        return self.users.get(email)

    def get_user_public(self, user_id: str) -> User | None:
        for rec in self.users.values():
            if rec.id == user_id:
                return User(id=rec.id, email=rec.email)
        return None

    # Card operations
    def add_mock_cards(self, user_id: str) -> None:
        # No longer adding mock cards - cards are created from uploaded statements
        if user_id not in self.cards:
            self.cards[user_id] = []

    def list_cards(self, user_id: str) -> List[Card]:
        return self.cards.get(user_id, [])

    def get_card(self, user_id: str, card_id: str) -> Card | None:
        return next((c for c in self.cards.get(user_id, []) if c.id == card_id), None)

    def create_or_update_card(self, user_id: str, card_info: dict) -> Card:
        """Create a new card or update existing one based on extracted info.
        
        Args:
            user_id: User ID
            card_info: Dictionary with card information from Gemini
            
        Returns:
            Created or updated Card object
        """
        if user_id not in self.cards:
            self.cards[user_id] = []
        
        # Check if card with same last4 exists
        existing_card = None
        last4_value = card_info.get("last4")
        if last4_value:
            existing_card = next(
                (c for c in self.cards[user_id] if c.last4 == last4_value),
                None
            )
        
        if existing_card:
            # Update existing card with new statement data
            existing_card.name = card_info.get("name", existing_card.name)
            existing_card.issuer = card_info.get("issuer", existing_card.issuer)
            if card_info.get("last4"):
                existing_card.last4 = card_info.get("last4")
            existing_card.credit_limit = float(card_info.get("credit_limit", existing_card.credit_limit))
            existing_card.balance = float(card_info.get("balance", existing_card.balance))
            existing_card.due_date_day = int(card_info.get("due_date_day") or existing_card.due_date_day)
            
            # Update payment info from statement
            if "minimum_payment" in card_info and card_info["minimum_payment"]:
                existing_card.minimum_payment = float(card_info["minimum_payment"])
            if "no_interest_payment" in card_info and card_info["no_interest_payment"]:
                existing_card.no_interest_payment = float(card_info["no_interest_payment"])
            if "cat" in card_info and card_info["cat"]:
                existing_card.cat = float(card_info["cat"])
                
            return existing_card
        else:
            # Create new card
            new_card = Card(
                id=str(uuid.uuid4()),
                user_id=user_id,
                name=card_info.get("name", "Unknown Card"),
                issuer=card_info.get("issuer", "Unknown Bank"),
                last4=card_info.get("last4") or "0000",
                credit_limit=float(card_info.get("credit_limit", 10000)),
                balance=float(card_info.get("balance", 0)),
                due_date_day=int(card_info.get("due_date_day") or 15),
                minimum_payment=float(card_info.get("minimum_payment", 0)) if card_info.get("minimum_payment") else None,
                no_interest_payment=float(card_info.get("no_interest_payment", 0)) if card_info.get("no_interest_payment") else None,
                cat=float(card_info.get("cat", 0)) if card_info.get("cat") else None,
            )
            self.cards[user_id].append(new_card)
            # Initialize projections for new card
            self._generate_mock_projections(user_id, new_card.id)
            return new_card

    # Transactions
    def list_transactions(self, user_id: str, card_id: str | None = None) -> List[Transaction]:
        txs = self.transactions.get(user_id, [])
        if card_id:
            return [t for t in txs if t.card_id == card_id]
        return txs

    def is_duplicate_transaction(self, user_id: str, card_id: str, tx: Transaction) -> bool:
        """Check if transaction is duplicate based on date, amount, and description."""
        existing = self.list_transactions(user_id, card_id)
        for existing_tx in existing:
            if (existing_tx.date == tx.date and 
                abs(existing_tx.amount - tx.amount) < 0.01 and  # Float comparison with tolerance
                existing_tx.description.strip().lower() == tx.description.strip().lower()):
                return True
        return False

    def add_new_transactions(self, user_id: str, card_id: str, new_transactions: List[Transaction]) -> List[Transaction]:
        """Add only non-duplicate transactions and return the added ones."""
        if user_id not in self.transactions:
            self.transactions[user_id] = []
        
        added = []
        for tx in new_transactions:
            if not self.is_duplicate_transaction(user_id, card_id, tx):
                self.transactions[user_id].append(tx)
                added.append(tx)
        
        return added

    def category_aggregates(self, user_id: str, card_id: str | None = None) -> List[CategoryAggregate]:
        txs = self.list_transactions(user_id, card_id)
        totals: Dict[str, float] = {}
        for t in txs:
            if t.type == "charge":
                totals[t.category] = totals.get(t.category, 0.0) + t.amount
        return [CategoryAggregate(category=k, total=v) for k, v in totals.items()]

    # Projections
    def list_projections(self, user_id: str, card_id: str) -> List[MonthlyProjection]:
        return self.projections.get(user_id, {}).get(card_id, [])

    # Dashboard summary helpers
    def general_summary(self, user_id: str) -> dict:
        cards = self.list_cards(user_id)
        # total_debt = sum of total_debt from month 0 projections (includes all MSI pending)
        total_debt = 0
        for card in cards:
            projections = self.list_projections(user_id, card.id)
            if projections:
                # Month 0 projection has total_debt that includes all MSI
                total_debt += projections[0].total_debt
            else:
                # Fallback to balance if no projections yet
                total_debt += card.balance
        
        upcoming = [
            {
                "card_id": c.id,
                "card_name": c.name,
                "due_date": self._next_due_date_iso(c.due_date_day),
                "estimated_minimum": c.minimum_payment if c.minimum_payment else 0,
            }
            for c in cards
        ]
        return {
            "total_debt": total_debt,
            "cards": [self._card_summary(c) for c in cards],
            "upcoming_payments": upcoming,
        }

    def _card_summary(self, card: Card) -> CardSummary:
        # Get the projected balance from month 0 projection (most accurate payment amount)
        # This is the amount needed to pay without generating interest
        projections = self.projections.get(card.user_id, {}).get(card.id, [])
        if projections:
            balance_to_show = projections[0].projected_balance
        else:
            balance_to_show = card.balance
        
        return CardSummary(
            id=card.id,
            name=card.name,
            balance=balance_to_show,
            upcoming_payment_date=self._next_due_date_iso(card.due_date_day),
            minimum_due=card.minimum_payment if card.minimum_payment else 0,
        )

    # Internal mock generators
    def _generate_mock_transactions(self, user_id: str, card_id: str) -> None:
        sample_categories = ["Groceries", "Travel", "Dining", "Utilities", "Online Shopping"]
        base_date = datetime.utcnow()
        txs: List[Transaction] = []
        for i in range(15):
            cat = sample_categories[i % len(sample_categories)]
            txs.append(
                Transaction(
                    id=str(uuid.uuid4()),
                    user_id=user_id,
                    card_id=card_id,
                    date=(base_date - timedelta(days=i)).date().isoformat(),
                    description=f"{cat} purchase #{i+1}",
                    category=cat,
                    amount=round(20 + i * 3.1, 2),
                    type="charge",
                )
            )
        # Add a payment
        txs.append(
            Transaction(
                id=str(uuid.uuid4()),
                user_id=user_id,
                card_id=card_id,
                date=base_date.date().isoformat(),
                description="Monthly payment",
                category="Payment",
                amount=-150.0,
                type="payment",
            )
        )
        self.transactions[user_id].extend(txs)

    def _generate_mock_projections(self, user_id: str, card_id: str) -> None:
        """Generate payment projections for a card.
        
        Uses actual values from statement for current month:
        - Minimum payment (from statement)
        - No-interest payment (from statement - already includes MSI installments)
        - Balance (from statement)
        
        For future months, assumes user pays no-interest amount (balance + remaining MSI charges).
        Only adds MSI that are still pending (months_remaining > 0).
        """
        today = datetime.utcnow()
        projections: List[MonthlyProjection] = []
        
        # Get current balance and card info
        card = next(c for c in self.cards[user_id] if c.id == card_id)
        current_balance = card.balance  # Balance from statement (current month)
        
        # Get MSI transactions to calculate monthly installments for future projections
        txs = self.list_transactions(user_id, card_id)
        msi_transactions = [tx for tx in txs if tx.type == "charge" and tx.installment_plan]
        
        # Create list of (monthly_amount, months_remaining, total_original_amount) for each MSI
        # We assume all MSI transactions just started, so months_remaining = installment_plan
        msi_schedule = [(tx.amount / tx.installment_plan, tx.installment_plan, tx.amount) for tx in msi_transactions]
        
        # Calculate total MSI debt (sum of all original amounts)
        total_msi_debt = sum(total_amt for _, _, total_amt in msi_schedule)
        
        # Debug: log MSI transactions
        if msi_transactions:
            print(f"[DEBUG] Found {len(msi_transactions)} MSI transactions:")
            for tx in msi_transactions:
                print(f"  - {tx.description}: ${tx.amount} / {tx.installment_plan} = ${tx.amount / tx.installment_plan}/month")
        
        # Get payment info from statement (first month)
        min_payment = card.minimum_payment if card.minimum_payment else 0
        # No-interest payment from statement
        no_interest_payment = card.no_interest_payment if card.no_interest_payment else 0
        
        # Calculate monthly interest rate from CAT - no fallback rate
        # CAT is annual, convert to monthly rate
        monthly_rate = (card.cat / 100 / 12) if card.cat else 0
        
        balance = current_balance
        
        # Pre-calculate all no_interest_payments for each month to know total_debt
        all_no_interest_payments = []
        temp_msi_schedule = [(tx.amount / tx.installment_plan, tx.installment_plan, tx.amount) for tx in msi_transactions]
        
        # Month 0
        all_no_interest_payments.append(no_interest_payment)
        
        # Decrement MSI for month 1
        for j in range(len(temp_msi_schedule)):
            monthly_amt, months_left, total_amt = temp_msi_schedule[j]
            if months_left > 0:
                temp_msi_schedule[j] = (monthly_amt, months_left - 1, total_amt)
        
        # Months 1-5
        for month_idx in range(1, 6):
            total_msi_this_month = sum(monthly_amt for monthly_amt, months_left, _ in temp_msi_schedule if months_left > 0)
            all_no_interest_payments.append(total_msi_this_month)
            # Decrement for next month
            for j in range(len(temp_msi_schedule)):
                monthly_amt, months_left, total_amt = temp_msi_schedule[j]
                if months_left > 0:
                    temp_msi_schedule[j] = (monthly_amt, months_left - 1, total_amt)
        
        # Reset msi_schedule for actual projection calculation
        msi_schedule = [(tx.amount / tx.installment_plan, tx.installment_plan, tx.amount) for tx in msi_transactions]
        
        for i in range(6):
            month_date = (today + timedelta(days=30 * i))
            
            if i == 0:
                # First month: use actual values from statement
                projected_interest = balance * monthly_rate if balance > 0 else 0
                
                # Total debt = sum of all no_interest_payments from month 0 to 5
                total_debt = sum(all_no_interest_payments)
                
                # Projected balance = no_interest_payment (what you need to pay to avoid interest)
                projected_balance = no_interest_payment
                
                projections.append(
                    MonthlyProjection(
                        month=month_date.strftime("%Y-%m"),
                        projected_balance=round(projected_balance, 2),
                        projected_min_payment=round(min_payment, 2),
                        no_interest_payment=round(no_interest_payment, 2),
                        total_debt=round(total_debt, 2),
                        projected_interest=round(projected_interest, 2),
                    )
                )
                # Assume user paid the no_interest_payment for next month projection
                balance = 0  # After payment, balance is 0
                # Decrement months_remaining for first month's MSI
                for j in range(len(msi_schedule)):
                    monthly_amt, months_left, total_amt = msi_schedule[j]
                    if months_left > 0:
                        msi_schedule[j] = (monthly_amt, months_left - 1, total_amt)
            else:
                # Future months: calculate projections
                # Calculate MSI due for this month (only for months that still have installments remaining)
                total_msi_this_month = sum(monthly_amt for monthly_amt, months_left, _ in msi_schedule if months_left > 0)
                
                # Saldo (projected_balance) at start of month = MSI of this month (after paying all last month)
                current_month_balance = total_msi_this_month
                
                # Total debt = sum of remaining no_interest_payments (current month onwards)
                total_debt = sum(all_no_interest_payments[i:])
                
                # Calculate interest on previous balance (which was 0, so no interest)
                interest = 0
                min_pay = total_msi_this_month * 0.03 if total_msi_this_month > 0 else 0
                # No-interest payment equals the saldo at start of month
                no_int_pay = total_msi_this_month
                
                print(f"[DEBUG] Month {i}: saldo=${current_month_balance:.2f}, sin_interes=${no_int_pay:.2f}, total_debt=${total_debt:.2f}, remaining_payments={all_no_interest_payments[i:]}")
                
                projections.append(
                    MonthlyProjection(
                        month=month_date.strftime("%Y-%m"),
                        projected_balance=round(current_month_balance, 2),
                        projected_min_payment=round(min_pay, 2),
                        no_interest_payment=round(no_int_pay, 2),
                        total_debt=round(total_debt, 2),
                        projected_interest=round(interest, 2),
                    )
                )
                
                # Balance stays at 0 for next iteration (will add MSI again)
                balance = 0
                
                # Decrement months_remaining for each MSI
                for j in range(len(msi_schedule)):
                    monthly_amt, months_left, total_amt = msi_schedule[j]
                    if months_left > 0:
                        msi_schedule[j] = (monthly_amt, months_left - 1, total_amt)
        
        self.projections[user_id][card_id] = projections

    @staticmethod
    def _next_due_date_iso(due_day: int) -> str:
        today = datetime.utcnow().date()
        year = today.year
        month = today.month
        if today.day >= due_day:
            # move to next month
            if month == 12:
                month = 1
                year += 1
            else:
                month += 1
        try:
            dt = datetime(year, month, due_day)
        except ValueError:
            # fallback to last day of month if invalid (e.g., 31 in Feb)
            for day in range(28, 32)[::-1]:
                try:
                    dt = datetime(year, month, day)
                    break
                except ValueError:
                    continue
        return dt.date().isoformat()


store = DataStore()