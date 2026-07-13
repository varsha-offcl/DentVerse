import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  Phone,
  Mail,
  Calendar,
  IndianRupee,
  Mic,
  FileText,
  ClipboardList,
  AlertTriangle,
  Hash,
  Cake,
  Check,
  X,
  Trash2,
  Stethoscope,
  Pill,
  Notebook,
  FileStack,
  Upload,
  MessageCircle,
  PhoneCall,
  Building2,
  CheckCircle2,
  Clock,
  Send,
  Camera,
  Pencil,
} from "lucide-react";
import { useAppState } from "@/context/AppStateContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Patient, ImageCategory, TreatmentPhase } from "@/data/mockData";
import { cn } from "@/lib/utils";

function statusBadgeVariant(status: string) {
  switch (status) {
    case "confirmed":
      return "success" as const;
    case "pending":
      return "warning" as const;
    case "cancelled":
      return "destructive" as const;
    default:
      return "muted" as const;
  }
}

/* ---------------------------- Patient Summary ---------------------------- */

export function PatientSummaryWidget({ patient }: { patient: Patient }) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [form, setForm] = React.useState({
    phone: patient.phone,
    age: String(patient.age),
    gender: patient.gender,
    email: patient.email,
  });
  const [showToast, setShowToast] = React.useState(false);

  const startEdit = () => {
    setForm({ phone: patient.phone, age: String(patient.age), gender: patient.gender, email: patient.email });
    setIsEditing(true);
  };

  const cancelEdit = () => setIsEditing(false);

  const saveEdit = () => {
    setIsEditing(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-[auto,1fr]">
      <div className="flex items-center gap-4 sm:flex-col sm:items-start">
        <Avatar className="h-16 w-16">
          <AvatarFallback className="bg-secondary text-lg text-primary">{patient.avatarInitials}</AvatarFallback>
        </Avatar>
        <div className="flex flex-wrap gap-1.5">
          {patient.tags.map((t) => (
            <Badge key={t} variant="secondary">{t}</Badge>
          ))}
        </div>
      </div>
      <div>
        <div className="mb-3 flex justify-end">
          {!isEditing ? (
            <Button size="sm" variant="outline" onClick={startEdit}>
              <Pencil className="h-3.5 w-3.5" /> Update
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={cancelEdit}>
                <X className="h-3.5 w-3.5" /> Cancel
              </Button>
              <Button size="sm" onClick={saveEdit}>
                <Check className="h-3.5 w-3.5" /> Save Changes
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="flex items-center gap-1 text-xs text-muted-foreground"><Hash className="h-3 w-3" /> Patient ID</p>
            <p className="mt-0.5 font-mono text-sm font-medium">{patient.id.toUpperCase()}</p>
          </div>
          <div>
            <p className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="h-3 w-3" /> Phone</p>
            {isEditing ? (
              <Input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="mt-0.5 h-8 text-sm"
              />
            ) : (
              <p className="mt-0.5 text-sm font-medium">{patient.phone}</p>
            )}
          </div>
          <div>
            <p className="flex items-center gap-1 text-xs text-muted-foreground"><Cake className="h-3 w-3" /> Age / Gender</p>
            {isEditing ? (
              <div className="mt-0.5 flex gap-1.5">
                <Input
                  type="number"
                  value={form.age}
                  onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))}
                  className="h-8 w-16 text-sm"
                />
                <Select value={form.gender} onValueChange={(v) => setForm((f) => ({ ...f, gender: v as "Male" | "Female" }))}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Male">Male</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <p className="mt-0.5 text-sm font-medium">{patient.age} yrs · {patient.gender}</p>
            )}
          </div>
          <div>
            <p className="flex items-center gap-1 text-xs text-muted-foreground"><Mail className="h-3 w-3" /> Email</p>
            {isEditing ? (
              <Input
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="mt-0.5 h-8 text-sm"
              />
            ) : (
              <p className="mt-0.5 truncate text-sm font-medium">{patient.email}</p>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Member Since</p>
            <p className="mt-0.5 text-sm font-medium">{patient.memberSince}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Last Visit</p>
            <p className="mt-0.5 text-sm font-medium">{patient.lastVisit}</p>
          </div>
          <div className="col-span-2">
            {patient.allergies.length > 0 ? (
              <p className="flex items-center gap-1 text-sm font-medium text-destructive">
                <AlertTriangle className="h-3.5 w-3.5" /> Allergic to {patient.allergies.join(", ")}
              </p>
            ) : (
              <p className="text-sm text-success">No known allergies</p>
            )}
          </div>
        </div>
      </div>

      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-success px-4 py-3 text-sm font-medium text-success-foreground shadow-lg animate-in fade-in-0 slide-in-from-bottom-2">
          <CheckCircle2 className="h-4 w-4" />
          Patient details updated successfully.
        </div>
      )}
    </div>
  );
}

