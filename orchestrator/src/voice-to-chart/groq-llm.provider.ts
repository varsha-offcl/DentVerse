import { Injectable, InternalServerErrorException } from "@nestjs/common";
import type { LlmProvider, StructuredChartNote } from "./llm-provider.interface";

const GROQ_CHAT_COMPLETIONS_URL = "https://api.groq.com/openai/v1/chat/completions";

const SYSTEM_PROMPT = `You structure a dentist's spoken consultation notes into a chart entry. Given a raw transcript, respond with ONLY a JSON object (no prose, no markdown fences) matching exactly this shape:

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

function isFollowUpTrigger(value: unknown): value is StructuredChartNote["followUpTrigger"] {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.triggered === "boolean" &&
    (v.suggestedTiming === null || typeof v.suggestedTiming === "string") &&
    (v.reason === null || typeof v.reason === "string")
  );
}

function parseStructuredNote(raw: string): StructuredChartNote {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new InternalServerErrorException("The structuring model did not return valid JSON.");
  }
  const v = parsed as Record<string, unknown>;
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

  async structureChartNote(transcript: string): Promise<StructuredChartNote> {
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
          { role: "system", content: SYSTEM_PROMPT },
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
    return parseStructuredNote(content);
  }
}
