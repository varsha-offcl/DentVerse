import * as React from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ClipboardList,
  ArrowLeft,
  Plus,
  Trash2,
  Send,
  CheckCircle2,
  IndianRupee,
  CircleDot,
  Circle,
  MessageCircle,
  Pencil,
  Eye,
  BadgeCheck,
} from "lucide-react";
import { useAppState, type NewTreatmentPlanInput } from "@/context/AppStateContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { TreatmentPhase, TreatmentPlan } from "@/data/mockData";

type PhaseRow = { name: string; procedure: string; cost: string; estDate: string };
const emptyPhase: PhaseRow = { name: "", procedure: "", cost: "", estDate: "" };

function phaseStatusMeta(status: TreatmentPhase["status"]) {
  switch (status) {
    case "Completed":
      return { icon: CheckCircle2, className: "text-success" };
    case "In Progress":
      return { icon: CircleDot, className: "text-primary" };
    default:
      return { icon: Circle, className: "text-muted-foreground" };
  }
}

function planProgress(phases: TreatmentPhase[]) {
  if (phases.length === 0) return 0;
  const completed = phases.filter((p) => p.status === "Completed").length;
  return Math.round((completed / phases.length) * 100);
}

function planBadgeVariant(status: TreatmentPlan["status"]) {
  switch (status) {
    case "Completed":
    case "Approved":
      return "success" as const;
    case "In Progress":
      return "default" as const;
    default:
      return "warning" as const;
  }
}

