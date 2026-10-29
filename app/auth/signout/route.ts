import { authClient } from "@/lib/supabase";
import { NextResponse } from "next/server";
export async function GET(request: Request) {
  const client = await authClient();
  await client.auth.signOut();
  return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_SITE_URL || request.url));
}
