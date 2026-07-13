import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Phone,
  ArrowLeft,
  LayoutGrid,
  Save,
  RotateCcw,
  X,
  User,
  CalendarClock,
  History,
  HeartPulse,
  Route,
  FileText,
  Images,
  FileStack,
  Pill,
  ClipboardList,
  IndianRupee,
  MessagesSquare,
  MessageCircle,
  Bot,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { useAppState } from "@/context/AppStateContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import WidgetShell from "@/components/workspace/WidgetShell";
import WidgetGrid from "@/components/workspace/WidgetGrid";
import {
  PatientSummaryWidget,
  AppointmentWidget,
  AppointmentHistoryWidget,
  MedicalHistoryWidget,
  TreatmentTimelineWidget,
  PatientChartWidget,
  ClinicalImagesWidget,
  ReportsWidget,
  PrescriptionWidget,
  TreatmentPlanWidget,
  InvoiceWidget,
  FollowUpWidget,
} from "@/components/workspace/PatientWidgets";
import { type WidgetId, type WidgetLayoutItem } from "@/data/widgets";
import type { Patient } from "@/data/mockData";
import { cn } from "@/lib/utils";

const WIDGET_ICONS: Record<WidgetId, React.ElementType> = {
  summary: User,
  appointment: CalendarClock,
  appointmentHistory: History,
  medicalHistory: HeartPulse,
  treatmentTimeline: Route,
  patientChart: FileText,
  clinicalImages: Images,
  reports: FileStack,
  prescription: Pill,
  treatmentPlan: ClipboardList,
  invoice: IndianRupee,
  followUp: MessagesSquare,
};

const WIDGET_COMPONENTS: Record<WidgetId, React.ComponentType<{ patient: Patient }>> = {
  summary: PatientSummaryWidget,
  appointment: AppointmentWidget,
  appointmentHistory: AppointmentHistoryWidget,
  medicalHistory: MedicalHistoryWidget,
  treatmentTimeline: TreatmentTimelineWidget,
  patientChart: PatientChartWidget,
  clinicalImages: ClinicalImagesWidget,
  reports: ReportsWidget,
  prescription: PrescriptionWidget,
  treatmentPlan: TreatmentPlanWidget,
  invoice: InvoiceWidget,
  followUp: FollowUpWidget,
};

const WIDGET_TITLE: Record<WidgetId, string> = {
  summary: "Patient Summary",
  appointment: "Appointment Details",
  appointmentHistory: "Appointment History",
  medicalHistory: "Medical History",
  treatmentTimeline: "Treatment Timeline",
  patientChart: "Patient Chart",
  clinicalImages: "Clinical Images & X-Rays",
  reports: "Reports",
  prescription: "Prescription",
  treatmentPlan: "Treatment Plan",
  invoice: "Invoice Status",
  followUp: "Follow-up History",
};

