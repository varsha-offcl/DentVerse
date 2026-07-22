export interface FollowUpTrigger {
  triggered: boolean;
  suggestedTiming: string | null;
  reason: string | null;
}

export interface StructuredChartNote {
  title: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  followUpTrigger: FollowUpTrigger;
}

export interface StructuredMedicine {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export interface StructuredPrescription {
  medicines: StructuredMedicine[];
  notes: string;
}

export interface StructuredTreatmentPhase {
  name: string;
  procedure: string;
  cost: number;
  estDate: string;
}

export interface StructuredTreatmentPlan {
  title: string;
  phases: StructuredTreatmentPhase[];
}

/**
 * Structuring LLM backend — one Groq call per domain, each with its own
 * prompt/output shape, but all sharing the same transcribe step
 * (POST /internal/voice-to-chart/transcribe) and the same provider swap
 * point. Swapping providers (e.g. to Claude for more reliable structured
 * output) means adding a class that implements this interface and pointing
 * LLM_PROVIDER at it in voice-to-chart.module.ts — no controller or
 * frontend changes.
 */
export interface LlmProvider {
  structureChartNote(transcript: string): Promise<StructuredChartNote>;
  structurePrescription(transcript: string): Promise<StructuredPrescription>;
  structureTreatmentPlan(transcript: string): Promise<StructuredTreatmentPlan>;
}

export const LLM_PROVIDER = Symbol("LLM_PROVIDER");
