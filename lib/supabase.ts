import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
export function configured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
export async function authClient() {
  const jar = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return jar.getAll();
        },
        setAll(values) {
          try {
            values.forEach(({ name, value, options }) =>
              jar.set(name, value, options),
            );
          } catch {
            /* Proxy refreshes server-component cookies. */
          }
        },
      },
    },
  );
}
export async function identity() {
  if (!configured()) return null;
  const client = await authClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user?.email) return null;
  return { id: user.id, email: user.email.toLowerCase() };
}
export async function accessToken() {
  if (!(await identity())) return null;
  const client = await authClient();
  return (await client.auth.getSession()).data.session?.access_token || null;
}
export async function edgeFetch(path: string, init: RequestInit = {}) {
  const token = await accessToken();
  const headers = new Headers(init.headers);
  headers.set("apikey", process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
  if (token) headers.set("Authorization", "Bearer " + token);
  return fetch(
    process.env.NEXT_PUBLIC_SUPABASE_URL + "/functions/v1/garden-api/" + path,
    { ...init, headers, cache: "no-store" },
  );
}
export async function access() {
  if (!configured()) return null;
  const response = await edgeFetch("access");
  if (!response.ok) return null;
  return (await response.json()).user;
}
