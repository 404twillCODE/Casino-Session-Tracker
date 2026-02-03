export type GuestTransactionType = "cash_in" | "cash_out";

export interface GuestSession {
  id: string;
  started_at: string;
  ended_at: string | null;
  casino_name: string | null;
  notes: string | null;
  created_at: string;
}

export interface GuestTransaction {
  id: string;
  session_id: string;
  type: GuestTransactionType;
  amount_cents: number;
  occurred_at: string;
  note: string | null;
  game: string | null;
  created_at: string;
}

interface GuestStore {
  sessions: GuestSession[];
  transactions: GuestTransaction[];
}

const STORAGE_KEY = "sessionstack_guest";

function nowIso(): string {
  return new Date().toISOString();
}

function getStore(): GuestStore {
  if (typeof window === "undefined") {
    return { sessions: [], transactions: [] };
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return { sessions: [], transactions: [] };
  try {
    const parsed = JSON.parse(raw) as GuestStore;
    return {
      sessions: parsed.sessions ?? [],
      transactions: parsed.transactions ?? [],
    };
  } catch {
    return { sessions: [], transactions: [] };
  }
}

function setStore(store: GuestStore) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function clearGuestStore() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function createGuestSession(): GuestSession {
  const store = getStore();
  const session: GuestSession = {
    id: crypto.randomUUID(),
    started_at: nowIso(),
    ended_at: null,
    casino_name: null,
    notes: null,
    created_at: nowIso(),
  };
  store.sessions.unshift(session);
  setStore(store);
  return session;
}

export function getGuestSessions(): GuestSession[] {
  const store = getStore();
  return [...store.sessions].sort(
    (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
  );
}

export function getGuestSession(id: string): GuestSession | null {
  const store = getStore();
  return store.sessions.find((s) => s.id === id) ?? null;
}

export function updateGuestSessionNotes(id: string, notes: string | null) {
  const store = getStore();
  const session = store.sessions.find((s) => s.id === id);
  if (!session) return;
  session.notes = notes;
  setStore(store);
}

export function endGuestSession(id: string) {
  const store = getStore();
  const session = store.sessions.find((s) => s.id === id);
  if (!session) return;
  session.ended_at = nowIso();
  setStore(store);
}

export function addGuestTransaction(
  sessionId: string,
  type: GuestTransactionType,
  amountCents: number,
  note: string | null,
  game: string | null
): GuestTransaction | null {
  if (amountCents <= 0) return null;
  const store = getStore();
  const session = store.sessions.find((s) => s.id === sessionId);
  if (!session) return null;
  const tx: GuestTransaction = {
    id: crypto.randomUUID(),
    session_id: sessionId,
    type,
    amount_cents: amountCents,
    occurred_at: nowIso(),
    note,
    game,
    created_at: nowIso(),
  };
  store.transactions.unshift(tx);
  setStore(store);
  return tx;
}

export function getGuestTransactions(sessionId: string): GuestTransaction[] {
  const store = getStore();
  return store.transactions
    .filter((t) => t.session_id === sessionId)
    .sort(
      (a, b) =>
        new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime()
    );
}

export function getGuestSessionTotals(sessionId: string): {
  totalInCents: number;
  totalOutCents: number;
  netCents: number;
} {
  const txs = getGuestTransactions(sessionId);
  const totalInCents = txs
    .filter((t) => t.type === "cash_in")
    .reduce((sum, t) => sum + t.amount_cents, 0);
  const totalOutCents = txs
    .filter((t) => t.type === "cash_out")
    .reduce((sum, t) => sum + t.amount_cents, 0);
  return {
    totalInCents,
    totalOutCents,
    netCents: totalOutCents - totalInCents,
  };
}

export function getGuestAllTimeTotals(): {
  totalInCents: number;
  totalOutCents: number;
  netCents: number;
} {
  const store = getStore();
  let totalInCents = 0;
  let totalOutCents = 0;
  for (const t of store.transactions) {
    if (t.type === "cash_in") totalInCents += t.amount_cents;
    else totalOutCents += t.amount_cents;
  }
  return {
    totalInCents,
    totalOutCents,
    netCents: totalOutCents - totalInCents,
  };
}
