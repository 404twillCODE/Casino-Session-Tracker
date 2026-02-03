"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { parseMoneyToCents, formatMoney } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";

interface ProfileActionsProps {
  initialGlobalBudgetCents: number | null;
  totalLossCents: number;
}

export function ProfileActions({
  initialGlobalBudgetCents,
  totalLossCents,
}: ProfileActionsProps) {
  const router = useRouter();
  const supabase = createClient();
  const [budgetInput, setBudgetInput] = useState(
    initialGlobalBudgetCents ? (initialGlobalBudgetCents / 100).toFixed(2) : ""
  );
  const [saving, setSaving] = useState(false);

  const remaining =
    initialGlobalBudgetCents !== null
      ? Math.max(0, initialGlobalBudgetCents - totalLossCents)
      : null;

  async function handleSaveBudget() {
    if (budgetInput.trim() === "") {
      setSaving(true);
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) {
        setSaving(false);
        toast.error("Not signed in.");
        return;
      }
      const { error } = await supabase
        .from("user_settings")
        .delete()
        .eq("user_id", userId);
      setSaving(false);
      if (error) toast.error("Could not clear budget.");
      else {
        toast.success("Global budget cleared.");
        router.refresh();
      }
      return;
    }
    const cents = parseMoneyToCents(budgetInput);
    if (!cents || cents <= 0) {
      toast.error("Enter a valid budget.");
      return;
    }
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) {
      setSaving(false);
      toast.error("Not signed in.");
      return;
    }
    const { error } = await supabase
      .from("user_settings")
      .upsert({ user_id: userId, global_budget_cents: cents, updated_at: new Date().toISOString() });
    setSaving(false);
    if (error) toast.error("Could not save budget.");
    else {
      toast.success("Global budget saved.");
      router.refresh();
    }
  }

  async function handleReset() {
    const confirmed = window.confirm(
      "This will delete all sessions and transactions from your account. Continue?"
    );
    if (!confirmed) return;
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) {
      toast.error("Not signed in.");
      return;
    }
    const { error } = await supabase.from("sessions").delete().eq("user_id", userId);
    if (error) {
      toast.error("Could not reset account.");
      return;
    }
    await supabase.from("user_settings").delete().eq("user_id", userId);
    toast.success("Account reset.");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-[#1a1d21] border border-[#2a2f36] p-4">
        <h3 className="text-xs font-medium uppercase tracking-wider text-[#9ca3af] mb-2">
          Global budget
        </h3>
        <input
          type="text"
          inputMode="decimal"
          value={budgetInput}
          onChange={(e) => setBudgetInput(e.target.value)}
          onBlur={handleSaveBudget}
          placeholder="e.g. 500"
          className="w-full rounded-lg bg-[#0f1114] border border-[#2a2f36] px-3 py-2 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-[#2dd4bf]/60 focus:ring-1 focus:ring-[#2dd4bf]/40 transition-colors"
        />
        <div className="mt-2 text-xs text-[#6b7280]">
          Remaining:{" "}
          <span className="text-white">
            {remaining !== null ? formatMoney(remaining) : "—"}
          </span>
        </div>
        <p className="text-xs text-[#6b7280] mt-1">
          Saved on blur. Based on total loss (Total In - Total Out).
        </p>
      </div>

      <div className="rounded-xl bg-[#1a1d21] border border-[#2a2f36] p-4">
        <h3 className="text-xs font-medium uppercase tracking-wider text-[#9ca3af] mb-2">
          Reset account
        </h3>
        <p className="text-xs text-[#6b7280] mb-3">
          Deletes all sessions and transactions from Supabase.
        </p>
        <button
          type="button"
          onClick={handleReset}
          className="px-3 py-2 rounded-lg border border-red-400/30 text-red-300 text-sm hover:bg-red-500/10 transition-colors"
        >
          Reset account
        </button>
        {saving && <p className="text-xs text-[#6b7280] mt-2">Saving…</p>}
      </div>
    </div>
  );
}
