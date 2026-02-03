export type TransactionType = "cash_in" | "cash_out";

export interface Session {
  id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  casino_name: string | null;
  notes: string | null;
  budget_cents: number | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  session_id: string;
  user_id: string;
  type: TransactionType;
  amount_cents: number;
  occurred_at: string;
  note: string | null;
  game: string | null;
  created_at: string;
}

export interface SessionWithTotals extends Session {
  total_in_cents: number;
  total_out_cents: number;
  net_cents: number;
}

export interface AllTimeTotals {
  total_in_cents: number;
  total_out_cents: number;
  net_cents: number;
}
