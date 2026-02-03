"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { formatMoney } from "@/lib/format";
import type { Transaction } from "@/lib/types";

interface TransactionListProps {
  transactions: Transaction[];
  runningNetAfterEach?: number[]; // running net after each tx, same order (newest first)
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function TransactionList({
  transactions,
  runningNetAfterEach = [],
}: TransactionListProps) {
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({});

  if (transactions.length === 0) {
    return (
      <div className="rounded-xl bg-[#1a1d21] border border-[#2a2f36] p-8 text-center">
        <p className="text-[#9ca3af] text-sm">No transactions yet.</p>
        <p className="text-[#6b7280] text-xs mt-1">Add a Buy In or Cash Out above.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-1">
      {transactions.map((tx, i) => {
        const isIn = tx.type === "cash_in";
        const runningNet = runningNetAfterEach[i];
        const isOpen = Boolean(openIds[tx.id]);
        const amountText = `${isIn ? "+" : "-"}${formatMoney(tx.amount_cents)}`;
        return (
          <motion.li
            key={tx.id}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: i * 0.03 }}
            className="rounded-lg bg-[#1a1d21] border border-[#2a2f36] px-4 py-3"
          >
            <button
              type="button"
              onClick={() =>
                setOpenIds((prev) => ({ ...prev, [tx.id]: !prev[tx.id] }))
              }
              className="w-full text-left"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`shrink-0 w-2 h-2 rounded-full ${
                      isIn ? "bg-emerald-500" : "bg-red-500"
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white">
                      {isIn ? "Buy In" : "Cash Out"} ·{" "}
                      <span className={isIn ? "text-emerald-400" : "text-red-400"}>
                        {amountText}
                      </span>
                    </p>
                    <p className="text-xs text-[#9ca3af] truncate">
                      {tx.game ? `${tx.game} · ` : ""}
                      {formatTime(tx.occurred_at)}
                    </p>
                  </div>
                </div>
                {runningNet !== undefined && (
                  <span
                    className={`shrink-0 text-sm tabular-nums font-medium ${
                      runningNet > 0
                        ? "text-emerald-400"
                        : runningNet < 0
                          ? "text-red-400"
                          : "text-[#e8eaed]"
                    }`}
                  >
                    {formatMoney(runningNet)}
                  </span>
                )}
              </div>
              {isOpen && (
                <div className="mt-2 text-xs text-[#9ca3af] space-y-1">
                  <p>Time: {new Date(tx.occurred_at).toLocaleString()}</p>
                  <p>Game: {tx.game ?? "—"}</p>
                  <p>Note: {tx.note ?? "—"}</p>
                </div>
              )}
            </button>
          </motion.li>
        );
      })}
    </ul>
  );
}
