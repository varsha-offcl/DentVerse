// Structuring step of Treatment Plan dictation — transcript in, a phased
// treatment plan out. The transcript itself comes from the
// voice-to-chart-transcribe Edge Function (transcription has no
// domain-specific logic; only structuring differs per feature).
//
// Ported from orchestrator/src/voice-to-chart/groq-llm.provider.ts
// (structureTreatmentPlan + its prompt/parsing) — same Groq call, same
// validation, no logic changes. `withSupabase({ auth: "user" })` replaces
// StaffAuthGuard, same as the other migrated functions.
import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
const GROQ_LLM_MODEL = Deno.env.get("GROQ_LLM_MODEL") || "llama-3.3-70b-versatile";
const GROQ_CHAT_COMPLETIONS_URL = "https://api.groq.com/openai/v1/chat/completions";

const TREATMENT_PLAN_SYSTEM_PROMPT = `You structure a dentist's spoken treatment plan dictation into a phased plan. Given a raw transcript, respond with ONLY a JSON object (no prose, no markdown fences) matching exactly this shape:

{
  "title": string (a short plan title, e.g. "Dental Implant — Tooth #14"),
  "phases": [
    {
      "name": string (e.g. "Phase 1"),
      "procedure": string (what's done in this phase),
      "cost": number (estimated cost in rupees, mentioned amount — 0 if not mentioned),
      "estDate": string (estimated date in YYYY-MM-DD format if a specific date was mentioned, otherwise empty string)
    }
  ]
}

List every phase mentioned, in the order dictated. Use only what's in the transcript — never invent a phase, cost, or date that wasn't said.`;

interface GroqChatChoice {
  message?: { content?: string };
}

interface StructuredTreatmentPhase {
  name: string;
  procedure: string;
  cost: number;
  estDate: string;
}

interface StructuredTreatmentPlan {
  title: string;
  phases: StructuredTreatmentPhase[];
}

function parseJsonObject(raw: string): Record<string, unknown> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("The structuring model did not return valid JSON.");
  }
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("The structuring model's response was not a JSON object.");
  }
  return parsed as Record<string, unknown>;
}

function parseStructuredTreatmentPlan(raw: string): StructuredTreatmentPlan {
  const v = parseJsonObject(raw);
  if (typeof v.title !== "string") {
    throw new Error('The structuring model\'s response was missing "title".');
  }
  if (!Array.isArray(v.phases)) {
    throw new Error('The structuring model\'s response was missing a "phases" array.');
  }
  const phases = v.phases.map((p, i) => {
    if (typeof p !== "object" || p === null) {
      throw new Error(`Phase entry ${i + 1} in the structuring model's response was invalid.`);
    }
    const entry = p as Record<string, unknown>;
    if (typeof entry.name !== "string" || typeof entry.procedure !== "string" || typeof entry.estDate !== "string") {
      throw new Error(`Phase entry ${i + 1} was missing a required text field.`);
    }
    if (typeof entry.cost !== "number") {
      throw new Error(`Phase entry ${i + 1} was missing a numeric "cost".`);
    }
    return {
      name: entry.name as string,
      procedure: entry.procedure as string,
      cost: entry.cost as number,
      estDate: entry.estDate as string,
    };
  });
  return { title: v.title as string, phases };
}

async function structureTreatmentPlan(transcript: string): Promise<StructuredTreatmentPlan> {
  if (!GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not configured on this function.");
  }

  const res = await fetch(GROQ_CHAT_COMPLETIONS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_LLM_MODEL,
      response_format: { type: "json_object" },
      temperature: 0.2,
      messages: [
        { role: "system", content: TREATMENT_PLAN_SYSTEM_PROMPT },
        { role: "user", content: transcript },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Groq structuring call failed (${res.status}): ${body}`);
  }

  const data = (await res.json()) as { choices?: GroqChatChoice[] };
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Groq returned no structuring content.");
  }
  return parseStructuredTreatmentPlan(content);
}

export default {
  fetch: withSupabase({ auth: "user" }, async (req) => {
    const body = await req.json().catch(() => null);
    const transcript = body?.transcript;
    if (typeof transcript !== "string" || !transcript.trim()) {
      return Response.json({ message: "No transcript was provided." }, { status: 400 });
    }

    try {
      const structured = await structureTreatmentPlan(transcript);
      return Response.json(structured);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Structuring failed.";
      const status = message.startsWith("GROQ_API_KEY") ? 500 : 502;
      return Response.json({ message }, { status });
    }
  }),
};
