import * as React from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Mic,
  Square,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  FileText,
  ClipboardList,
  RotateCcw,
  AudioWaveform,
  Brain,
  NotebookPen,
  Check,
  AlertTriangle,
} from "lucide-react";
import { useAppState } from "@/context/AppStateContext";
import { callOrchestrator } from "@/lib/orchestrator";
import type { FollowUpTrigger } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Stage = "idle" | "recording" | "transcribing" | "structuring" | "review" | "saved";

const PIPELINE_STAGES: { id: Stage; label: string; icon: React.ElementType }[] = [
  { id: "recording", label: "Record Consultation", icon: Mic },
  { id: "transcribing", label: "Transcribing Audio", icon: AudioWaveform },
  { id: "structuring", label: "AI Structuring", icon: Brain },
  { id: "review", label: "Chart Populated", icon: NotebookPen },
];

const STAGE_ORDER: Stage[] = ["idle", "recording", "transcribing", "structuring", "review", "saved"];

interface StructuredChartNote {
  title: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  followUpTrigger: FollowUpTrigger;
}

export default function VoiceToChart() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { patients, addChartNote } = useAppState();
  const patient = patients.find((p) => p.id === id);

  const [stage, setStage] = React.useState<Stage>("idle");
  const [seconds, setSeconds] = React.useState(0);
  const [title, setTitle] = React.useState("");
  const [soap, setSoap] = React.useState({ subjective: "", objective: "", assessment: "", plan: "" });
  const [transcript, setTranscript] = React.useState("");
  const [followUpTrigger, setFollowUpTrigger] = React.useState<FollowUpTrigger | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [pipelineError, setPipelineError] = React.useState<string | null>(null);
  const [recordError, setRecordError] = React.useState<string | null>(null);
  const [hasRetryableRecording, setHasRetryableRecording] = React.useState(false);

  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const recordedBlobRef = React.useRef<Blob | null>(null);

  React.useEffect(() => {
    if (stage !== "recording") return;
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [stage]);

  // Pipeline: record -> orchestrator transcribes (Groq Whisper) -> orchestrator
  // structures (Groq LLM) -> chart populated. Two real network calls, not
  // faked stage timers — see orchestrator/src/voice-to-chart.
  const processRecording = React.useCallback(async (blob: Blob) => {
    recordedBlobRef.current = blob;
    setHasRetryableRecording(true);
    setPipelineError(null);
    setStage("transcribing");
    try {
      // Give the upload a real extension — Groq (like the Whisper API it
      // mirrors) identifies the audio format from the filename, not just
      // the blob's Content-Type. The orchestrator re-derives its own
      // extension from the mimetype regardless, but an extension-less
      // filename is worth avoiding here too.
      const extension = blob.type.split(";")[0].split("/")[1] || "webm";
      const form = new FormData();
      form.append("audio", blob, `consultation-audio.${extension}`);
      const { transcript: t } = await callOrchestrator<{ transcript: string }>(
        "/internal/voice-to-chart/transcribe",
        { method: "POST", body: form }
      );
      setTranscript(t);

      setStage("structuring");
      const structured = await callOrchestrator<StructuredChartNote>("/internal/voice-to-chart/structure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: t }),
      });
      setTitle(structured.title);
      setSoap({
        subjective: structured.subjective,
        objective: structured.objective,
        assessment: structured.assessment,
        plan: structured.plan,
      });
      setFollowUpTrigger(structured.followUpTrigger);
      setStage("review");
    } catch (err) {
      setPipelineError(err instanceof Error ? err.message : "Something went wrong processing the recording.");
      setStage("idle");
    }
  }, []);

  if (!patient) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">Patient not found.</p>
        <Button className="mt-4" onClick={() => navigate("/dashboard/patients")}>Back to Patients</Button>
      </div>
    );
  }

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const startRecording = async () => {
    setRecordError(null);
    setPipelineError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" });
        void processRecording(blob);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setSeconds(0);
      setStage("recording");
    } catch (err) {
      setRecordError(
        err instanceof Error ? `Couldn't access the microphone: ${err.message}` : "Couldn't access the microphone."
      );
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
  };

  const retryProcessing = () => {
    if (recordedBlobRef.current) {
      void processRecording(recordedBlobRef.current);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await addChartNote(patient.id, {
        title: title || "Untitled Visit Note",
        recordedVia: "Voice-to-Chart AI",
        soap,
        rawTranscript: transcript || null,
        followUpTrigger,
      });
      setStage("saved");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not save this chart note.");
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setStage("idle");
    setSeconds(0);
    setTitle("");
    setSoap({ subjective: "", objective: "", assessment: "", plan: "" });
    setTranscript("");
    setFollowUpTrigger(null);
    setPipelineError(null);
    setHasRetryableRecording(false);
    recordedBlobRef.current = null;
  };

  const currentStageIndex = STAGE_ORDER.indexOf(stage);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link to={`/patient/${patient.id}`} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to {patient.name}
      </Link>

      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Mic className="h-6 w-6 text-primary" /> Voice-to-Chart
        </h1>
        <p className="text-sm text-muted-foreground">
          Record your consultation — speech is transcribed, an LLM structures it, and it's saved straight to {patient.name}'s chart.
        </p>
      </div>

      {stage !== "idle" && (
        <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
          {PIPELINE_STAGES.map((s, i) => {
            const stageIdx = STAGE_ORDER.indexOf(s.id);
            const isDone = currentStageIndex > stageIdx || stage === "saved";
            const isActive = stage === s.id;
            return (
              <React.Fragment key={s.id}>
                <div className="flex flex-1 flex-col items-center gap-1.5 text-center">
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors",
                      isDone && "border-success bg-success text-success-foreground",
                      isActive && !isDone && "border-primary bg-secondary text-primary animate-pulse",
                      !isDone && !isActive && "border-border bg-muted text-muted-foreground"
                    )}
                  >
                    {isDone ? <Check className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
                  </div>
                  <span className={cn("text-[11px] font-medium", isActive ? "text-foreground" : "text-muted-foreground")}>
                    {s.label}
                  </span>
                </div>
                {i < PIPELINE_STAGES.length - 1 && (
                  <div className={cn("mb-5 h-0.5 flex-1", isDone ? "bg-success" : "bg-border")} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}

      {pipelineError && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="flex-1 space-y-2">
            <p>{pipelineError}</p>
            {hasRetryableRecording && (
              <Button variant="outline" size="sm" onClick={retryProcessing}>
                Retry with the Same Recording
              </Button>
            )}
          </div>
        </div>
      )}

      {(stage === "idle" || stage === "recording") && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-6 py-16">
            <div className="relative flex h-32 w-32 items-center justify-center">
              {stage === "recording" && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive/30" />
              )}
              <button
                onClick={() => {
                  if (stage === "idle") void startRecording();
                  else if (stage === "recording") stopRecording();
                }}
                className={cn(
                  "relative flex h-24 w-24 items-center justify-center rounded-full shadow-lg transition-colors",
                  stage === "recording" ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"
                )}
              >
                {stage === "recording" ? <Square className="h-8 w-8" /> : <Mic className="h-9 w-9" />}
              </button>
            </div>

            {stage === "idle" && <p className="text-sm text-muted-foreground">Tap to start recording the consultation</p>}
            {stage === "idle" && recordError && <p className="text-sm text-destructive">{recordError}</p>}

            {stage === "recording" && (
              <div className="flex flex-col items-center gap-3">
                <p className="text-lg font-semibold tabular-nums">{formatTime(seconds)}</p>
                <div className="flex items-end gap-1">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <span
                      key={i}
                      className="w-1 animate-pulse rounded-full bg-primary"
                      style={{
                        height: `${8 + ((i * 37) % 28)}px`,
                        animationDelay: `${i * 60}ms`,
                        animationDuration: "900ms",
                      }}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Listening — tap the square to stop and transcribe</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {stage === "transcribing" && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16">
            <AudioWaveform className="h-6 w-6 animate-pulse text-primary" />
            <p className="text-sm font-medium">Transcribing the recording...</p>
            <p className="text-xs text-muted-foreground">This usually takes a few seconds</p>
          </CardContent>
        </Card>
      )}

      {stage === "structuring" && (
        <div className="space-y-4">
          <Card className="border-primary/30 bg-secondary/30">
            <CardHeader className="flex-row items-center gap-2 space-y-0">
              <FileText className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm">Raw Transcript</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm italic text-muted-foreground">"{transcript}"</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12">
              <Brain className="h-6 w-6 animate-pulse text-primary" />
              <p className="text-sm font-medium">AI is structuring the consultation into a SOAP chart note...</p>
            </CardContent>
          </Card>
        </div>
      )}

      {stage === "review" && (
        <div className="space-y-4">
          <Card className="border-primary/30 bg-secondary/30">
            <CardHeader className="flex-row items-center gap-2 space-y-0">
              <Sparkles className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm">Raw Transcript</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm italic text-muted-foreground">"{transcript}"</p>
            </CardContent>
          </Card>

          {followUpTrigger?.triggered && (
            <Card className="border-warning/30 bg-warning/5">
              <CardContent className="flex items-start gap-3 p-4 text-sm">
                <ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-warning-foreground" />
                <p>
                  <span className="font-medium text-foreground">Follow-up suggested</span>
                  {followUpTrigger.suggestedTiming ? ` in ${followUpTrigger.suggestedTiming}` : ""}
                  {followUpTrigger.reason ? ` — ${followUpTrigger.reason}` : ""}. Saved with this note; scheduling it automatically is a later milestone.
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Patient Chart — Auto-Populated</CardTitle>
              <CardDescription>Structured by AI from the transcript. Review and edit before saving.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Visit Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <Badge variant="secondary" className="text-[10px]">S</Badge> Subjective
                </Label>
                <Textarea value={soap.subjective} onChange={(e) => setSoap({ ...soap, subjective: e.target.value })} rows={2} />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <Badge variant="secondary" className="text-[10px]">O</Badge> Objective
                </Label>
                <Textarea value={soap.objective} onChange={(e) => setSoap({ ...soap, objective: e.target.value })} rows={2} />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <Badge variant="secondary" className="text-[10px]">A</Badge> Assessment
                </Label>
                <Textarea value={soap.assessment} onChange={(e) => setSoap({ ...soap, assessment: e.target.value })} rows={2} />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <Badge variant="secondary" className="text-[10px]">P</Badge> Plan
                </Label>
                <Textarea value={soap.plan} onChange={(e) => setSoap({ ...soap, plan: e.target.value })} rows={2} />
              </div>
              {saveError && <p className="text-sm text-destructive">{saveError}</p>}
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={reset} disabled={saving}>
                  <RotateCcw className="h-4 w-4" /> Discard & Re-record
                </Button>
                <Button onClick={handleSave} className="flex-1" disabled={saving}>
                  <CheckCircle2 className="h-4 w-4" /> {saving ? "Saving..." : "Save to Patient Chart"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {stage === "saved" && (
        <Card className="border-success/30 bg-success/5">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div>
              <p className="text-lg font-semibold">Chart note saved</p>
              <p className="text-sm text-muted-foreground">Added to {patient.name}'s Patient Chart widget in their workspace.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <Button variant="outline" onClick={() => navigate(`/patient/${patient.id}`)}>
                Back to Patient Workspace
              </Button>
              <Button variant="outline" onClick={() => navigate(`/patient/${patient.id}/prescription`)}>
                <FileText className="h-4 w-4" /> Write Prescription
              </Button>
              <Button onClick={() => navigate(`/patient/${patient.id}/treatment-plan`)}>
                <ClipboardList className="h-4 w-4" /> Build Treatment Plan
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
