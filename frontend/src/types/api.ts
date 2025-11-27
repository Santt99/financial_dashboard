export interface CardSummary {
  id: string;
  name: string;
  balance: number;
  upcoming_payment_date: string;
  minimum_due: number;
}

export interface DashboardSummary {
  total_debt: number;
  cards: CardSummary[];
  upcoming_payments: {
    card_id: string;
    card_name: string;
    due_date: string;
    estimated_minimum: number;
  }[];
}

export interface CardDetail {
  card: {
    id: string;
    user_id: string;
    name: string;
    issuer: string;
    last4: string;
    credit_limit: number;
    balance: number;
    due_date_day: number;
  };
  transactions: Transaction[];
  category_aggregates: { category: string; total: number }[];
  projections: Projection[];
}

export interface Transaction {
  id: string;
  user_id: string;
  card_id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  type: 'charge' | 'payment';
}

export interface Projection {
  month: string;
  projected_balance: number;
  projected_min_payment: number;
  no_interest_payment: number;
  total_debt: number;  // Total debt including all pending MSI
  projected_interest?: number;  // Optional: interest if only paying minimum
}
