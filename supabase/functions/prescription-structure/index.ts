// Structuring step of Prescription dictation — transcript in, medicine
// rows out. The transcript itself comes from the voice-to-chart-transcribe
// Edge Function (transcription has no domain-specific logic; only
// structuring differs per feature).
//
// Ported from orchestrator/src/voice-to-chart/groq-llm.provider.ts
// (structurePrescription + its prompt/parsing) — same Groq call, same
// validation, no logic changes. `withSupabase({ auth: "user" })` replaces
// StaffAuthGuard, same as the other migrated functions.
import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
const GROQ_LLM_MODEL = Deno.env.get("GROQ_LLM_MODEL") || "llama-3.3-70b-versatile";
const GROQ_CHAT_COMPLETIONS_URL = "https://api.groq.com/openai/v1/chat/completions";

const PRESCRIPTION_SYSTEM_PROMPT = `You structure a dentist's spoken prescription dictation into medicine entries. Given a raw transcript, respond with ONLY a JSON object (no prose, no markdown fences) matching exactly this shape:

{
  "medicines": [
    {
      "name": string (drug name + strength, e.g. "Amoxicillin 500mg"),
      "dosage": string (e.g. "1 capsule"),
      "frequency": string (e.g. "Every 8 hours"),
      "duration": string (e.g. "5 days"),
      "instructions": string (special instructions, e.g. "Take after food" — empty string if none mentioned)
    }
  ],
  "notes": string (any general notes for the patient not specific to one medicine — empty string if none)
}

List every medicine mentioned, in the order dictated. Use only what's in the transcript — never invent a medicine, dosage, or instruction that wasn't said. If a field wasn't mentioned for a medicine, use an empty string.`;

interface GroqChatChoice {
  message?: { content?: string };
}

interface StructuredMedicine {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface StructuredPrescription {
  medicines: StructuredMedicine[];
  notes: string;
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

function parseStructuredPrescription(raw: string): StructuredPrescription {
  const v = parseJsonObject(raw);
  if (!Array.isArray(v.medicines)) {
    throw new Error('The structuring model\'s response was missing a "medicines" array.');
  }
  const medicineFields = ["name", "dosage", "frequency", "duration", "instructions"] as const;
  const medicines = v.medicines.map((m, i) => {
    if (typeof m !== "object" || m === null) {
      throw new Error(`Medicine entry ${i + 1} in the structuring model's response was invalid.`);
    }
    const entry = m as Record<string, unknown>;
    for (const field of medicineFields) {
      if (typeof entry[field] !== "string") {
        throw new Error(`Medicine entry ${i + 1} was missing "${field}".`);
      }
    }
    return {
      name: entry.name as string,
      dosage: entry.dosage as string,
      frequency: entry.frequency as string,
      duration: entry.duration as string,
      instructions: entry.instructions as string,
    };
  });
  if (typeof v.notes !== "string") {
    throw new Error('The structuring model\'s response was missing "notes".');
  }
  return { medicines, notes: v.notes as string };
}

async function structurePrescription(transcript: string): Promise<StructuredPrescription> {
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
        { role: "system", content: PRESCRIPTION_SYSTEM_PROMPT },
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
  return parseStructuredPrescription(content);
}

export default {
  fetch: withSupabase({ auth: "user" }, async (req) => {
    const body = await req.json().catch(() => null);
    const transcript = body?.transcript;
    if (typeof transcript !== "string" || !transcript.trim()) {
      return Response.json({ message: "No transcript was provided." }, { status: 400 });
    }

    try {
      const structured = await structurePrescription(transcript);
      return Response.json(structured);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Structuring failed.";
      const status = message.startsWith("GROQ_API_KEY") ? 500 : 502;
      return Response.json({ message }, { status });
    }
  }),
};
