import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  if (!hasSupabaseEnv()) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-[#0f1114]">
        <div className="rounded-xl bg-[#1a1d21] border border-[#2a2f36] p-8 max-w-md text-center">
          <h1 className="text-lg font-semibold text-white mb-2">SessionStack</h1>
          <p className="text-red-400 font-medium">Supabase env not loaded</p>
          <p className="text-[#9ca3af] text-sm mt-3">
            Ensure <code className="text-[#e8eaed]">.env.local</code> exists in the <strong>project root</strong> (same folder as <code className="text-[#e8eaed]">package.json</code>) with <code className="text-[#e8eaed]">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="text-[#e8eaed]">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.
          </p>
          <p className="text-[#6b7280] text-xs mt-4">
            Then run <code className="text-[#2dd4bf]">npm run dev</code> from the project root (not from a subfolder) and restart if the server was already running.
          </p>
        </div>
      </div>
    );
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/app");
  redirect("/login");
}
