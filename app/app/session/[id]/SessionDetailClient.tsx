"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { KpiCard } from "@/components/KpiCard";
import { MoneyModal } from "@/components/MoneyModal";
import { TransactionList } from "@/components/TransactionList";
import { EndSessionButton } from "@/components/EndSessionButton";
import type { Session, Transaction, TransactionType } from "@/lib/types";

interface SessionDetailClientProps {
  session: Session;
  initialTransactions: Transaction[];
  initialTotalInCents: number;
  initialTotalOutCents: number;
  initialNetCents: number;
}

function formatSessionDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function SessionDetailClient({
  session,
  initialTransactions,
  initialTotalInCents,
  initialTotalOutCents,
  initialNetCents,
}: SessionDetailClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [totalInCents, setTotalInCents] = useState(initialTotalInCents);
  const [totalOutCents, setTotalOutCents] = useState(initialTotalOutCents);
  const [netCents, setNetCents] = useState(initialNetCents);
  const [endedAt, setEndedAt] = useState<string | null>(session.ended_at);
  const [modalType, setModalType] = useState<TransactionType | null>(null);
  const [notes, setNotes] = useState(session.notes ?? "");

  const addTransaction = useCallback(
    async (type: TransactionType, amountCents: number, note: string | null) => {
      if (amountCents <= 0) {
        toast.error("Amount must be greater than zero.");
        return;
      }
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Not signed in.");
        return;
      }

      const { data: tx, error } = await supabase
        .from("transactions")
        .insert({
          session_id: session.id,
          user_id: user.id,
          type,
          amount_cents: amountCents,
          note: note ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      setTransactions((prev) => [tx, ...prev]);
      if (type === "cash_in") {
        setTotalInCents((prev) => prev + amountCents);
      } else {
        setTotalOutCents((prev) => prev + amountCents);
      }
      setNetCents((prev) => (type === "cash_out" ? prev + amountCents : prev - amountCents));
      router.refresh();
    },
    [session.id, supabase, router]
  );

  const handleSaveTransaction = useCallback(
    async (amountCents: number, note: string | null) => {
      if (!modalType) return;
      await addTransaction(modalType, amountCents, note);
      toast.success(
        modalType === "cash_in" ? "Cash in recorded." : "Cash out recorded."
      );
    },
    [modalType, addTransaction]
  );

  const saveNotes = useCallback(async () => {
    const { error } = await supabase
      .from("sessions")
      .update({ notes: notes.trim() || null })
      .eq("id", session.id);
    if (error) toast.error("Could not save notes.");
    else {
      toast.success("Notes saved.");
      router.refresh();
    }
  }, [session.id, notes, supabase, router]);

  const endSession = useCallback(async () => {
    const { error } = await supabase
      .from("sessions")
      .update({ ended_at: new Date().toISOString() })
      .eq("id", session.id);
    if (error) throw error;
    setEndedAt(new Date().toISOString());
    router.refresh();
  }, [session.id, supabase, router]);

  // Running net after each tx in chronological order, then reverse to match newest-first list
  const chronological = [...transactions].sort(
    (a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime()
  );
  const runningChrono: number[] = [];
  let running = 0;
  for (const t of chronological) {
    running += t.type === "cash_out" ? t.amount_cents : -t.amount_cents;
    runningChrono.push(running);
  }
  const runningNets = runningChrono.reverse();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-4">
        <Link
          href="/app"
          className="text-sm text-[#9ca3af] hover:text-white transition-colors"
        >
          ← Dashboard
        </Link>
      </div>

      <header>
        <h1 className="text-xl font-semibold text-white">
          Session · {formatSessionDate(session.started_at)}
        </h1>
        {session.casino_name && (
          <p className="text-sm text-[#9ca3af] mt-0.5">{session.casino_name}</p>
        )}
        {endedAt && (
          <span className="inline-block mt-2 rounded-full bg-[#2a2f36] text-[#9ca3af] text-xs px-2 py-0.5">
            Ended
          </span>
        )}
      </header>

      <section>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard label="Total In" valueCents={totalInCents} />
          <KpiCard label="Total Out" valueCents={totalOutCents} />
          <KpiCard label="Net" valueCents={netCents} variant="net" />
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
            onBlur={saveNotes}
            placeholder="Optional session notes…"
            rows={2}
            className="w-full resize-none rounded-lg bg-[#0f1114] border border-[#2a2f36] px-3 py-2 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-[#2dd4bf]/50 transition-colors"
          />
          <p className="text-xs text-[#6b7280] mt-1">Saved automatically on blur.</p>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-medium uppercase tracking-wider text-[#9ca3af] mb-3">
          Transactions
        </h2>
        <TransactionList
          transactions={transactions}
          runningNetAfterEach={runningNets}
        />
      </section>

      {!endedAt && (
        <div className="pt-2">
          <EndSessionButton onEnd={endSession} />
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
