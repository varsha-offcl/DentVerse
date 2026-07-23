// Speech-to-text step of the AI-structuring pipeline — shared by
// Voice-to-Chart, Patient/Doctor Notes, Prescription dictation, and
// Treatment Plan dictation (all four send recorded audio here; only the
// *structuring* step downstream differs per feature, and those endpoints
// still live on the NestJS orchestrator until they're migrated too).
//
// Ported from orchestrator/src/voice-to-chart/groq-stt.provider.ts —
// same Groq call, same extension-detection fix (Groq identifies audio
// format from the filename, not the declared Content-Type), no logic
// changes. `withSupabase({ auth: "user" })` replaces StaffAuthGuard: it
// verifies the forwarded bearer token is a real, current Supabase session
// before the handler runs, same as the guard did.
import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
const GROQ_STT_MODEL = Deno.env.get("GROQ_STT_MODEL") || "whisper-large-v3";
const GROQ_TRANSCRIPTIONS_URL = "https://api.groq.com/openai/v1/audio/transcriptions";

// Groq (like the Whisper API it mirrors) identifies the audio format from
// the filename's extension in the multipart upload — the blob's
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

export default {
  fetch: withSupabase({ auth: "user" }, async (req) => {
    if (!GROQ_API_KEY) {
      return Response.json({ message: "GROQ_API_KEY is not configured on this function." }, { status: 500 });
    }

    let incoming: FormData;
    try {
      incoming = await req.formData();
    } catch {
      return Response.json({ message: "Expected multipart/form-data with an 'audio' file." }, { status: 400 });
    }

    const audio = incoming.get("audio");
    if (!(audio instanceof File)) {
      return Response.json({ message: "No audio file was uploaded." }, { status: 400 });
    }

    const buffer = await audio.arrayBuffer();
    const filename = `consultation-audio.${extensionForMimeType(audio.type)}`;

    const groqForm = new FormData();
    groqForm.append("model", GROQ_STT_MODEL);
    groqForm.append("response_format", "json");
    groqForm.append("file", new Blob([buffer], { type: audio.type }), filename);

    const res = await fetch(GROQ_TRANSCRIPTIONS_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
      body: groqForm,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return Response.json({ message: `Groq transcription failed (${res.status}): ${body}` }, { status: 502 });
    }

    const data = (await res.json()) as { text?: string };
    return Response.json({ transcript: (data.text ?? "").trim() });
  }),
};
