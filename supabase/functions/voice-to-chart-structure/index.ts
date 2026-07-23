// Structuring step of the Voice-to-Chart pipeline — transcript in,
// structured SOAP chart note out. The transcript itself comes from the
// voice-to-chart-transcribe Edge Function; this is a separate function so
// the UI can show real "transcribing" vs "structuring" progress instead of
// faking two stages around one call (same reasoning the orchestrator's
// split routes used).
//
// Ported from orchestrator/src/voice-to-chart/groq-llm.provider.ts
// (structureChartNote + its prompt/parsing) — same Groq call, same
// validation, no logic changes. `withSupabase({ auth: "user" })` replaces
// StaffAuthGuard, same as voice-to-chart-transcribe.
import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
const GROQ_LLM_MODEL = Deno.env.get("GROQ_LLM_MODEL") || "llama-3.3-70b-versatile";
const GROQ_CHAT_COMPLETIONS_URL = "https://api.groq.com/openai/v1/chat/completions";

const CHART_NOTE_SYSTEM_PROMPT = `You structure a dentist's spoken consultation notes into a chart entry. Given a raw transcript, respond with ONLY a JSON object (no prose, no markdown fences) matching exactly this shape:

{
  "title": string (a short visit title, e.g. "Sensitivity Follow-up Visit"),
  "subjective": string (what the patient reports, in their own words/symptoms),
  "objective": string (what the doctor observed on examination),
  "assessment": string (the doctor's diagnosis/impression),
  "plan": string (treatment/next steps),
  "followUpTrigger": {
    "triggered": boolean (true only if the doctor mentioned a specific follow-up visit, recall, or check),
    "suggestedTiming": string or null (e.g. "2 weeks", "6 months" — null if not triggered),
    "reason": string or null (why the follow-up is needed — null if not triggered)
  }
}

Use only what's in the transcript. If a field has nothing to report, use an empty string (never omit a field or invent details).`;

interface GroqChatChoice {
  message?: { content?: string };
}

interface FollowUpTrigger {
  triggered: boolean;
  suggestedTiming: string | null;
  reason: string | null;
}

interface StructuredChartNote {
  title: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  followUpTrigger: FollowUpTrigger;
}

function isFollowUpTrigger(value: unknown): value is FollowUpTrigger {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.triggered === "boolean" &&
    (v.suggestedTiming === null || typeof v.suggestedTiming === "string") &&
    (v.reason === null || typeof v.reason === "string")
  );
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

function parseStructuredChartNote(raw: string): StructuredChartNote {
  const v = parseJsonObject(raw);
  const requiredStrings = ["title", "subjective", "objective", "assessment", "plan"] as const;
  for (const field of requiredStrings) {
    if (typeof v[field] !== "string") {
      throw new Error(`The structuring model's response was missing "${field}".`);
    }
  }
  if (!isFollowUpTrigger(v.followUpTrigger)) {
    throw new Error('The structuring model\'s response was missing a valid "followUpTrigger".');
  }
  return {
    title: v.title as string,
    subjective: v.subjective as string,
    objective: v.objective as string,
    assessment: v.assessment as string,
    plan: v.plan as string,
    followUpTrigger: v.followUpTrigger as FollowUpTrigger,
  };
}

async function structureChartNote(transcript: string): Promise<StructuredChartNote> {
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
        { role: "system", content: CHART_NOTE_SYSTEM_PROMPT },
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
  return parseStructuredChartNote(content);
}

export default {
  fetch: withSupabase({ auth: "user" }, async (req) => {
    const body = await req.json().catch(() => null);
    const transcript = body?.transcript;
    if (typeof transcript !== "string" || !transcript.trim()) {
      return Response.json({ message: "No transcript was provided." }, { status: 400 });
    }

    try {
      const structured = await structureChartNote(transcript);
      return Response.json(structured);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Structuring failed.";
      const status = message.startsWith("GROQ_API_KEY") ? 500 : 502;
      return Response.json({ message }, { status });
    }
  }),
};
