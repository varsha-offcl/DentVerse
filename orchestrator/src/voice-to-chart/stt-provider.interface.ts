export interface SttResult {
  transcript: string;
}

/**
 * Speech-to-text backend for Voice-to-Chart. Swapping providers (e.g. to
 * Sarvam AI for Indian-accented, code-switched consultations) means adding a
 * class that implements this interface and pointing STT_PROVIDER at it in
 * voice-to-chart.module.ts — the controller and frontend never change.
 */
export interface SttProvider {
  transcribe(audio: Buffer, mimeType: string): Promise<SttResult>;
}

export const STT_PROVIDER = Symbol("STT_PROVIDER");
