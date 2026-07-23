import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";

// All AI endpoints (Voice-to-Chart, Notes, Prescription, Treatment Plan)
// have migrated to Supabase Edge Functions — see supabase/functions/. This
// leaves only the health check; see DentVerseDocs for whether the
// orchestrator is still needed for future non-AI work.
@Module({
  imports: [],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
