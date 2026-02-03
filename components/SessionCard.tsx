"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { formatMoney } from "@/lib/format";
import type { SessionWithTotals } from "@/lib/types";

interface SessionCardProps {
  session: SessionWithTotals;
  index?: number;
  basePath?: string;
}

function formatSessionDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function SessionCard({ session, index = 0, basePath = "/app" }: SessionCardProps) {
  const isOpen = !session.ended_at;
  const net = session.net_cents;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.03 }}
    >
      <Link href={`${basePath}/session/${session.id}`}>
        <motion.article
          whileHover={{
            scale: 1.005,
            boxShadow: "0 0 20px rgba(45, 212, 191, 0.08)",
            borderColor: "rgba(45, 212, 191, 0.15)",
          }}
          whileTap={{ scale: 0.998 }}
          className="block rounded-xl bg-[#1a1d21] border border-[#2a2f36] p-4 transition-all duration-200"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white">
                {formatSessionDate(session.started_at)}
              </span>
              {session.casino_name && (
                <span className="text-xs text-[#9ca3af]">· {session.casino_name}</span>
              )}
              {isOpen && (
                <span className="rounded-full bg-[#2dd4bf]/20 text-[#2dd4bf] text-xs px-2 py-0.5 font-medium">
                  Open
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm tabular-nums">
              <span className="text-[#9ca3af]">
                In {formatMoney(session.total_in_cents)}
              </span>
              <span className="text-[#9ca3af]">
                Out {formatMoney(session.total_out_cents)}
              </span>
              <span
                className={
                  net > 0
                    ? "text-emerald-400 font-medium"
                    : net < 0
                      ? "text-red-400 font-medium"
                      : "text-[#e8eaed]"
                }
              >
                Net {formatMoney(net)}
              </span>
            </div>
          </div>
        </motion.article>
      </Link>
    </motion.div>
  );
}
