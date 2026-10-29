import { defaults } from "./config";
import { configured, edgeFetch } from "./supabase";
export async function publicContent() {
  if (!configured()) return { ...defaults };
  try {
    const response = await edgeFetch("content");
    if (!response.ok) return { ...defaults };
    return (await response.json()).content;
  } catch {
    return { ...defaults };
  }
}
