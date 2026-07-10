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
} from "lucide-react";
import { useAppState } from "@/context/AppStateContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import WidgetShell from "@/components/workspace/WidgetShell";
import WidgetGrid from "@/components/workspace/WidgetGrid";
import {
  WhatsAppWidget,
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
  whatsapp: MessagesSquare,
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
  whatsapp: WhatsAppWidget,
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
  whatsapp: "WhatsApp Conversation",
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
        <Button variant="outline" size="sm">
          <Phone className="h-4 w-4" /> {patient.phone}
        </Button>
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
                icon={<Icon className="h-4 w-4 text-primary" />}
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
    </div>
  );
}
