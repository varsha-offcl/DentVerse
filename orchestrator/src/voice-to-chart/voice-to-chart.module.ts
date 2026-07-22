import { Module } from "@nestjs/common";
import { VoiceToChartController } from "./voice-to-chart.controller";
import { STT_PROVIDER } from "./stt-provider.interface";
import { LLM_PROVIDER } from "./llm-provider.interface";
import { GroqSttProvider } from "./groq-stt.provider";
import { GroqLlmProvider } from "./groq-llm.provider";

// Which concrete class backs each interface is chosen here, by env var, and
// nowhere else — the controller only ever depends on the interfaces above.
// To switch STT to Sarvam later: write SarvamSttProvider implementing
// SttProvider, add it to the factory below, and set STT_PROVIDER=sarvam.
// Same shape for the structuring LLM via LLM_PROVIDER.
@Module({
  controllers: [VoiceToChartController],
  providers: [
    GroqSttProvider,
    GroqLlmProvider,
    {
      provide: STT_PROVIDER,
      useFactory: (groq: GroqSttProvider) => {
        const chosen = process.env.STT_PROVIDER || "groq";
        if (chosen !== "groq") {
          throw new Error(`STT_PROVIDER "${chosen}" is not implemented yet — only "groq" exists so far.`);
        }
        return groq;
      },
      inject: [GroqSttProvider],
    },
    {
      provide: LLM_PROVIDER,
      useFactory: (groq: GroqLlmProvider) => {
        const chosen = process.env.LLM_PROVIDER || "groq";
        if (chosen !== "groq") {
          throw new Error(`LLM_PROVIDER "${chosen}" is not implemented yet — only "groq" exists so far.`);
        }
        return groq;
      },
      inject: [GroqLlmProvider],
    },
  ],
})
export class VoiceToChartModule {}
