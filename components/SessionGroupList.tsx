"use client";

import { useMemo, useState } from "react";
import type { SessionWithTotals } from "@/lib/types";
import { SessionCard } from "@/components/SessionCard";

interface SessionGroup {
  label: string;
  dateKey: string;
  sessions: SessionWithTotals[];
}

interface SessionGroupListProps {
  groups: SessionGroup[];
}

export function SessionGroupList({ groups }: SessionGroupListProps) {
  const defaultOpen = useMemo(() => (groups[0] ? groups[0].dateKey : null), [groups]);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(
    defaultOpen ? { [defaultOpen]: true } : {}
  );

  if (groups.length === 0) return null;

  return (
    <div className="space-y-3">
      {groups.map((group) => {
        const isOpen = Boolean(openGroups[group.dateKey]);
        return (
          <div key={group.dateKey} className="rounded-xl border border-[#2a2f36] bg-[#1a1d21]">
            <button
              type="button"
              onClick={() =>
                setOpenGroups((prev) => ({
                  ...prev,
                  [group.dateKey]: !prev[group.dateKey],
                }))
              }
              className="w-full flex items-center justify-between px-4 py-3 text-left"
            >
              <div>
                <p className="text-sm font-medium text-white">{group.label}</p>
                <p className="text-xs text-[#9ca3af]">{group.sessions.length} sessions</p>
              </div>
              <span className="text-[#9ca3af] text-sm">{isOpen ? "▾" : "▸"}</span>
            </button>
            {isOpen && (
              <div className="px-3 pb-3 space-y-2">
                {group.sessions.map((session, i) => (
                  <SessionCard key={session.id} session={session} index={i} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
