import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAllTimeTotals } from "@/lib/data";
import { KpiCard } from "@/components/KpiCard";
import { ProfileActions } from "@/components/ProfileActions";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [totals, txResponse, settingsResponse] = await Promise.all([
    getAllTimeTotals(),
    supabase.from("transactions").select("type, amount_cents, occurred_at"),
    supabase
      .from("user_settings")
      .select("global_budget_cents")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (txResponse.error) throw txResponse.error;

  const transactions = txResponse.data ?? [];
  const dailyMap = new Map<
    string,
    { label: string; totalIn: number; totalOut: number; net: number }
  >();
  for (const tx of transactions) {
    const date = new Date(tx.occurred_at);
    const key = date.toISOString().slice(0, 10);
    const label = date.toLocaleDateString(undefined, {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    const entry = dailyMap.get(key) ?? { label, totalIn: 0, totalOut: 0, net: 0 };
    if (tx.type === "cash_in") entry.totalIn += tx.amount_cents;
    else entry.totalOut += tx.amount_cents;
    entry.net = entry.totalOut - entry.totalIn;
    dailyMap.set(key, entry);
  }

  const dailyTotals = Array.from(dailyMap.entries())
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([, value]) => value);

  const totalLoss = Math.max(0, totals.total_in_cents - totals.total_out_cents);
  const globalBudget = settingsResponse.data?.global_budget_cents ?? null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-white">Profile</h1>
        <p className="text-sm text-[#9ca3af] mt-1">Account summary and budgets</p>
      </div>

      <section>
        <h2 className="text-sm font-medium uppercase tracking-wider text-[#9ca3af] mb-3">
          All-time totals
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard label="Total In" valueCents={totals.total_in_cents} />
          <KpiCard label="Total Out" valueCents={totals.total_out_cents} />
          <KpiCard label="Net" valueCents={totals.net_cents} variant="net" />
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-sm font-medium uppercase tracking-wider text-[#9ca3af] mb-3">
            Daily totals
          </h2>
          {dailyTotals.length === 0 ? (
            <div className="rounded-xl bg-[#1a1d21] border border-[#2a2f36] p-6 text-center text-sm text-[#9ca3af]">
              No transactions yet.
            </div>
          ) : (
            <div className="space-y-2">
              {dailyTotals.map((d) => (
                <div
                  key={d.label}
                  className="rounded-xl bg-[#1a1d21] border border-[#2a2f36] p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-white">{d.label}</p>
                    <p
                      className={`text-sm font-medium ${
                        d.net > 0 ? "text-emerald-400" : d.net < 0 ? "text-red-400" : "text-white"
                      }`}
                    >
                      {d.net > 0 ? "+" : ""}
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                      }).format(d.net / 100)}
                    </p>
                  </div>
                  <div className="mt-2 text-xs text-[#9ca3af] flex flex-wrap gap-3">
                    <span>Total In: {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(d.totalIn / 100)}</span>
                    <span>Total Out: {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(d.totalOut / 100)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <ProfileActions
          initialGlobalBudgetCents={globalBudget}
          totalLossCents={totalLoss}
        />
      </section>
    </div>
  );
}
