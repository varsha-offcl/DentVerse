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

/**
 * Structuring LLM backend for Voice-to-Chart: turns a raw transcript into
 * the chart note's SOAP fields. Swapping providers (e.g. to Claude for more
 * reliable structured output) means adding a class that implements this
 * interface and pointing LLM_PROVIDER at it in voice-to-chart.module.ts —
 * the controller and frontend never change.
 */
export interface LlmProvider {
  structureChartNote(transcript: string): Promise<StructuredChartNote>;
}

export const LLM_PROVIDER = Symbol("LLM_PROVIDER");
