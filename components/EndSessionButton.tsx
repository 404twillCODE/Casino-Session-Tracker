"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface EndSessionButtonProps {
  onEnd: () => Promise<void>;
  disabled?: boolean;
}

export function EndSessionButton({ onEnd, disabled }: EndSessionButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      await onEnd();
      toast.success("Session ended.");
    } catch {
      toast.error("Could not end session.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      disabled={disabled || loading}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="px-4 py-2.5 rounded-lg border border-[#2a2f36] text-[#9ca3af] hover:bg-[#2a2f36] hover:text-white transition-colors disabled:opacity-50"
    >
      {loading ? "Ending…" : "End Session"}
    </motion.button>
  );
}
