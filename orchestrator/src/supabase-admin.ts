import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Service-role client — the orchestrator is the trust boundary for
// patient-originated writes (see DentVerseDocs/02-architecture). Used here
// only to verify a caller's bearer token belongs to a real, signed-in staff
// session; Voice-to-Chart itself never writes to the database from the
// orchestrator — the browser saves the reviewed note through the same
// RLS-protected path manual chart notes already use.
//
// Built lazily (on first use) rather than at module-load time: this file
// gets pulled in transitively as soon as anything imports the app module
// graph, which happens before main.ts's dotenv load has necessarily run in
// every context (e.g. tests, scripts). Reading process.env inside the
// getter instead of at the top of the file means it only ever needs
// dotenv to have run before the first *request*, not before this file is
// first imported.
let client: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error(
        "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set. Copy orchestrator/.env.example to orchestrator/.env and fill them in."
      );
    }
    client = createClient(url, key, { auth: { persistSession: false } });
  }
  return client;
}
