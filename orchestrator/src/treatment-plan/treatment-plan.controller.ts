import { BadRequestException, Body, Controller, Inject, Post, UseGuards } from "@nestjs/common";
import { StaffAuthGuard } from "../auth/staff-auth.guard";
import { LLM_PROVIDER, type LlmProvider } from "../voice-to-chart/llm-provider.interface";

// Audio -> transcript still goes through the shared
// POST /internal/voice-to-chart/transcribe. This route only covers the
// structuring step, which produces a phased plan shape instead of SOAP.
@Controller("internal/treatment-plan")
@UseGuards(StaffAuthGuard)
export class TreatmentPlanController {
  constructor(@Inject(LLM_PROVIDER) private readonly llmProvider: LlmProvider) {}

  @Post("structure")
  async structure(@Body("transcript") transcript?: string) {
    if (!transcript || !transcript.trim()) {
      throw new BadRequestException("No transcript was provided.");
    }
    return this.llmProvider.structureTreatmentPlan(transcript);
  }
}
