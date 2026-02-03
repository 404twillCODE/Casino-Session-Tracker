"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { KpiCard } from "@/components/KpiCard";
import { MoneyModal } from "@/components/MoneyModal";
import { TransactionList } from "@/components/TransactionList";
import { EndSessionButton } from "@/components/EndSessionButton";
import {
  addGuestTransaction,
  endGuestSession,
  getGuestSession,
  getGuestSessionTotals,
  getGuestTransactions,
  updateGuestSessionNotes,
} from "@/lib/guest-storage";
import type { Transaction, TransactionType } from "@/lib/types";

function formatSessionDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function GuestSessionPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [modalType, setModalType] = useState<TransactionType | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [session, setSession] = useState<ReturnType<typeof getGuestSession> | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [notes, setNotes] = useState("");
  const [endedAt, setEndedAt] = useState<string | null>(null);
  const [totals, setTotals] = useState({ totalInCents: 0, totalOutCents: 0, netCents: 0 });

  useEffect(() => {
    if (!params?.id) return;
    const id = params.id;
    setSessionId(id);
    const s = getGuestSession(id);
    if (!s) return;
    setSession(s);
    setNotes(s.notes ?? "");
    setEndedAt(s.ended_at);
    const txs = getGuestTransactions(id).map((t) => ({ ...t, user_id: "guest" }));
    setTransactions(txs);
    setTotals(getGuestSessionTotals(id));
  }, [params?.id]);

  const runningNets = useMemo(() => {
    const chronological = [...transactions].sort(
      (a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime()
    );
    const runningChrono: number[] = [];
    let running = 0;
    for (const t of chronological) {
      running += t.type === "cash_out" ? t.amount_cents : -t.amount_cents;
      runningChrono.push(running);
    }
    return runningChrono.reverse();
  }, [transactions]);

  async function handleSaveTransaction(amountCents: number, note: string | null) {
    if (!sessionId || !modalType) return;
    const tx = addGuestTransaction(sessionId, modalType, amountCents, note ?? null);
    if (!tx) {
      toast.error("Amount must be greater than zero.");
      return;
    }
    setTransactions((prev) => [{ ...tx, user_id: "guest" }, ...prev]);
    const nextTotals = getGuestSessionTotals(sessionId);
    setTotals(nextTotals);
    toast.success(modalType === "cash_in" ? "Cash in recorded." : "Cash out recorded.");
  }

  function handleEndSession() {
    if (!sessionId) return;
    endGuestSession(sessionId);
    const updated = getGuestSession(sessionId);
    setEndedAt(updated?.ended_at ?? null);
    toast.success("Session ended.");
  }

  function handleNotesBlur() {
    if (!sessionId) return;
    updateGuestSessionNotes(sessionId, notes.trim() || null);
    toast.success("Notes saved.");
  }

  if (!session) {
    return (
      <div className="rounded-xl bg-[#1a1d21] border border-[#2a2f36] p-8 text-center">
        <p className="text-[#9ca3af]">Session not found.</p>
        <button
          type="button"
          onClick={() => router.push("/guest")}
          className="inline-block mt-4 rounded-lg bg-[#2dd4bf]/90 px-4 py-2 text-sm font-medium text-[#0f1114] hover:bg-[#2dd4bf] transition-colors"
        >
          Back to Guest Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-xl bg-[#1a1d21] border border-[#2a2f36] p-4">
        <p className="text-sm text-[#9ca3af]">
          Guest mode: data is stored only in this browser and will not sync to other devices.
        </p>
      </section>

      <div className="flex flex-wrap items-center gap-4">
        <Link
          href="/guest"
          className="text-sm text-[#9ca3af] hover:text-white transition-colors"
        >
          ← Guest Dashboard
        </Link>
      </div>

      <header>
        <h1 className="text-xl font-semibold text-white">
          Session · {formatSessionDate(session.started_at)}
        </h1>
        {endedAt && (
          <span className="inline-block mt-2 rounded-full bg-[#2a2f36] text-[#9ca3af] text-xs px-2 py-0.5">
            Ended
          </span>
        )}
      </header>

      <section>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard label="Total In" valueCents={totals.totalInCents} />
          <KpiCard label="Total Out" valueCents={totals.totalOutCents} />
          <KpiCard label="Net" valueCents={totals.netCents} variant="net" />
        </div>
      </section>

      {!endedAt && (
        <section className="flex flex-wrap gap-3">
          <motion.button
            type="button"
            onClick={() => setModalType("cash_in")}
            whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(45, 212, 191, 0.12)", borderColor: "rgba(45, 212, 191, 0.35)" }}
            whileTap={{ scale: 0.98 }}
            className="rounded-xl bg-[#1a1d21] border border-[#2a2f36] px-6 py-4 text-left min-w-[160px] transition-all duration-200"
          >
            <span className="block text-2xl font-semibold text-[#2dd4bf]">+ Cash In</span>
            <span className="block text-xs text-[#9ca3af] mt-0.5">Add buy-in</span>
          </motion.button>
          <motion.button
            type="button"
            onClick={() => setModalType("cash_out")}
            whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(45, 212, 191, 0.12)", borderColor: "rgba(45, 212, 191, 0.35)" }}
            whileTap={{ scale: 0.98 }}
            className="rounded-xl bg-[#1a1d21] border border-[#2a2f36] px-6 py-4 text-left min-w-[160px] transition-all duration-200"
          >
            <span className="block text-2xl font-semibold text-[#5eead4]">+ Cash Out</span>
            <span className="block text-xs text-[#9ca3af] mt-0.5">Record cash out</span>
          </motion.button>
        </section>
      )}

      <section>
        <h2 className="text-sm font-medium uppercase tracking-wider text-[#9ca3af] mb-3">
          Notes
        </h2>
        <div className="rounded-xl bg-[#1a1d21] border border-[#2a2f36] p-4">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={handleNotesBlur}
            placeholder="Optional session notes…"
            rows={2}
            className="w-full resize-none rounded-lg bg-[#0f1114] border border-[#2a2f36] px-3 py-2 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-[#2dd4bf]/50 transition-colors"
          />
          <p className="text-xs text-[#6b7280] mt-1">Saved locally on blur.</p>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-medium uppercase tracking-wider text-[#9ca3af] mb-3">
          Transactions
        </h2>
        <TransactionList transactions={transactions} runningNetAfterEach={runningNets} />
      </section>

      {!endedAt && (
        <div className="pt-2">
          <EndSessionButton onEnd={async () => handleEndSession()} />
        </div>
      )}

      <MoneyModal
        isOpen={modalType !== null}
        onClose={() => setModalType(null)}
        onSave={handleSaveTransaction}
        type={modalType ?? "cash_in"}
      />
    </div>
  );
}
