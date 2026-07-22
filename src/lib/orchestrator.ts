import { supabase } from "@/lib/supabase";

const ORCHESTRATOR_URL = import.meta.env.VITE_ORCHESTRATOR_URL || "http://localhost:3001";

/**
 * Calls the NestJS orchestrator with the current staff member's Supabase
 * session forwarded as a bearer token (see orchestrator/src/auth). Throws
 * with the server's error message on any non-2xx response.
 */
export async function callOrchestrator<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    throw new Error("Your session has expired — please sign in again.");
  }

  const res = await fetch(`${ORCHESTRATOR_URL}${path}`, {
    ...init,
    headers: { ...(init.headers ?? {}), Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message || `Request to the orchestrator failed (${res.status}).`);
  }

  return res.json() as Promise<T>;
}