export default function PatientWorkspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { patients, widgetLayout, saveWidgetLayout, resetWidgetLayout, toggleWidgetSpan } = useAppState();
  const patient = patients.find((p) => p.id === id);

  const [editMode, setEditMode] = React.useState(false);
  const [draftLayout, setDraftLayout] = React.useState<WidgetLayoutItem[]>(widgetLayout);
  const [savedFlash, setSavedFlash] = React.useState(false);
  const [showConversation, setShowConversation] = React.useState(false);
  const [showRecordToast, setShowRecordToast] = React.useState(false);

  React.useEffect(() => {
    if (!editMode) setDraftLayout(widgetLayout);
  }, [widgetLayout, editMode]);

  if (!patient) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">Patient not found.</p>
        <Button className="mt-4" onClick={() => navigate("/dashboard/patients")}>Back to Patients</Button>
      </div>
    );
  }

  const enterEditMode = () => {
    setDraftLayout(widgetLayout);
    setEditMode(true);
  };

  const cancelEdit = () => {
    setDraftLayout(widgetLayout);
    setEditMode(false);
  };

  const handleSave = () => {
    saveWidgetLayout(draftLayout);
    setEditMode(false);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2500);
  };

  const handleReset = () => {
    resetWidgetLayout();
    setDraftLayout(widgetLayout);
  };

  const openCommunicationCenter = () => {
    setShowConversation(false);
    navigate(`/dashboard/communication?patient=${encodeURIComponent(patient.name)}`);
  };

  const handleSaveDetails = () => {
    setShowRecordToast(true);
    setTimeout(() => setShowRecordToast(false), 3000);
  };

  const layoutToRender = editMode ? draftLayout : widgetLayout;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        {editMode ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Drag to rearrange, resize with the width toggle — applies to every patient</span>
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <RotateCcw className="h-3.5 w-3.5" /> Reset to Default
            </Button>
            <Button variant="outline" size="sm" onClick={cancelEdit}>
              <X className="h-3.5 w-3.5" /> Cancel
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Save className="h-3.5 w-3.5" /> Save Layout
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {savedFlash && <span className="text-xs font-medium text-success">Layout saved ✓ applied to all patients</span>}
            <Button variant="outline" size="sm" onClick={enterEditMode}>
              <LayoutGrid className="h-3.5 w-3.5" /> Customize Layout
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{patient.name}</h1>
            {patient.tags.map((t) => (
              <Badge key={t} variant="secondary">{t}</Badge>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">Unified patient workspace — every module below is live and shared with the doctor dashboard.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowConversation(true)}>
            <MessageCircle className="h-4 w-4" /> View Conversation
          </Button>
          <Button variant="outline" size="sm">
            <Phone className="h-4 w-4" /> {patient.phone}
          </Button>
        </div>
      </div>

      <div className={cn(editMode && "rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-4")}>
        <WidgetGrid
          layout={layoutToRender}
          editMode={editMode}
          onReorder={setDraftLayout}
          renderWidget={(widgetId, span, dragState) => {
            const Component = WIDGET_COMPONENTS[widgetId];
            const Icon = WIDGET_ICONS[widgetId];
            return (
              <WidgetShell
                title={WIDGET_TITLE[widgetId]}
                icon={<Icon className="h-4 w-4 text-white" />}
                span={span}
                editMode={dragState.editMode}
                isDragging={dragState.isDragging}
                isDropTarget={dragState.isDropTarget}
                cardDragProps={dragState.cardDragProps}
                onToggleSpan={() => setDraftLayout((prev) => toggleWidgetSpan(prev, widgetId))}
              >
                <Component patient={patient} />
              </WidgetShell>
            );
          }}
        />
      </div>

      <div className="flex justify-center border-t border-border pt-6">
        <Button size="lg" onClick={handleSaveDetails}>
          <Save className="h-4 w-4" /> Save Details
        </Button>
      </div>

      {showRecordToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-success px-4 py-3 text-sm font-medium text-success-foreground shadow-lg animate-in fade-in-0 slide-in-from-bottom-2">
          <CheckCircle2 className="h-4 w-4" />
          Patient record updated successfully.
        </div>
      )}

      <Dialog open={showConversation} onOpenChange={setShowConversation}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-primary" /> WhatsApp Conversation — {patient.name}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[420px] space-y-3 overflow-y-auto rounded-lg bg-[#e5ded5] p-4">
            {patient.whatsappThread.map((msg) => (
              <div key={msg.id} className={cn("flex", msg.sender === "patient" ? "justify-start" : "justify-end")}>
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-3 py-2 text-sm shadow-sm",
                    msg.sender === "patient" ? "bg-white text-foreground" : "bg-[#d9fdd3] text-foreground"
                  )}
                >
                  {msg.sender === "ai" && (
                    <p className="mb-0.5 flex items-center gap-1 text-[10px] font-semibold text-primary">
                      <Bot className="h-3 w-3" /> AI Receptionist
                    </p>
                  )}
                  <p>{msg.text}</p>
                  <p className="mt-1 text-right text-[10px] text-muted-foreground">{msg.time}</p>
                </div>
              </div>
            ))}
            {patient.whatsappThread.length === 0 && (
              <p className="py-10 text-center text-sm text-muted-foreground">No conversation history yet.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConversation(false)}>
              Close
            </Button>
            <Button onClick={openCommunicationCenter}>
              <ExternalLink className="h-4 w-4" /> Open Communication Center
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
