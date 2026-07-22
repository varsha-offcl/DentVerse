import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { VoiceToChartModule } from "./voice-to-chart/voice-to-chart.module";

@Module({
  imports: [VoiceToChartModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
