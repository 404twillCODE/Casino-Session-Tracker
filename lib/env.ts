const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function getEnv(value: string | undefined, name: string): string {
  if (value === undefined || value === "") {
    throw new Error(
      `Missing required env: ${name}. Copy .env.example to .env.local and set your Supabase URL and anon key.`
    );
  }
  return value;
}

export function getSupabaseEnv(): { url: string; anonKey: string } {
  return {
    url: getEnv(SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL"),
    anonKey: getEnv(SUPABASE_ANON_KEY, "NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  };
}

export function hasSupabaseEnv(): boolean {
  return Boolean(
    SUPABASE_URL && SUPABASE_URL.trim() !== "" && SUPABASE_ANON_KEY && SUPABASE_ANON_KEY.trim() !== ""
  );
}
