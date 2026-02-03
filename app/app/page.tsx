import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionsWithTotals, getAllTimeTotals } from "@/lib/data";
import { hasSupabaseEnv } from "@/lib/env";
import { KpiCard } from "@/components/KpiCard";
import { SessionGroupList } from "@/components/SessionGroupList";

export default async function AppDashboardPage() {
  if (!hasSupabaseEnv()) {
    return (
      <div className="rounded-xl bg-[#1a1d21] border border-[#2a2f36] p-8 text-center">
        <p className="text-red-400 font-medium">Missing Supabase env</p>
        <p className="text-[#9ca3af] text-sm mt-2">
          Copy .env.example to .env.local and set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
        </p>
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [sessions, totals] = await Promise.all([
    getSessionsWithTotals(),
    getAllTimeTotals(),
  ]);

  const isDev = process.env.NODE_ENV === "development";
  const grouped = sessions.reduce<Record<string, { label: string; dateKey: string; sessions: typeof sessions }>>(
    (acc, session) => {
      const date = new Date(session.started_at);
      const dateKey = date.toISOString().slice(0, 10);
      const label = date.toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
      if (!acc[dateKey]) {
        acc[dateKey] = { label, dateKey, sessions: [] };
      }
      acc[dateKey].sessions.push(session);
      return acc;
    },
    {}
  );
  const groups = Object.values(grouped).sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1));

  return (
    <div className="space-y-8">
      {isDev && (
        <section className="rounded-xl bg-[#1a1d21] border border-[#2a2f36] p-4">
          <h2 className="text-xs font-medium uppercase tracking-wider text-[#9ca3af] mb-2">
            Diagnostics (dev only)
          </h2>
          <ul className="text-sm text-[#e8eaed] space-y-1 font-mono">
            <li>Env set: {hasSupabaseEnv() ? "yes" : "no"}</li>
            <li>User id: {user?.id ?? "—"}</li>
            <li>Sessions: {sessions.length}</li>
          </ul>
        </section>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-white">Dashboard</h1>
        <Link
          href="/app/session/new"
          className="inline-flex items-center gap-2 rounded-lg bg-[#2dd4bf]/90 px-4 py-2.5 text-sm font-medium text-[#0f1114] hover:bg-[#2dd4bf] hover:shadow-[0_0_20px_rgba(45,212,191,0.25)] focus:outline-none focus:ring-2 focus:ring-[#2dd4bf]/50 transition-all duration-200 shadow-[0_0_12px_rgba(45,212,191,0.15)]"
        >
          New Session
        </Link>
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
            <Link
              href="/app/session/new"
              className="inline-block mt-4 rounded-lg bg-[#2dd4bf]/90 px-4 py-2 text-sm font-medium text-[#0f1114] hover:bg-[#2dd4bf] hover:shadow-[0_0_16px_rgba(45,212,191,0.2)] transition-all duration-200"
            >
              New Session
            </Link>
          </div>
        ) : (
          <SessionGroupList groups={groups} />
        )}
      </section>
    </div>
  );
}