/* ------------------------------ Appointment ------------------------------ */

export function AppointmentWidget({ patient }: { patient: Patient }) {
  const navigate = useNavigate();
  const { appointments, setAppointmentStatus } = useAppState();
  const upcoming = appointments
    .filter((a) => a.patientId === patient.id && (a.status === "pending" || a.status === "confirmed"))
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  if (!upcoming) {
    return <p className="py-6 text-center text-sm text-muted-foreground">No upcoming appointment scheduled.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold">{upcoming.type}</p>
          <p className="text-xs text-muted-foreground">{upcoming.date} · {upcoming.time} · {upcoming.duration}</p>
        </div>
        <Badge variant={statusBadgeVariant(upcoming.status)} className="capitalize">{upcoming.status}</Badge>
      </div>
      <p className="text-xs text-muted-foreground">Booked via {upcoming.source}</p>
      {upcoming.notes && <p className="text-xs italic text-muted-foreground">"{upcoming.notes}"</p>}
      {upcoming.status === "pending" && (
        <div className="flex gap-2 pt-1">
          <Button size="sm" variant="success" onClick={() => setAppointmentStatus(upcoming.id, "confirmed")}>
            <Check className="h-3.5 w-3.5" /> Confirm
          </Button>
          <Button size="sm" variant="destructive" onClick={() => setAppointmentStatus(upcoming.id, "cancelled")}>
            <X className="h-3.5 w-3.5" /> Decline
          </Button>
        </div>
      )}
      {upcoming.status === "confirmed" && (
        <Button size="sm" variant="outline" onClick={() => navigate("/dashboard/calendar")}>
          <Calendar className="h-3.5 w-3.5" /> View in Calendar
        </Button>
      )}
    </div>
  );
}

/* -------------------------- Appointment History -------------------------- */

