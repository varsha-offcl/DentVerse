import { Injectable, InternalServerErrorException } from "@nestjs/common";
import type { SttProvider, SttResult } from "./stt-provider.interface";

const GROQ_TRANSCRIPTIONS_URL = "https://api.groq.com/openai/v1/audio/transcriptions";

// Groq (like OpenAI's Whisper API it mirrors) identifies the audio format
// from the filename's extension in the multipart upload — the blob's
// Content-Type is not enough on its own. A browser MediaRecorder's mimeType
// often carries codec info too (e.g. "audio/webm;codecs=opus"), so match on
// the base type only. Falls back to "webm" (Chrome/Edge's default recording
// format) rather than rejecting an unrecognized-but-possibly-fine type.
const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/opus": "opus",
  "audio/wav": "wav",
  "audio/wave": "wav",
  "audio/x-wav": "wav",
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/mp4": "mp4",
  "audio/x-m4a": "m4a",
  "audio/m4a": "m4a",
  "audio/flac": "flac",
  "audio/x-flac": "flac",
};

function extensionForMimeType(mimeType: string): string {
  const base = mimeType.split(";")[0].trim().toLowerCase();
  return EXTENSION_BY_MIME_TYPE[base] || "webm";
}

/**
 * Groq-hosted Whisper. Picked for the MVP because it's free to test against
 * (no card, 2,000 requests/day) and fast — not because it's the best fit for
 * code-switched English/Hindi/Kannada consultations. See STT_PROVIDER in
 * voice-to-chart.module.ts for how to swap this out later.
 */
@Injectable()
export class GroqSttProvider implements SttProvider {
  private readonly apiKey = process.env.GROQ_API_KEY;
  private readonly model = process.env.GROQ_STT_MODEL || "whisper-large-v3";

  async transcribe(audio: Buffer, mimeType: string): Promise<SttResult> {
    if (!this.apiKey) {
      throw new InternalServerErrorException("GROQ_API_KEY is not configured on the orchestrator.");
    }

    const form = new FormData();
    form.append("model", this.model);
    form.append("response_format", "json");
    // Buffer's ArrayBufferLike (possibly-SharedArrayBuffer) backing isn't
    // directly assignable to BlobPart's ArrayBuffer-only typing — copy into
    // a fresh Uint8Array to satisfy it.
    const filename = `consultation-audio.${extensionForMimeType(mimeType)}`;
    form.append("file", new Blob([new Uint8Array(audio)], { type: mimeType }), filename);

    const res = await fetch(GROQ_TRANSCRIPTIONS_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}` },
      body: form,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new InternalServerErrorException(`Groq transcription failed (${res.status}): ${body}`);
    }

    const data = (await res.json()) as { text?: string };
    return { transcript: (data.text ?? "").trim() };
  }
}
