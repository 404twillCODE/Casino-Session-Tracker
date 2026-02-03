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
import { parseMoneyToCents, formatMoney } from "@/lib/format";
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
  const [budgetInput, setBudgetInput] = useState(
    session.budget_cents ? (session.budget_cents / 100).toFixed(2) : ""
  );
  const [budgetCents, setBudgetCents] = useState<number | null>(
    session.budget_cents ?? null
  );

  const chipPresets = [25, 75, 150, 300, 600];

  const addTransaction = useCallback(
    async (
      type: TransactionType,
      amountCents: number,
      note: string | null,
      game: string | null
    ) => {
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
          game: game ?? null,
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

  const addQuickChip = useCallback(
    async (type: TransactionType, amountCents: number) => {
      await addTransaction(type, amountCents, null, null);
      toast.success(
        `${type === "cash_in" ? "Buy In" : "Cash Out"} ${formatMoney(amountCents)}`
      );
    },
    [addTransaction]
  );

  const handleSaveTransaction = useCallback(
    async (amountCents: number, note: string | null, game: string | null) => {
      if (!modalType) return;
      await addTransaction(modalType, amountCents, note, game);
      toast.success(
        modalType === "cash_in" ? "Buy in recorded." : "Cash out recorded."
      );
    },
    [modalType, addTransaction]
  );

  const saveBudget = useCallback(async () => {
    if (budgetInput.trim() === "") {
      setBudgetCents(null);
      const { error } = await supabase
        .from("sessions")
        .update({ budget_cents: null })
        .eq("id", session.id);
      if (error) toast.error("Could not clear budget.");
      else router.refresh();
      return;
    }
    const cents = parseMoneyToCents(budgetInput);
    if (!cents || cents <= 0) {
      toast.error("Enter a valid budget.");
      return;
    }
    setBudgetCents(cents);
    const { error } = await supabase
      .from("sessions")
      .update({ budget_cents: cents })
      .eq("id", session.id);
    if (error) toast.error("Could not save budget.");
    else router.refresh();
  }, [budgetInput, session.id, supabase, router]);

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

  const netLoss = Math.max(0, totalInCents - totalOutCents);
  const budgetRemaining =
    budgetCents !== null ? Math.max(0, budgetCents - netLoss) : null;

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

      <header className="space-y-2">
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

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl bg-[#1a1d21] border border-[#2a2f36] p-4">
          <label className="block text-xs font-medium uppercase tracking-wider text-[#9ca3af] mb-2">
            Session budget (optional)
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={budgetInput}
            onChange={(e) => setBudgetInput(e.target.value)}
            onBlur={saveBudget}
            placeholder="e.g. 500"
            className="w-full rounded-lg bg-[#0f1114] border border-[#2a2f36] px-3 py-2 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-[#2dd4bf]/60 focus:ring-1 focus:ring-[#2dd4bf]/40 transition-colors"
          />
          <p className="text-xs text-[#6b7280] mt-2">
            Max you want to risk for this session. Saved on blur.
          </p>
        </div>
        <div className="rounded-xl bg-[#1a1d21] border border-[#2a2f36] p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-[#9ca3af] mb-2">
            Budget remaining
          </p>
          <p className="text-lg font-semibold text-white">
            {budgetRemaining !== null ? formatMoney(budgetRemaining) : "—"}
          </p>
          <p className="text-xs text-[#6b7280] mt-2">
            Based on total loss (Total In - Total Out).
          </p>
        </div>
      </section>

      {!endedAt && (
        <section className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <motion.button
              type="button"
              onClick={() => setModalType("cash_in")}
              whileHover={{
                scale: 1.02,
                boxShadow: "0 0 20px rgba(45, 212, 191, 0.12)",
                borderColor: "rgba(45, 212, 191, 0.35)",
              }}
              whileTap={{ scale: 0.98 }}
              className="rounded-xl bg-[#1a1d21] border border-[#2a2f36] px-6 py-4 text-left min-w-[170px] transition-all duration-200"
            >
              <span className="flex items-center gap-2 text-2xl font-semibold text-emerald-400">
                <span className="inline-flex h-5 w-5 rounded-full bg-emerald-500/30 border border-emerald-400/40" />
                Buy In
              </span>
              <span className="block text-xs text-[#9ca3af] mt-0.5">Add money to play</span>
            </motion.button>
            <motion.button
              type="button"
              onClick={() => setModalType("cash_out")}
              whileHover={{
                scale: 1.02,
                boxShadow: "0 0 20px rgba(239, 68, 68, 0.12)",
                borderColor: "rgba(239, 68, 68, 0.35)",
              }}
              whileTap={{ scale: 0.98 }}
              className="rounded-xl bg-[#1a1d21] border border-[#2a2f36] px-6 py-4 text-left min-w-[170px] transition-all duration-200"
            >
              <span className="block text-2xl font-semibold text-red-400">- Cash Out</span>
              <span className="block text-xs text-[#9ca3af] mt-0.5">Record a cash out</span>
            </motion.button>
          </div>

          <div className="rounded-xl bg-[#1a1d21] border border-[#2a2f36] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <h3 className="text-xs font-medium uppercase tracking-wider text-[#9ca3af]">
                Quick chips
              </h3>
              <div className="flex items-center gap-2 text-xs text-[#6b7280]">
                Tap to add instantly. Use Custom to add a note or game.
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <p className="text-xs text-emerald-400 font-medium uppercase tracking-wider">
                  Buy In
                </p>
                <div className="flex flex-wrap gap-2">
                  {chipPresets.map((amount) => (
                    <button
                      key={`buy-${amount}`}
                      type="button"
                      onClick={() => addQuickChip("cash_in", amount * 100)}
                      className="px-3 py-1.5 rounded-full border border-emerald-400/30 text-emerald-300 text-sm hover:bg-emerald-500/10 transition-colors"
                    >
                      +${amount}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setModalType("cash_in")}
                    className="px-3 py-1.5 rounded-full border border-[#2a2f36] text-[#9ca3af] text-sm hover:bg-[#2a2f36] transition-colors"
                  >
                    Custom
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-red-400 font-medium uppercase tracking-wider">
                  Cash Out
                </p>
                <div className="flex flex-wrap gap-2">
                  {chipPresets.map((amount) => (
                    <button
                      key={`out-${amount}`}
                      type="button"
                      onClick={() => addQuickChip("cash_out", amount * 100)}
                      className="px-3 py-1.5 rounded-full border border-red-400/30 text-red-300 text-sm hover:bg-red-500/10 transition-colors"
                    >
                      -${amount}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setModalType("cash_out")}
                    className="px-3 py-1.5 rounded-full border border-[#2a2f36] text-[#9ca3af] text-sm hover:bg-[#2a2f36] transition-colors"
                  >
                    Custom
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

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
