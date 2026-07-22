import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { VoiceToChartModule } from "./voice-to-chart/voice-to-chart.module";
import { PrescriptionModule } from "./prescription/prescription.module";
import { TreatmentPlanModule } from "./treatment-plan/treatment-plan.module";

@Module({
  imports: [VoiceToChartModule, PrescriptionModule, TreatmentPlanModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
