import { createClient } from "@/lib/supabase/server";
import type { Session, Transaction, SessionWithTotals, AllTimeTotals } from "@/lib/types";

export async function getSessionsWithTotals(): Promise<SessionWithTotals[]> {
  const supabase = await createClient();
  const { data: sessions, error: sessionsError } = await supabase
    .from("sessions")
    .select("*")
    .order("started_at", { ascending: false });

  if (sessionsError) throw sessionsError;
  if (!sessions?.length) return [];

  const { data: transactions, error: txError } = await supabase
    .from("transactions")
    .select("*")
    .in("session_id", sessions.map((s) => s.id));

  if (txError) throw txError;

  const txBySession = (transactions ?? []).reduce<Record<string, Transaction[]>>(
    (acc, t) => {
      if (!acc[t.session_id]) acc[t.session_id] = [];
      acc[t.session_id].push(t);
      return acc;
    },
    {}
  );

  return sessions.map((s) => {
    const txs = txBySession[s.id] ?? [];
    const total_in_cents = txs
      .filter((t) => t.type === "cash_in")
      .reduce((sum, t) => sum + t.amount_cents, 0);
    const total_out_cents = txs
      .filter((t) => t.type === "cash_out")
      .reduce((sum, t) => sum + t.amount_cents, 0);
    return {
      ...s,
      total_in_cents,
      total_out_cents,
      net_cents: total_out_cents - total_in_cents,
    };
  });
}

export async function getAllTimeTotals(): Promise<AllTimeTotals> {
  const supabase = await createClient();
  const { data: transactions, error } = await supabase
    .from("transactions")
    .select("type, amount_cents");

  if (error) throw error;

  let total_in_cents = 0;
  let total_out_cents = 0;
  for (const t of transactions ?? []) {
    if (t.type === "cash_in") total_in_cents += t.amount_cents;
    else total_out_cents += t.amount_cents;
  }

  return {
    total_in_cents,
    total_out_cents,
    net_cents: total_out_cents - total_in_cents,
  };
}

export async function getSession(id: string): Promise<Session | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return data;
}

export async function getSessionWithTransactions(sessionId: string): Promise<{
  session: Session | null;
  transactions: Transaction[];
  totalInCents: number;
  totalOutCents: number;
  netCents: number;
}> {
  const supabase = await createClient();
  const session = await getSession(sessionId);
  if (!session) return { session: null, transactions: [], totalInCents: 0, totalOutCents: 0, netCents: 0 };

  const { data: transactions, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("session_id", sessionId)
    .order("occurred_at", { ascending: false });

  if (error) throw error;
  const txs = transactions ?? [];
  const totalInCents = txs.filter((t) => t.type === "cash_in").reduce((s, t) => s + t.amount_cents, 0);
  const totalOutCents = txs.filter((t) => t.type === "cash_out").reduce((s, t) => s + t.amount_cents, 0);
  const netCents = totalOutCents - totalInCents;

  return {
    session,
    transactions: txs,
    totalInCents,
    totalOutCents,
    netCents,
  };
}
