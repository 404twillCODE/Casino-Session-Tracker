"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-10 border-b border-[#2a2f36] bg-[#1a1d21]/95 backdrop-blur supports-[backdrop-filter]:bg-[#1a1d21]/80">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <Link
            href="/app"
            className="text-lg font-semibold tracking-tight text-white hover:text-[#2dd4bf] transition-colors"
          >
            SessionStack
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/app/profile"
              className="text-sm text-[#9ca3af] hover:text-white px-2 py-1.5 rounded-lg hover:bg-[#2a2f36] transition-colors"
            >
              Profile
            </Link>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSignOut}
              className="text-sm text-[#9ca3af] hover:text-white px-2 py-1.5 rounded-lg hover:bg-[#2a2f36] transition-colors"
            >
              Sign out
            </motion.button>
          </div>
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-6">{children}</main>
    </div>
  );
}
