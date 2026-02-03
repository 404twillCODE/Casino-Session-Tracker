"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { motion } from "framer-motion";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [envError, setEnvError] = useState<string | null>(null);
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    try {
      setSupabase(createClient());
    } catch (e) {
      setEnvError(e instanceof Error ? e.message : "Missing Supabase env");
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setError(null);
    setSuccessMessage(null);
    setLoading(true);
    if (mode === "signin") {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (err) {
        setError(err.message);
        return;
      }
      router.push("/app");
      router.refresh();
      return;
    }

    const { data, error: err } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    if (data.session) {
      router.push("/app");
      router.refresh();
      return;
    }
    setSuccessMessage("Account created. Check your email to confirm and then sign in.");
  }

  if (envError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-[#0f1114]">
        <div className="rounded-xl bg-[#1a1d21] border border-[#2a2f36] p-8 max-w-md text-center">
          <h1 className="text-lg font-semibold text-white mb-2">SessionStack</h1>
          <p className="text-red-400 font-medium">Supabase env not loaded</p>
          <p className="text-[#9ca3af] text-sm mt-3">{envError}</p>
          <p className="text-[#6b7280] text-xs mt-4">
            Run <code className="text-[#2dd4bf]">npm run dev</code> from the project root (the folder that contains <code className="text-[#e8eaed]">package.json</code> and <code className="text-[#e8eaed]">.env.local</code>), then restart the dev server if it was already running.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            SessionStack
          </h1>
          <p className="text-sm text-[#9ca3af] mt-1">Casino session tracker</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 rounded-xl bg-[#1a1d21] border border-[#2a2f36] shadow-[0_0_20px_rgba(45,212,191,0.06)]"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-[#e8eaed]">
              {mode === "signin" ? "Sign in" : "Create account"}
            </h2>
            <button
              type="button"
              onClick={() => {
                setMode((prev) => (prev === "signin" ? "signup" : "signin"));
                setError(null);
                setSuccessMessage(null);
              }}
              className="text-xs text-[#2dd4bf] hover:underline"
            >
              {mode === "signin" ? "Need an account?" : "Have an account?"}
            </button>
          </div>
          <label className="block text-sm font-medium text-[#9ca3af] mb-1.5">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2.5 rounded-lg bg-[#0f1114] border border-[#2a2f36] text-white placeholder-[#6b7280] focus:outline-none focus:border-[#2dd4bf] focus:ring-1 focus:ring-[#2dd4bf]/30 transition-colors mb-4"
            placeholder="you@example.com"
          />

          <label className="block text-sm font-medium text-[#9ca3af] mb-1.5">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2.5 rounded-lg bg-[#0f1114] border border-[#2a2f36] text-white placeholder-[#6b7280] focus:outline-none focus:border-[#2dd4bf] focus:ring-1 focus:ring-[#2dd4bf]/30 transition-colors mb-6"
            placeholder="••••••••"
          />

          {error && (
            <p className="text-sm text-red-400 mb-4 -mt-2">{error}</p>
          )}
          {successMessage && (
            <p className="text-sm text-emerald-400 mb-4 -mt-2">{successMessage}</p>
          )}

          <motion.button
            type="submit"
            disabled={loading || !supabase}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full py-2.5 rounded-lg bg-[#2dd4bf]/90 text-[#0f1114] font-medium hover:bg-[#2dd4bf] focus:outline-none focus:ring-2 focus:ring-[#2dd4bf]/50 disabled:opacity-60 transition-all shadow-[0_0_12px_rgba(45,212,191,0.2)]"
          >
            {loading ? "Working…" : mode === "signin" ? "Sign in" : "Create account"}
          </motion.button>
        </form>

        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={() => router.push("/guest")}
            className="w-full py-2.5 rounded-lg border border-[#2a2f36] text-[#9ca3af] hover:text-white hover:bg-[#2a2f36] transition-colors"
          >
            Continue as guest
          </button>
          <p className="text-center text-xs text-[#6b7280]">
            Guest data is saved only in this browser and won’t sync to other devices.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
