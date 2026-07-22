import { Injectable, InternalServerErrorException } from "@nestjs/common";
import type {
  LlmProvider,
  StructuredChartNote,
  StructuredPrescription,
  StructuredTreatmentPlan,
} from "./llm-provider.interface";

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

function isFollowUpTrigger(value: unknown): value is StructuredChartNote["followUpTrigger"] {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.triggered === "boolean" &&
    (v.suggestedTiming === null || typeof v.suggestedTiming === "string") &&
    (v.reason === null || typeof v.reason === "string")
  );
}

function parseStructuredChartNote(raw: string): StructuredChartNote {
  const v = parseJsonObject(raw);
  const requiredStrings = ["title", "subjective", "objective", "assessment", "plan"] as const;
  for (const field of requiredStrings) {
    if (typeof v[field] !== "string") {
      throw new InternalServerErrorException(`The structuring model's response was missing "${field}".`);
    }
  }
  if (!isFollowUpTrigger(v.followUpTrigger)) {
    throw new InternalServerErrorException('The structuring model\'s response was missing a valid "followUpTrigger".');
  }
  return {
    title: v.title as string,
    subjective: v.subjective as string,
    objective: v.objective as string,
    assessment: v.assessment as string,
    plan: v.plan as string,
    followUpTrigger: v.followUpTrigger as StructuredChartNote["followUpTrigger"],
  };
}

function parseStructuredPrescription(raw: string): StructuredPrescription {
  const v = parseJsonObject(raw);
  if (!Array.isArray(v.medicines)) {
    throw new InternalServerErrorException('The structuring model\'s response was missing a "medicines" array.');
  }
  const medicineFields = ["name", "dosage", "frequency", "duration", "instructions"] as const;
  const medicines = v.medicines.map((m, i) => {
    if (typeof m !== "object" || m === null) {
      throw new InternalServerErrorException(`Medicine entry ${i + 1} in the structuring model's response was invalid.`);
    }
    const entry = m as Record<string, unknown>;
    for (const field of medicineFields) {
      if (typeof entry[field] !== "string") {
        throw new InternalServerErrorException(`Medicine entry ${i + 1} was missing "${field}".`);
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
    throw new InternalServerErrorException('The structuring model\'s response was missing "notes".');
  }
  return { medicines, notes: v.notes as string };
}

function parseStructuredTreatmentPlan(raw: string): StructuredTreatmentPlan {
  const v = parseJsonObject(raw);
  if (typeof v.title !== "string") {
    throw new InternalServerErrorException('The structuring model\'s response was missing "title".');
  }
  if (!Array.isArray(v.phases)) {
    throw new InternalServerErrorException('The structuring model\'s response was missing a "phases" array.');
  }
  const phases = v.phases.map((p, i) => {
    if (typeof p !== "object" || p === null) {
      throw new InternalServerErrorException(`Phase entry ${i + 1} in the structuring model's response was invalid.`);
    }
    const entry = p as Record<string, unknown>;
    if (typeof entry.name !== "string" || typeof entry.procedure !== "string" || typeof entry.estDate !== "string") {
      throw new InternalServerErrorException(`Phase entry ${i + 1} was missing a required text field.`);
    }
    if (typeof entry.cost !== "number") {
      throw new InternalServerErrorException(`Phase entry ${i + 1} was missing a numeric "cost".`);
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

function parseJsonObject(raw: string): Record<string, unknown> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new InternalServerErrorException("The structuring model did not return valid JSON.");
  }
  if (typeof parsed !== "object" || parsed === null) {
    throw new InternalServerErrorException("The structuring model's response was not a JSON object.");
  }
  return parsed as Record<string, unknown>;
}

/**
 * Groq-hosted open-weight LLM (Llama by default). Picked for the MVP for
 * cost — not because it's the most reliable at structured output, which is
 * why every field is validated below rather than trusted blindly. See
 * LLM_PROVIDER in voice-to-chart.module.ts for how to swap this out later.
 */
@Injectable()
export class GroqLlmProvider implements LlmProvider {
  private readonly apiKey = process.env.GROQ_API_KEY;
  private readonly model = process.env.GROQ_LLM_MODEL || "llama-3.3-70b-versatile";

  private async callGroq(systemPrompt: string, transcript: string): Promise<string> {
    if (!this.apiKey) {
      throw new InternalServerErrorException("GROQ_API_KEY is not configured on the orchestrator.");
    }

    const res = await fetch(GROQ_CHAT_COMPLETIONS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        response_format: { type: "json_object" },
        temperature: 0.2,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: transcript },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new InternalServerErrorException(`Groq structuring call failed (${res.status}): ${body}`);
    }

    const data = (await res.json()) as { choices?: GroqChatChoice[] };
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new InternalServerErrorException("Groq returned no structuring content.");
    }
    return content;
  }

  async structureChartNote(transcript: string): Promise<StructuredChartNote> {
    return parseStructuredChartNote(await this.callGroq(CHART_NOTE_SYSTEM_PROMPT, transcript));
  }

  async structurePrescription(transcript: string): Promise<StructuredPrescription> {
    return parseStructuredPrescription(await this.callGroq(PRESCRIPTION_SYSTEM_PROMPT, transcript));
  }

  async structureTreatmentPlan(transcript: string): Promise<StructuredTreatmentPlan> {
    return parseStructuredTreatmentPlan(await this.callGroq(TREATMENT_PLAN_SYSTEM_PROMPT, transcript));
  }
}
