"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatMoney, parseMoneyToCents } from "@/lib/format";
import type { TransactionType } from "@/lib/types";

interface MoneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (amountCents: number, note: string | null, game: string | null) => Promise<void>;
  type: TransactionType;
  initialAmountCents?: number | null;
  initialGame?: string | null;
}

export function MoneyModal({
  isOpen,
  onClose,
  onSave,
  type,
  initialAmountCents = null,
  initialGame = null,
}: MoneyModalProps) {
  const [amountInput, setAmountInput] = useState("");
  const [note, setNote] = useState("");
  const [game, setGame] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const label = type === "cash_in" ? "Buy In" : "Cash Out";

  useEffect(() => {
    if (isOpen) {
      if (initialAmountCents && initialAmountCents > 0) {
        setAmountInput(formatMoney(initialAmountCents).replace(/[$,]/g, ""));
      } else {
        setAmountInput("");
      }
      setGame(initialGame ?? "");
      setNote("");
      setError(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, initialAmountCents, initialGame]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const cents = parseMoneyToCents(amountInput);
    if (cents === null || cents <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    setSaving(true);
    try {
      await onSave(cents, note.trim() || null, game.trim() || null);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl bg-[#1a1d21] border border-[#2a2f36] p-6 shadow-[0_0_24px_rgba(0,0,0,0.4)]"
          >
            <h2 className="text-lg font-semibold text-white mb-4">{label}</h2>
            <form onSubmit={handleSubmit}>
              <label className="block text-sm font-medium text-[#9ca3af] mb-1.5">
                Amount
              </label>
              <input
                ref={inputRef}
                type="text"
                inputMode="decimal"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2.5 rounded-lg bg-[#0f1114] border border-[#2a2f36] text-white placeholder-[#6b7280] focus:outline-none focus:border-[#2dd4bf] focus:ring-1 focus:ring-[#2dd4bf]/30 transition-colors mb-4"
              />
              <label className="block text-sm font-medium text-[#9ca3af] mb-1.5">
                Game (optional)
              </label>
              <input
                type="text"
                value={game}
                onChange={(e) => setGame(e.target.value)}
                placeholder="e.g. Blackjack"
                className="w-full px-3 py-2.5 rounded-lg bg-[#0f1114] border border-[#2a2f36] text-white placeholder-[#6b7280] focus:outline-none focus:border-[#2dd4bf] focus:ring-1 focus:ring-[#2dd4bf]/30 transition-colors mb-4"
              />
              <label className="block text-sm font-medium text-[#9ca3af] mb-1.5">
                Note (optional)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. ATM, cage"
                className="w-full px-3 py-2.5 rounded-lg bg-[#0f1114] border border-[#2a2f36] text-white placeholder-[#6b7280] focus:outline-none focus:border-[#2dd4bf] focus:ring-1 focus:ring-[#2dd4bf]/30 transition-colors mb-4"
              />
              {error && (
                <p className="text-sm text-red-400 mb-4">{error}</p>
              )}
              <div className="flex gap-2">
                <motion.button
                  type="button"
                  onClick={onClose}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="flex-1 py-2.5 rounded-lg border border-[#2a2f36] text-[#9ca3af] hover:bg-[#2a2f36] transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  disabled={saving}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="flex-1 py-2.5 rounded-lg bg-[#2dd4bf]/90 text-[#0f1114] font-medium hover:bg-[#2dd4bf] focus:outline-none disabled:opacity-60 transition-all"
                >
                  {saving ? "Saving…" : "Save"}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
