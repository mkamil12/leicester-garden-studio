import { configured, authClient, edgeFetch } from "@/lib/supabase";
import { defaults } from "@/lib/config";
export const dynamic = "force-dynamic";
const json = (data: unknown, status = 200) =>
  Response.json(data, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
async function handle(request: Request) {
  const url = new URL(request.url);
  url.host = request.headers.get("host") || url.host;
  const path = url.pathname.replace(/^\/api\//, "");
  if (!configured()) {
    if (path === "content")
      return json({ content: defaults, demo: true, configured: false });
    return json(
      {
        error:
          "The booking workspace is awaiting Supabase configuration. For real gardening enquiries, use the official MMA contact page.",
      },
      503,
    );
  }
  if (request.method !== "GET" && request.headers.get("origin") !== url.origin)
    return json({ error: "Submit this form from the website." }, 403);
  if (path === "auth/login" && request.method === "POST") {
    const input: any = await request.json();
    const email = String(input.email || "")
      .trim()
      .toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return json({ error: "Enter a valid email" }, 400);
    const auth = await authClient();
    const { error } = await auth.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: new URL("/auth/callback", url.origin).href,
      },
    });
    if (error) {
      console.error("Sign-in delivery failed:", error.code);
      return json(
        {
          error:
            "Sign-in email could not be sent. Please try again later or contact the studio owner.",
        },
        503,
      );
    }
    return json({
      message:
        "Check your email for a sign-in link. Only authorised team members can enter the workspace. If no link arrives, try again later.",
    });
  }
  const headers = new Headers();
  headers.set("origin", url.origin);
  if (request.headers.get("content-type"))
    headers.set("content-type", request.headers.get("content-type")!);
  let body: Uint8Array | undefined;
  if (!["GET", "HEAD"].includes(request.method)) {
    const chunks: Uint8Array[] = [];
    const reader = request.body?.getReader();
    let length = 0;
    if (reader)
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        length += value.length;
        if (length > 4000000) {
          await reader.cancel();
          return json({ error: "Use up to three smaller photos." }, 413);
        }
        chunks.push(value);
      }
    body = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
      body.set(chunk, offset);
      offset += chunk.length;
    }
  }
  const response = await edgeFetch(path + url.search, {
    method: request.method,
    headers,
    body: body ? new Blob([body as Uint8Array<ArrayBuffer>]) : undefined,
  });
  const responseHeaders = new Headers({
    "Content-Type": response.headers.get("content-type") || "application/json",
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  });
  return new Response(response.body, {
    status: response.status,
    headers: responseHeaders,
  });
}
async function safe(request: Request) {
  try {
    return await handle(request);
  } catch {
    return json(
      { error: "The service is temporarily unavailable. Please try again." },
      503,
    );
  }
}
export const GET = safe;
export const POST = safe;
