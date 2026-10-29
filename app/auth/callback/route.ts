import { authClient } from "@/lib/supabase";
import { NextResponse } from "next/server";
export async function GET(request: Request) {
  const url = new URL(request.url);
  const redirectOrigin = new URL(process.env.NEXT_PUBLIC_SITE_URL || request.url).origin;
  const code = url.searchParams.get("code");
  if (code) {
    const client = await authClient();
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL("/admin", redirectOrigin));
  }
  return NextResponse.redirect(
    new URL("/admin?error=link-expired", redirectOrigin),
  );
}
