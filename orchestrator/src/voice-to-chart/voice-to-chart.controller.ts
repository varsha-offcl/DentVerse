import {
  BadRequestException,
  Body,
  Controller,
  Inject,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { StaffAuthGuard } from "../auth/staff-auth.guard";
import { STT_PROVIDER, type SttProvider } from "./stt-provider.interface";
import { LLM_PROVIDER, type LlmProvider } from "./llm-provider.interface";

// Matches the Whisper API's own limit — reject oversized uploads before
// they ever reach Groq rather than letting that call fail late.
const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

@Controller("internal/voice-to-chart")
@UseGuards(StaffAuthGuard)
export class VoiceToChartController {
  constructor(
    @Inject(STT_PROVIDER) private readonly sttProvider: SttProvider,
    @Inject(LLM_PROVIDER) private readonly llmProvider: LlmProvider
  ) {}

  // Step 1 of the pipeline the Voice-to-Chart screen visualizes: recorded
  // audio in, raw transcript out. Kept separate from /structure so the UI
  // can show real "transcribing" vs "structuring" progress instead of
  // faking two stages around a single call.
  @Post("transcribe")
  @UseInterceptors(FileInterceptor("audio", { limits: { fileSize: MAX_AUDIO_BYTES } }))
  async transcribe(@UploadedFile() audio?: Express.Multer.File) {
    if (!audio) {
      throw new BadRequestException("No audio file was uploaded.");
    }
    const { transcript } = await this.sttProvider.transcribe(audio.buffer, audio.mimetype);
    return { transcript };
  }

  // Step 2: transcript in, structured SOAP chart note out. Returned as a
  // draft only — the doctor reviews/edits it in the UI, and the browser
  // saves it through the same RLS-protected chart_notes insert manual
  // entries already use, not from here.
  @Post("structure")
  async structure(@Body("transcript") transcript?: string) {
    if (!transcript || !transcript.trim()) {
      throw new BadRequestException("No transcript was provided.");
    }
    return this.llmProvider.structureChartNote(transcript);
  }
}
