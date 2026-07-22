import { Module } from "@nestjs/common";
import { VoiceToChartModule } from "../voice-to-chart/voice-to-chart.module";
import { TreatmentPlanController } from "./treatment-plan.controller";

@Module({
  imports: [VoiceToChartModule],
  controllers: [TreatmentPlanController],
})
export class TreatmentPlanModule {}
