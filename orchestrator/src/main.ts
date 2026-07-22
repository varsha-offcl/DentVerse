// Must run before any other import: modules like supabase-admin.ts read
// process.env at import time, so .env has to be loaded first or those
// reads see undefined. dotenv/config looks for a .env file in process.cwd()
// (i.e. run `npm run dev`/`npm start` from inside orchestrator/, not repo root).
import "dotenv/config";
import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

function warnAboutMissingEnvVars() {
  const required = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "GROQ_API_KEY"];
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    console.warn(
      `[DentVerse orchestrator] Missing env vars: ${missing.join(", ")}. ` +
        "Voice-to-Chart requests will fail until orchestrator/.env is filled in " +
        "(copy orchestrator/.env.example). /health will still work."
    );
  }
}

async function bootstrap() {
  warnAboutMissingEnvVars();

  const app = await NestFactory.create(AppModule);
  app.enableCors();

  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  await app.listen(port);
  console.log(`DentVerse orchestrator listening on http://localhost:${port}`);
}

bootstrap();
