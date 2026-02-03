"use client";

import { motion } from "framer-motion";
import { formatMoney } from "@/lib/format";

interface KpiCardProps {
  label: string;
  valueCents: number;
  variant?: "default" | "net";
  index?: number;
}

export function KpiCard({ label, valueCents, variant = "default", index = 0 }: KpiCardProps) {
  const isNet = variant === "net";
  const isPositive = valueCents > 0;
  const isNegative = valueCents < 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
      whileHover={{
        boxShadow: "0 0 24px rgba(45, 212, 191, 0.12)",
        borderColor: "rgba(45, 212, 191, 0.2)",
      }}
      className="rounded-xl bg-[#1a1d21] border border-[#2a2f36] p-4 transition-all duration-200"
    >
      <p className="text-xs font-medium uppercase tracking-wider text-[#9ca3af] mb-1">
        {label}
      </p>
      <p
        className={`text-xl font-semibold tabular-nums ${
          isNet
            ? isPositive
              ? "text-emerald-400"
              : isNegative
                ? "text-red-400"
                : "text-[#e8eaed]"
            : "text-white"
        }`}
      >
        {formatMoney(valueCents)}
      </p>
    </motion.div>
  );
}