export function AppointmentHistoryWidget({ patient }: { patient: Patient }) {
  const { appointments } = useAppState();
  const history = appointments
    .filter((a) => a.patientId === patient.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  if (history.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">No appointment history.</p>;
  }

  return (
    <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
      {history.map((a) => (
        <div key={a.id} className="flex items-center justify-between rounded-lg border border-border p-2.5">
          <div>
            <p className="text-sm font-medium">{a.type}</p>
            <p className="text-xs text-muted-foreground">{a.date} · {a.time}</p>
          </div>
          <Badge variant={statusBadgeVariant(a.status)} className="capitalize">{a.status}</Badge>
        </div>
      ))}
    </div>
  );
}

/* ----------------------------- Medical History ----------------------------- */

export function MedicalHistoryWidget({ patient }: { patient: Patient }) {
  const { conditions, medications, notes } = patient.medicalHistory;
  return (
    <div className="space-y-4">
      <div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">Chronic Conditions</p>
        {conditions.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {conditions.map((c) => (
              <Badge key={c} variant="outline">{c}</Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">None reported</p>
        )}
      </div>
      <div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">Current Medications</p>
        {medications.length > 0 ? (
          <ul className="space-y-1 text-sm">
            {medications.map((m) => (
              <li key={m} className="flex items-center gap-1.5">
                <Pill className="h-3.5 w-3.5 text-muted-foreground" /> {m}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">None reported</p>
        )}
      </div>
      <div>
        <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Notebook className="h-3.5 w-3.5" /> Clinical Notes
        </p>
        <p className="text-sm text-muted-foreground">{notes}</p>
      </div>
    </div>
  );
}

/* --------------------------- Treatment Timeline --------------------------- */

type TimelineEvent = { date: string; label: string; detail: string; icon: React.ElementType; tint: string };

export function TreatmentTimelineWidget({ patient }: { patient: Patient }) {
  const { appointments } = useAppState();

  const events: TimelineEvent[] = [
    ...appointments
      .filter((a) => a.patientId === patient.id && a.status === "completed")
      .map((a) => ({ date: a.date, label: a.type, detail: `Visit completed · ${a.time}`, icon: CheckCircle2, tint: "bg-success/10 text-success" })),
    ...patient.chartNotes.map((c) => ({ date: c.date, label: c.title, detail: `Chart note · ${c.recordedVia}`, icon: FileText, tint: "bg-secondary text-primary" })),
    ...patient.treatmentPlans.flatMap((tp) =>
      tp.phases
        .filter((p) => p.status !== "Upcoming")
        .map((p) => ({ date: p.estDate, label: `${tp.title} — ${p.name}`, detail: p.procedure, icon: ClipboardList, tint: "bg-warning/15 text-warning-foreground" }))
    ),
  ]
    .filter((e) => e.date && e.date !== "TBD")
    .sort((a, b) => b.date.localeCompare(a.date));

  if (events.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">No treatment history recorded yet.</p>;
  }

  return (
    <div className="space-y-0">
      {events.map((e, i) => (
        <div key={i} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", e.tint)}>
              <e.icon className="h-4 w-4" />
            </div>
            {i < events.length - 1 && <div className="my-1 w-px flex-1 bg-border" />}
          </div>
          <div className="flex-1 pb-4">
            <p className="text-sm font-medium">{e.label}</p>
            <p className="text-xs text-muted-foreground">{e.detail}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{e.date}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------ Patient Chart ------------------------------ */

export function PatientChartWidget({ patient }: { patient: Patient }) {
  const navigate = useNavigate();
  const [openNote, setOpenNote] = React.useState<Patient["chartNotes"][number] | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => navigate(`/patient/${patient.id}/voice-to-chart`)}>
          <Mic className="h-3.5 w-3.5" /> New Voice-to-Chart Entry
        </Button>
      </div>
      {patient.chartNotes.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">No chart notes yet.</p>
      ) : (
        <div className="space-y-2">
          {patient.chartNotes.map((c) => (
            <button
              key={c.id}
              onClick={() => setOpenNote(c)}
              className="flex w-full items-center justify-between rounded-lg border border-border p-3 text-left hover:bg-accent"
            >
              <div>
                <p className="text-sm font-medium">{c.title}</p>
                <p className="text-xs text-muted-foreground">{c.date}</p>
              </div>
              <Badge variant="outline" className="gap-1">
                <Stethoscope className="h-3 w-3" /> {c.recordedVia}
              </Badge>
            </button>
          ))}
        </div>
      )}

      <Dialog open={!!openNote} onOpenChange={(open) => !open && setOpenNote(null)}>
        <DialogContent>
          {openNote && (
            <>
              <DialogHeader>
                <DialogTitle>{openNote.title}</DialogTitle>
              </DialogHeader>
              <p className="text-xs text-muted-foreground">{openNote.date} · {openNote.recordedVia}</p>
              <div className="space-y-3 text-sm">
                <div><p className="font-medium">Subjective</p><p className="text-muted-foreground">{openNote.soap.subjective}</p></div>
                <div><p className="font-medium">Objective</p><p className="text-muted-foreground">{openNote.soap.objective}</p></div>
                <div><p className="font-medium">Assessment</p><p className="text-muted-foreground">{openNote.soap.assessment}</p></div>
                <div><p className="font-medium">Plan</p><p className="text-muted-foreground">{openNote.soap.plan}</p></div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* --------------------------- Clinical Images / X-Ray --------------------------- */

const IMAGE_CATEGORIES: ImageCategory[] = ["Clinical Photo", "Treatment Image", "X-Ray"];

export function ClinicalImagesWidget({ patient }: { patient: Patient }) {
  const { addPatientImage, removePatientImage } = useAppState();
  const [tab, setTab] = React.useState<ImageCategory>("Clinical Photo");
  const [preview, setPreview] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      const url = URL.createObjectURL(file);
      addPatientImage(patient.id, {
        id: `img${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        url,
        category: tab,
        label: file.name,
        uploadedAt: "2026-07-10",
      });
    });
    e.target.value = "";
  };

  return (
    <div>
      <Tabs value={tab} onValueChange={(v) => setTab(v as ImageCategory)}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <TabsList>
            {IMAGE_CATEGORIES.map((c) => (
              <TabsTrigger key={c} value={c}>{c}s</TabsTrigger>
            ))}
          </TabsList>
          <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-3.5 w-3.5" /> Upload
          </Button>
          <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={handleUpload} />
        </div>

        {IMAGE_CATEGORIES.map((c) => {
          const images = patient.images.filter((img) => img.category === c);
          return (
            <TabsContent key={c} value={c}>
              {images.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-10 text-center">
                  <Camera className="h-6 w-6 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No {c.toLowerCase()}s uploaded yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {images.map((img) => (
                    <div key={img.id} className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-border">
                      <button onClick={() => setPreview(img.url)} className="block h-full w-full">
                        <img src={img.url} alt={img.label} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                          <p className="truncate pr-6 text-[11px] text-white">{img.label}</p>
                        </div>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removePatientImage(patient.id, img.id);
                        }}
                        className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity hover:bg-destructive group-hover:opacity-100"
                        title="Delete image"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>

      <Dialog open={!!preview} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="max-w-2xl">
          {preview && <img src={preview} alt="" className="w-full rounded-lg" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------------------------------- Reports ---------------------------------- */

export function ReportsWidget({ patient }: { patient: Patient }) {
  const { addPatientReport, removePatientReport } = useAppState();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      addPatientReport(patient.id, {
        id: `rep${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: file.name,
        type: "Uploaded Document",
        uploadedAt: "2026-07-10",
        url: URL.createObjectURL(file),
      });
    });
    e.target.value = "";
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()}>
          <Upload className="h-3.5 w-3.5" /> Upload Report
        </Button>
        <input ref={fileInputRef} type="file" multiple hidden onChange={handleUpload} />
      </div>
      {patient.reports.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">No reports on file.</p>
      ) : (
        <div className="space-y-2">
          {patient.reports.map((r) => (
            <div key={r.id} className="flex items-center gap-3 rounded-lg border border-border p-2.5 hover:bg-accent">
              <a href={r.url} target="_blank" rel="noreferrer" className="flex min-w-0 flex-1 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                  <FileStack className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.type} · {r.uploadedAt}</p>
                </div>
              </a>
              <button
                onClick={() => removePatientReport(patient.id, r.id)}
                className="shrink-0 text-muted-foreground hover:text-destructive"
                title="Delete report"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------- Prescription ------------------------------- */

export function PrescriptionWidget({ patient }: { patient: Patient }) {
  const navigate = useNavigate();
  const latest = patient.prescriptions[0];

  return (
    <div className="space-y-3">
      {latest ? (
        <div className="rounded-lg border border-border p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">{latest.date}</p>
            <Badge variant={latest.status === "Sent to Patient" ? "success" : "muted"}>{latest.status}</Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{latest.medicines.length} medicine{latest.medicines.length !== 1 ? "s" : ""} prescribed</p>
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{latest.medicines.map((m) => m.name).join(", ")}</p>
        </div>
      ) : (
        <p className="py-4 text-center text-sm text-muted-foreground">No prescriptions issued yet.</p>
      )}
      <Button size="sm" variant="outline" className="w-full" onClick={() => navigate(`/patient/${patient.id}/prescription`)}>
        <FileText className="h-3.5 w-3.5" /> Open Prescription Center
      </Button>
    </div>
  );
}

/* ------------------------------- Treatment Plan ------------------------------- */

function planProgress(phases: TreatmentPhase[]) {
  if (phases.length === 0) return 0;
  const completed = phases.filter((p) => p.status === "Completed").length;
  return Math.round((completed / phases.length) * 100);
}

export function TreatmentPlanWidget({ patient }: { patient: Patient }) {
  const navigate = useNavigate();
  const active = patient.treatmentPlans[0];

  return (
    <div className="space-y-3">
      {active ? (
        <div className="rounded-lg border border-border p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">{active.title}</p>
            <Badge variant={active.status === "Completed" || active.status === "Approved" ? "success" : "warning"}>
              {active.status}
            </Badge>
          </div>
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <IndianRupee className="h-3 w-3" /> {active.totalCost.toLocaleString("en-IN")} total
          </p>
          <Progress value={planProgress(active.phases)} className="mt-2" />
        </div>
      ) : (
        <p className="py-4 text-center text-sm text-muted-foreground">No treatment plan created yet.</p>
      )}
      <Button size="sm" variant="outline" className="w-full" onClick={() => navigate(`/patient/${patient.id}/treatment-plan`)}>
        <ClipboardList className="h-3.5 w-3.5" /> Open Treatment Plan
      </Button>
    </div>
  );
}

/* -------------------------------- Invoice Status -------------------------------- */

function invoiceBadgeVariant(status: string) {
  switch (status) {
    case "Paid":
      return "success" as const;
    case "Pending":
      return "warning" as const;
    case "Partially Paid":
      return "warning" as const;
    default:
      return "destructive" as const;
  }
}

export function InvoiceWidget({ patient }: { patient: Patient }) {
  const [reminderSent, setReminderSent] = React.useState(false);

  const totalBilled = patient.invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const amountPaid = patient.invoices.reduce((sum, inv) => {
    if (inv.status === "Paid") return sum + inv.amount;
    if (inv.status === "Partially Paid") return sum + (inv.amountPaid ?? 0);
    return sum;
  }, 0);
  const amountDue = totalBilled - amountPaid;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-muted/50 p-2.5 text-center">
          <p className="text-[11px] text-muted-foreground">Total Billed</p>
          <p className="mt-0.5 text-sm font-semibold">₹{totalBilled.toLocaleString("en-IN")}</p>
        </div>
        <div className="rounded-lg bg-success/10 p-2.5 text-center">
          <p className="text-[11px] text-muted-foreground">Amount Paid</p>
          <p className="mt-0.5 text-sm font-semibold text-success">₹{amountPaid.toLocaleString("en-IN")}</p>
        </div>
        <div className={cn("rounded-lg p-2.5 text-center", amountDue > 0 ? "bg-destructive/10" : "bg-success/10")}>
          <p className="text-[11px] text-muted-foreground">Amount Due</p>
          <p className={cn("mt-0.5 text-sm font-semibold", amountDue > 0 ? "text-destructive" : "text-success")}>
            ₹{amountDue.toLocaleString("en-IN")}
          </p>
        </div>
      </div>
      {patient.invoices.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">No invoices on record.</p>
      ) : (
        <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
          {patient.invoices.map((inv) => (
            <div key={inv.id} className="flex items-center justify-between rounded-lg border border-border p-2.5">
              <div>
                <p className="text-sm font-medium">{inv.description}</p>
                <p className="text-xs text-muted-foreground">
                  {inv.date} · ₹{inv.amount.toLocaleString("en-IN")}
                  {inv.status === "Partially Paid" && inv.amountPaid !== undefined && (
                    <> · ₹{inv.amountPaid.toLocaleString("en-IN")} paid</>
                  )}
                </p>
              </div>
              <Badge variant={invoiceBadgeVariant(inv.status)}>{inv.status}</Badge>
            </div>
          ))}
        </div>
      )}
      {amountDue > 0 && (
        <Button
          size="sm"
          variant={reminderSent ? "outline" : "secondary"}
          className="w-full"
          disabled={reminderSent}
          onClick={() => setReminderSent(true)}
        >
          <Send className="h-3.5 w-3.5" /> {reminderSent ? "Reminder Sent via WhatsApp" : "Send Payment Reminder"}
        </Button>
      )}
    </div>
  );
}

/* -------------------------------- Follow-up History -------------------------------- */

const channelIcon: Record<string, React.ElementType> = {
  WhatsApp: MessageCircle,
  Call: PhoneCall,
  "In-Clinic": Building2,
};

function followUpBadgeVariant(outcome: string) {
  switch (outcome) {
    case "Resolved":
      return "success" as const;
    case "Scheduled Visit":
      return "outline" as const;
    default:
      return "warning" as const;
  }
}

export function FollowUpWidget({ patient }: { patient: Patient }) {
  if (patient.followUps.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">No follow-up interactions logged.</p>;
  }

  return (
    <div className="space-y-2">
      {patient.followUps
        .slice()
        .sort((a, b) => b.date.localeCompare(a.date))
        .map((f) => {
          const Icon = channelIcon[f.channel] ?? Clock;
          return (
            <div key={f.id} className="flex items-start gap-3 rounded-lg border border-border p-2.5">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{f.channel}</p>
                  <Badge variant={followUpBadgeVariant(f.outcome)}>{f.outcome}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{f.summary}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{f.date}</p>
              </div>
            </div>
          );
        })}
    </div>
  );
}
