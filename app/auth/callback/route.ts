import { createClient } from "@/lib/supabaseServer";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Use explicit site URL on Vercel so we never redirect to localhost after OAuth
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    requestUrl.origin;

  return NextResponse.redirect(new URL("/dashboard", baseUrl));
}
