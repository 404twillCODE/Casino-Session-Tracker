# SessionStack

Casino session tracker: log Cash In / Cash Out over time, see per-session and all-time totals.

## Tech

- Next.js 14 (App Router), TypeScript, TailwindCSS
- Supabase (Auth + Postgres + RLS)
- Framer Motion, Sonner (toasts)
- Deploy-ready for Vercel

## Environment variables

Copy `.env.example` to `.env.local` and fill in your Supabase values. The app will throw a clear error at runtime if either variable is missing.

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Get these from Supabase: **Project Settings → API**.

---

## Supabase setup checklist

Do these in order:

1. **Create a project**  
   Go to [supabase.com](https://supabase.com) → New project. Note the project URL and anon key (Settings → API).

2. **Copy env vars**  
   Copy `.env.example` to `.env.local`. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to your project values.

3. **Run schema**  
   In Supabase → SQL Editor, paste and run the full contents of `supabase/schema.sql`.  
   This creates:
   - `sessions` (user_id → auth.users(id), started_at, ended_at, casino_name, notes)
   - `transactions` (session_id → sessions(id) ON DELETE CASCADE, user_id → auth.users(id), type, amount_cents, occurred_at, note)
   - Indexes on (user_id, started_at desc), (session_id, occurred_at desc), (user_id, occurred_at desc)

4. **Run RLS**  
   In SQL Editor, paste and run the full contents of `supabase/rls.sql`.  
   This enables RLS on both tables and adds policies so each user can only select/insert/update/delete their own rows (`user_id = auth.uid()`).

5. **Enable Email auth**  
   Authentication → Providers → Email: enable “Email”. Optionally enable “Confirm email” and/or add a custom redirect URL.

6. **Redirect URLs**  
   Authentication → URL Configuration:
   - **Site URL**: production URL (e.g. `https://your-app.vercel.app`) or for local dev `http://localhost:3000`
   - **Redirect URLs**: add `http://localhost:3000/**` for local dev and your production URL (e.g. `https://your-app.vercel.app/**`)

7. **Create a user (for login)**  
   Authentication → Users → Add user (email + password), or use sign-up if you enabled it.

---

## Run locally

**Run all commands from the project root** (the folder that contains `package.json` and `.env.local`). If you run from a subfolder, Next.js won’t load `.env.local` and you’ll see “Supabase env not loaded”.

```bash
cp .env.example .env.local
# Edit .env.local and set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.

npm install
npm run dev
```

If you change `.env.local` or add it after the dev server is already running, **restart the dev server** (Ctrl+C then `npm run dev` again).

Open [http://localhost:3000](http://localhost:3000). You’ll be redirected to `/login`; sign in with a Supabase user, then you’re taken to `/app`.  
In development, the dashboard shows a small **Diagnostics** panel (env set, user id, session count) to confirm Supabase wiring.

For `npm run build` you need the same env vars in `.env.local` (or set them in CI).

## Guest mode

On the login page, you can **Continue as guest**. Guest mode stores all data **locally in your browser only**:
- No sync across devices
- Clearing browser data removes guest sessions
- Guest data is not written to Supabase

## Deploy (Vercel)

1. Push the repo to GitHub and import the project in Vercel.
2. Add env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. In Supabase URL Configuration, add your Vercel URL to Redirect URLs.
4. Deploy.

## Project structure

- `app/` – Routes: `/` (redirect), `/login`, `/app` (dashboard), `/app/session/[id]`, `/app/session/new` (creates session, redirects to its id).
- `components/` – AppShell, KpiCard, SessionCard, MoneyModal, TransactionList, EndSessionButton.
- `lib/` – Supabase client/server/middleware, env validation, types, format (money), data helpers.
- `supabase/` – `schema.sql`, `rls.sql`, `seed.sql` (optional commented examples for debugging).

Amounts are stored in cents (integer); the UI uses a single USD formatter and accepts dollar input (e.g. `20`, `20.5`, `$20.50`).
