import { supabase } from "@/lib/supabase";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

async function withAuthHeader(init: RequestInit): Promise<RequestInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    throw new Error("Your session has expired — please sign in again.");
  }
  return { ...init, headers: { ...(init.headers ?? {}), Authorization: `Bearer ${token}` } };
}

/**
 * Calls a Supabase Edge Function, forwarding the current staff member's
 * Supabase session as a bearer token — the function's
 * `withSupabase({ auth: "user" })` guard verifies it, the same way the old
 * NestJS orchestrator's StaffAuthGuard did before all AI endpoints were
 * migrated here (see supabase/functions/<name>).
 */
export async function callEdgeFunction<T>(name: string, init: RequestInit = {}): Promise<T> {
  if (!SUPABASE_URL) {
    throw new Error("Supabase is not configured — set VITE_SUPABASE_URL.");
  }

  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, await withAuthHeader(init));

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message || `Request to ${name} failed (${res.status}).`);
  }

  return res.json() as Promise<T>;
}