function PlanPhaseTimeline({ phases }: { phases: TreatmentPhase[] }) {
  return (
    <div className="space-y-3 pt-2">
      {phases.map((phase, i) => {
        const meta = phaseStatusMeta(phase.status);
        return (
          <div key={phase.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <meta.icon className={cn("h-4 w-4", meta.className)} />
              {i < phases.length - 1 && <div className="my-1 h-full w-px flex-1 bg-border" />}
            </div>
            <div className="flex-1 pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">{phase.name}: {phase.procedure}</p>
                <Badge variant="outline" className={cn("capitalize", meta.className)}>{phase.status}</Badge>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {phase.cost > 0 ? `₹${phase.cost.toLocaleString("en-IN")}` : "Included"} · Est. {phase.estDate}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function TreatmentPlanPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { patients, addTreatmentPlan, updateTreatmentPlan, updateTreatmentPlanStatus } = useAppState();
  const patient = patients.find((p) => p.id === id);

  const [activeTab, setActiveTab] = React.useState("active");
  const [mode, setMode] = React.useState<"edit" | "preview">("edit");
  const [title, setTitle] = React.useState("");
  const [phases, setPhases] = React.useState<PhaseRow[]>([{ ...emptyPhase }]);
  const [approved, setApproved] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [sendError, setSendError] = React.useState<string | null>(null);
  const [approvingId, setApprovingId] = React.useState<string | null>(null);
  const [approveError, setApproveError] = React.useState<string | null>(null);
  const [sent, setSent] = React.useState(false);
  const [resentPlanId, setResentPlanId] = React.useState<string | null>(null);
  const [editingPlanId, setEditingPlanId] = React.useState<string | null>(null);
  const [draftSaving, setDraftSaving] = React.useState(false);
  const [draftError, setDraftError] = React.useState<string | null>(null);
  const [draftSaved, setDraftSaved] = React.useState(false);

  if (!patient) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">Patient not found.</p>
        <Button className="mt-4" onClick={() => navigate("/dashboard/patients")}>Back to Patients</Button>
      </div>
    );
  }

  const updatePhase = (i: number, field: keyof PhaseRow, value: string) => {
    setPhases((prev) => prev.map((p, idx) => (idx === i ? { ...p, [field]: value } : p)));
  };
  const addPhase = () => setPhases((prev) => [...prev, { ...emptyPhase }]);
  const removePhase = (i: number) => setPhases((prev) => prev.filter((_, idx) => idx !== i));

  const validPhases = phases.filter((p) => p.name.trim() !== "");
  const totalCost = phases.reduce((sum, p) => sum + (parseFloat(p.cost) || 0), 0);

  const goToPreview = () => {
    if (validPhases.length === 0 || !title.trim()) return;
    setMode("preview");
  };

  const handleApprovePreview = () => setApproved(true);

  const buildPhasesPayload = () =>
    validPhases.map((p) => ({
      name: p.name,
      procedure: p.procedure,
      cost: parseFloat(p.cost) || 0,
      status: "Upcoming" as const,
      estDate: p.estDate || "TBD",
    }));

  const handleSaveDraft = async () => {
    if (validPhases.length === 0 || !title.trim()) return;
    setDraftSaving(true);
    setDraftError(null);
    setDraftSaved(false);
    try {
      const payload: NewTreatmentPlanInput = {
        title,
        totalCost,
        status: "Proposed",
        phases: buildPhasesPayload(),
      };
      if (editingPlanId) {
        await updateTreatmentPlan(patient.id, editingPlanId, payload);
      } else {
        const plan = await addTreatmentPlan(patient.id, payload);
        setEditingPlanId(plan.id);
      }
      setDraftSaved(true);
    } catch (err) {
      setDraftError(err instanceof Error ? err.message : "Could not save this draft.");
    } finally {
      setDraftSaving(false);
    }
  };

  const handleSend = async () => {
    if (validPhases.length === 0 || !approved) return;
    setSending(true);
    setSendError(null);
    try {
      const payload: NewTreatmentPlanInput = {
        title,
        totalCost,
        status: "Approved",
        phases: buildPhasesPayload(),
      };
      if (editingPlanId) {
        await updateTreatmentPlan(patient.id, editingPlanId, payload);
      } else {
        await addTreatmentPlan(patient.id, payload);
      }
      setSent(true);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Could not save this treatment plan.");
    } finally {
      setSending(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setPhases([{ ...emptyPhase }]);
    setApproved(false);
    setMode("edit");
    setSent(false);
    setSendError(null);
    setDraftError(null);
    setDraftSaved(false);
    setEditingPlanId(null);
  };

  const loadPlanForEdit = (plan: TreatmentPlan) => {
    setTitle(plan.title);
    setPhases(
      plan.phases.length
        ? plan.phases.map((p) => ({ name: p.name, procedure: p.procedure, cost: String(p.cost), estDate: p.estDate }))
        : [{ ...emptyPhase }]
    );
    setEditingPlanId(plan.id);
    setApproved(false);
    setSendError(null);
    setDraftError(null);
    setDraftSaved(false);
    setSent(false);
    setMode("edit");
    setActiveTab("new");
  };

  const approveExisting = async (plan: TreatmentPlan) => {
    setApprovingId(plan.id);
    setApproveError(null);
    try {
      await updateTreatmentPlanStatus(patient.id, plan.id, "Approved");
    } catch (err) {
      setApproveError(err instanceof Error ? err.message : "Could not approve this plan.");
    } finally {
      setApprovingId(null);
    }
  };

  const resendExisting = (planId: string) => {
    setResentPlanId(planId);
    setTimeout(() => setResentPlanId((prev) => (prev === planId ? null : prev)), 2500);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link to={`/patient/${patient.id}`} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to {patient.name}
      </Link>

      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <ClipboardList className="h-6 w-6 text-primary" /> Treatment Plan
        </h1>
        <p className="text-sm text-muted-foreground">Build, approve, and send a phased treatment plan to {patient.name}.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active">Previous Treatment Plans ({patient.treatmentPlans.length})</TabsTrigger>
          <TabsTrigger value="new">New Plan</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {approveError && <p className="text-sm text-destructive">{approveError}</p>}
          {patient.treatmentPlans.map((plan) => (
            <Card key={plan.id}>
              <CardHeader className="flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle>{plan.title}</CardTitle>
                  <CardDescription>Created {plan.createdOn}</CardDescription>
                </div>
                <Badge variant={planBadgeVariant(plan.status)}>{plan.status}</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-1 text-sm font-semibold">
                    <IndianRupee className="h-3.5 w-3.5" /> {plan.totalCost.toLocaleString("en-IN")} total
                  </p>
                  <p className="text-xs text-muted-foreground">{planProgress(plan.phases)}% complete</p>
                </div>
                <Progress value={planProgress(plan.phases)} />
                <PlanPhaseTimeline phases={plan.phases} />

                <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                  {plan.status === "Proposed" && (
                    <>
                      <Button
                        size="sm"
                        variant="success"
                        disabled={approvingId === plan.id}
                        onClick={() => approveExisting(plan)}
                      >
                        <BadgeCheck className="h-3.5 w-3.5" /> {approvingId === plan.id ? "Approving..." : "Approve"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => loadPlanForEdit(plan)}>
                        <Pencil className="h-3.5 w-3.5" /> Edit Draft
                      </Button>
                    </>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={resentPlanId === plan.id}
                    onClick={() => resendExisting(plan.id)}
                  >
                    <Send className="h-3.5 w-3.5" /> {resentPlanId === plan.id ? "Sent via WhatsApp ✓" : "Send to WhatsApp"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {patient.treatmentPlans.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">No treatment plans yet. Create one in the "New Plan" tab.</p>
          )}
        </TabsContent>

        <TabsContent value="new">
          {sent ? (
            <Card className="border-success/30 bg-success/5">
              <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-lg font-semibold">Treatment plan sent</p>
                  <p className="text-sm text-muted-foreground">{patient.name} will review the approved plan on WhatsApp.</p>
                </div>
                <div className="w-full max-w-sm rounded-lg bg-[#e5ded5] p-4 text-left">
                  <div className="rounded-lg bg-[#d9fdd3] px-3 py-2 text-sm shadow-sm">
                    <p className="mb-0.5 flex items-center gap-1 text-[10px] font-semibold text-primary">
                      <MessageCircle className="h-3 w-3" /> DentVerse Clinic
                    </p>
                    <p>
                      Hi {patient.name.split(" ")[0]}, Dr. Rao has approved your treatment plan — "{title}" (₹{totalCost.toLocaleString("en-IN")} total).
                      Reply CONFIRM to schedule your first sitting!
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap justify-center gap-3">
                  <Button variant="outline" onClick={resetForm}>Create Another</Button>
                  <Button onClick={() => navigate(`/patient/${patient.id}`)}>Back to Workspace</Button>
                </div>
              </CardContent>
            </Card>
          ) : mode === "edit" ? (
            <div className="space-y-4">
              {editingPlanId && (
                <div className="flex items-center justify-between rounded-md border border-border bg-secondary/40 px-3 py-2 text-xs text-muted-foreground">
                  <span>Editing a saved draft.</span>
                  <button onClick={resetForm} className="font-medium underline underline-offset-2">
                    Start a new plan instead
                  </button>
                </div>
              )}
              <Card>
              <CardHeader>
                <CardTitle>Plan Details</CardTitle>
                <CardDescription>Add each phase of the treatment with its estimated cost.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Plan Title</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Dental Implant — Tooth #14" />
                </div>

                {phases.map((phase, i) => (
                  <div key={i} className="rounded-lg border border-border p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <Badge variant="outline">Phase {i + 1}</Badge>
                      {phases.length > 1 && (
                        <button onClick={() => removePhase(i)} className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label>Phase Name</Label>
                        <Input value={phase.name} onChange={(e) => updatePhase(i, "name", e.target.value)} placeholder="Phase 1" />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Estimated Date</Label>
                        <Input
                          type="date"
                          value={phase.estDate === "TBD" ? "" : phase.estDate}
                          onChange={(e) => updatePhase(i, "estDate", e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label>Procedure</Label>
                        <Input value={phase.procedure} onChange={(e) => updatePhase(i, "procedure", e.target.value)} placeholder="Implant placement surgery" />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Cost (₹)</Label>
                        <Input type="number" value={phase.cost} onChange={(e) => updatePhase(i, "cost", e.target.value)} placeholder="25000" />
                      </div>
                    </div>
                  </div>
                ))}

                <Button variant="outline" size="sm" onClick={addPhase}>
                  <Plus className="h-4 w-4" /> Add Phase
                </Button>

                <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                  <span className="text-sm font-medium">Total Estimated Cost</span>
                  <span className="flex items-center gap-1 text-lg font-bold">
                    <IndianRupee className="h-4 w-4" /> {totalCost.toLocaleString("en-IN")}
                  </span>
                </div>

                {draftError && <p className="text-sm text-destructive">{draftError}</p>}
                {draftSaved && <p className="text-sm text-success">Draft saved — find it under "Previous Treatment Plans".</p>}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    size="lg"
                    onClick={handleSaveDraft}
                    disabled={validPhases.length === 0 || !title.trim() || draftSaving}
                  >
                    {draftSaving ? "Saving..." : "Save Draft"}
                  </Button>
                  <Button onClick={goToPreview} className="flex-1" size="lg" disabled={validPhases.length === 0 || !title.trim()}>
                    <Eye className="h-4 w-4" /> Preview Plan
                  </Button>
                </div>
              </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardHeader className="flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle>{title}</CardTitle>
                  <CardDescription>Preview before sending to {patient.name}</CardDescription>
                </div>
                <Badge variant={approved ? "success" : "warning"}>{approved ? "Approved" : "Pending Your Approval"}</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                  <span className="text-sm font-medium">Total Estimated Cost</span>
                  <span className="flex items-center gap-1 font-bold">
                    <IndianRupee className="h-4 w-4" /> {totalCost.toLocaleString("en-IN")}
                  </span>
                </div>
                <PlanPhaseTimeline
                  phases={validPhases.map((p, idx) => ({
                    id: `preview-${idx}`,
                    name: p.name,
                    procedure: p.procedure,
                    cost: parseFloat(p.cost) || 0,
                    status: "Upcoming",
                    estDate: p.estDate || "TBD",
                  }))}
                />

                {sendError && <p className="text-sm text-destructive">{sendError}</p>}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                  <Button variant="outline" onClick={() => setMode("edit")} disabled={sending}>
                    <Pencil className="h-4 w-4" /> Back to Edit
                  </Button>
                  <div className="flex flex-wrap gap-2">
                    {!approved ? (
                      <Button variant="secondary" onClick={handleApprovePreview}>
                        <BadgeCheck className="h-4 w-4" /> Approve Plan
                      </Button>
                    ) : (
                      <Button onClick={handleSend} disabled={sending}>
                        <Send className="h-4 w-4" /> {sending ? "Sending..." : "Send to Patient via WhatsApp"}
                      </Button>
                    )}
                  </div>
                </div>
                {!approved && (
                  <p className="text-right text-xs text-muted-foreground">Approve the plan before sending it to the patient.</p>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
