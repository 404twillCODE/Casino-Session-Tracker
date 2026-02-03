"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { KpiCard } from "@/components/KpiCard";
import { SessionCard } from "@/components/SessionCard";
import type { SessionWithTotals } from "@/lib/types";
import {
  createGuestSession,
  getGuestAllTimeTotals,
  getGuestSessionTotals,
  getGuestSessions,
} from "@/lib/guest-storage";

export default function GuestDashboardPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionWithTotals[]>([]);
  const [totals, setTotals] = useState({
    total_in_cents: 0,
    total_out_cents: 0,
    net_cents: 0,
  });

  useEffect(() => {
    const data = getGuestSessions();
    const withTotals: SessionWithTotals[] = data.map((s) => {
      const totals = getGuestSessionTotals(s.id);
      return {
        ...s,
        user_id: "guest",
        total_in_cents: totals.totalInCents,
        total_out_cents: totals.totalOutCents,
        net_cents: totals.netCents,
      };
    });
    const allTotals = getGuestAllTimeTotals();
    setSessions(withTotals);
    setTotals({
      total_in_cents: allTotals.totalInCents,
      total_out_cents: allTotals.totalOutCents,
      net_cents: allTotals.netCents,
    });
  }, []);

  function handleNewSession() {
    const session = createGuestSession();
    router.push(`/guest/session/${session.id}`);
  }

  return (
    <div className="space-y-8">
      <section className="rounded-xl bg-[#1a1d21] border border-[#2a2f36] p-4">
        <p className="text-sm text-[#9ca3af]">
          Guest mode: data is stored only in this browser and will not sync to other devices.
        </p>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-white">Guest Dashboard</h1>
        <button
          type="button"
          onClick={handleNewSession}
          className="inline-flex items-center gap-2 rounded-lg bg-[#2dd4bf]/90 px-4 py-2.5 text-sm font-medium text-[#0f1114] hover:bg-[#2dd4bf] hover:shadow-[0_0_20px_rgba(45,212,191,0.25)] focus:outline-none focus:ring-2 focus:ring-[#2dd4bf]/50 transition-all duration-200 shadow-[0_0_12px_rgba(45,212,191,0.15)]"
        >
          New Session
        </button>
      </div>

      <section>
        <h2 className="text-sm font-medium uppercase tracking-wider text-[#9ca3af] mb-3">
          All-time totals
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard label="Total In" valueCents={totals.total_in_cents} index={0} />
          <KpiCard label="Total Out" valueCents={totals.total_out_cents} index={1} />
          <KpiCard label="Net" valueCents={totals.net_cents} variant="net" index={2} />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-medium uppercase tracking-wider text-[#9ca3af] mb-3">
          Sessions
        </h2>
        {sessions.length === 0 ? (
          <div className="rounded-xl bg-[#1a1d21] border border-[#2a2f36] p-12 text-center">
            <p className="text-[#9ca3af]">No sessions yet.</p>
            <p className="text-[#6b7280] text-sm mt-1">Create one to start tracking.</p>
            <button
              type="button"
              onClick={handleNewSession}
              className="inline-block mt-4 rounded-lg bg-[#2dd4bf]/90 px-4 py-2 text-sm font-medium text-[#0f1114] hover:bg-[#2dd4bf] hover:shadow-[0_0_16px_rgba(45,212,191,0.2)] transition-all duration-200"
            >
              New Session
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((session, i) => (
              <SessionCard key={session.id} session={session} index={i} basePath="/guest" />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
