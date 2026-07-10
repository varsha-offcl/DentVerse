// Widget registry for the customizable Patient Workspace layout.
// Order + size are global and shared across every patient — doctors customize once and it sticks everywhere.

export type WidgetId =
  | "whatsapp"
  | "summary"
  | "appointment"
  | "appointmentHistory"
  | "medicalHistory"
  | "treatmentTimeline"
  | "patientChart"
  | "clinicalImages"
  | "reports"
  | "prescription"
  | "treatmentPlan"
  | "invoice"
  | "followUp";

export type WidgetSpan = 1 | 2;

export interface WidgetDef {
  id: WidgetId;
  title: string;
  span: WidgetSpan;
}

export interface WidgetLayoutItem {
  id: WidgetId;
  span: WidgetSpan;
}

export const WIDGET_DEFS: WidgetDef[] = [
  { id: "whatsapp", title: "WhatsApp Conversation", span: 2 },
  { id: "summary", title: "Patient Summary", span: 2 },
  { id: "appointment", title: "Appointment Details", span: 1 },
  { id: "appointmentHistory", title: "Appointment History", span: 1 },
  { id: "medicalHistory", title: "Medical History", span: 1 },
  { id: "treatmentTimeline", title: "Treatment Timeline", span: 2 },
  { id: "patientChart", title: "Patient Chart", span: 2 },
  { id: "clinicalImages", title: "Clinical Images & X-Rays", span: 2 },
  { id: "reports", title: "Reports", span: 1 },
  { id: "prescription", title: "Prescription", span: 1 },
  { id: "treatmentPlan", title: "Treatment Plan", span: 1 },
  { id: "invoice", title: "Invoice Status", span: 1 },
  { id: "followUp", title: "Follow-up History", span: 1 },
];

export const WIDGET_TITLES: Record<WidgetId, string> = WIDGET_DEFS.reduce(
  (acc, w) => ({ ...acc, [w.id]: w.title }),
  {} as Record<WidgetId, string>
);

export const DEFAULT_WIDGET_LAYOUT: WidgetLayoutItem[] = WIDGET_DEFS.map((w) => ({ id: w.id, span: w.span }));

export const WIDGET_LAYOUT_STORAGE_KEY = "dentverse.workspaceLayout.v2";

export function loadStoredWidgetLayout(): WidgetLayoutItem[] {
  if (typeof window === "undefined") return DEFAULT_WIDGET_LAYOUT;
  try {
    const raw = window.localStorage.getItem(WIDGET_LAYOUT_STORAGE_KEY);
    if (!raw) return DEFAULT_WIDGET_LAYOUT;
    const parsed = JSON.parse(raw) as WidgetLayoutItem[];
    const knownIds = new Set(DEFAULT_WIDGET_LAYOUT.map((w) => w.id));
    const valid = parsed.filter(
      (item): item is WidgetLayoutItem =>
        !!item && knownIds.has(item.id) && (item.span === 1 || item.span === 2)
    );
    const presentIds = new Set(valid.map((v) => v.id));
    const missing = DEFAULT_WIDGET_LAYOUT.filter((w) => !presentIds.has(w.id));
    return [...valid, ...missing];
  } catch {
    return DEFAULT_WIDGET_LAYOUT;
  }
}
