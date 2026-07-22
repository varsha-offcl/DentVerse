import { Module } from "@nestjs/common";
import { VoiceToChartModule } from "../voice-to-chart/voice-to-chart.module";
import { PrescriptionController } from "./prescription.controller";

@Module({
  imports: [VoiceToChartModule],
  controllers: [PrescriptionController],
})
export class PrescriptionModule {}
