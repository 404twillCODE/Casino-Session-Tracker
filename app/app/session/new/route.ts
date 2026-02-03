import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  const { data: session, error } = await supabase
    .from("sessions")
    .insert({ user_id: user.id })
    .select("id")
    .single();

  if (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const url = request.nextUrl.clone();
  url.pathname = `/app/session/${session.id}`;
  return NextResponse.redirect(url);
}
