import * as React from "react";
import {
  appointments as seedAppointments,
  notifications as seedNotifications,
  broadcasts as seedBroadcasts,
  patients as seedPatients,
  type Appointment,
  type NotificationItem,
  type BroadcastMessage,
  type Patient,
  type AppointmentStatus,
  type ChartNote,
  type Prescription,
  type TreatmentPlan,
  type PatientImage,
  type PatientReport,
  type Invoice,
} from "@/data/mockData";
import {
  type WidgetId,
  type WidgetLayoutItem,
  DEFAULT_WIDGET_LAYOUT,
  WIDGET_LAYOUT_STORAGE_KEY,
  loadStoredWidgetLayout,
} from "@/data/widgets";
import type { Role } from "@/data/roles";
import {
  rescheduleRequests as seedRescheduleRequests,
  cancellationRequests as seedCancellationRequests,
  type RescheduleRequest,
  type CancellationRequest,
} from "@/data/reception";
import { type Campaign, CAMPAIGNS_STORAGE_KEY, loadStoredCampaigns } from "@/data/campaigns";

export type Theme = "light" | "dark";

const THEME_STORAGE_KEY = "dentverse.theme";
const ROLE_STORAGE_KEY = "dentverse.role";

function loadStoredRole(): Role | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.sessionStorage.getItem(ROLE_STORAGE_KEY);
    if (stored === "doctor" || stored === "receptionist" || stored === "admin") return stored;
    return null;
  } catch {
    return null;
  }
}

function loadStoredTheme(): Theme {
  if (typeof window === "undefined") return "light";
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } catch {
    return "light";
  }
}

interface AppStateContextValue {
  loggedIn: boolean;
  role: Role | null;
  login: (role: Role) => void;
  logout: () => void;

  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;

  patients: Patient[];
  appointments: Appointment[];
  notifications: NotificationItem[];
  broadcasts: BroadcastMessage[];

  addPatient: (patient: Patient) => void;
  setAppointmentStatus: (id: string, status: AppointmentStatus) => void;
  setAppointmentCheckIn: (id: string, status: Appointment["checkInStatus"]) => void;

  rescheduleRequests: RescheduleRequest[];
  approveReschedule: (id: string) => void;
  denyReschedule: (id: string) => void;
  cancellationRequests: CancellationRequest[];
  approveCancellation: (id: string) => void;
  denyCancellation: (id: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  addBroadcast: (b: BroadcastMessage) => void;
  addChartNote: (patientId: string, note: ChartNote) => void;
  addPrescription: (patientId: string, rx: Prescription) => void;
  updatePrescription: (patientId: string, rxId: string, rx: Prescription) => void;
  addTreatmentPlan: (patientId: string, plan: TreatmentPlan) => void;
  updateTreatmentPlan: (patientId: string, planId: string, plan: TreatmentPlan) => void;
  addPatientImage: (patientId: string, image: PatientImage) => void;
  removePatientImage: (patientId: string, imageId: string) => void;
  addPatientReport: (patientId: string, report: PatientReport) => void;
  removePatientReport: (patientId: string, reportId: string) => void;
  addInvoice: (patientId: string, invoice: Invoice) => void;
  markInvoicePaid: (patientId: string, invoiceId: string) => void;

  widgetLayout: WidgetLayoutItem[];
  setWidgetLayout: (layout: WidgetLayoutItem[]) => void;
  saveWidgetLayout: (layout: WidgetLayoutItem[]) => void;
  resetWidgetLayout: () => void;
  toggleWidgetSpan: (layout: WidgetLayoutItem[], id: WidgetId) => WidgetLayoutItem[];

  campaigns: Campaign[];
  toggleCampaign: (id: string) => void;

  selectedPatientId: string | null;
  setSelectedPatientId: (id: string | null) => void;
}

const AppStateContext = React.createContext<AppStateContextValue | undefined>(undefined);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = React.useState<Role | null>(() => loadStoredRole());
  const [patients, setPatients] = React.useState<Patient[]>(seedPatients);
  const [appointments, setAppointments] = React.useState<Appointment[]>(seedAppointments);
  const [notifications, setNotifications] = React.useState<NotificationItem[]>(seedNotifications);
  const [broadcasts, setBroadcasts] = React.useState<BroadcastMessage[]>(seedBroadcasts);
  const [selectedPatientId, setSelectedPatientId] = React.useState<string | null>(null);
  const [widgetLayout, setWidgetLayout] = React.useState<WidgetLayoutItem[]>(() => loadStoredWidgetLayout());
  const [theme, setThemeState] = React.useState<Theme>(() => loadStoredTheme());
  const [rescheduleRequests, setRescheduleRequests] = React.useState<RescheduleRequest[]>(seedRescheduleRequests);
  const [cancellationRequests, setCancellationRequests] = React.useState<CancellationRequest[]>(seedCancellationRequests);
  const [campaigns, setCampaigns] = React.useState<Campaign[]>(() => loadStoredCampaigns());

  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const setTheme = (next: Theme) => {
    setThemeState(next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // ignore persistence errors in demo environment
    }
  };

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  const login = (nextRole: Role) => {
    setRole(nextRole);
    try {
      window.sessionStorage.setItem(ROLE_STORAGE_KEY, nextRole);
    } catch {
      // ignore persistence errors in demo environment
    }
  };

  const logout = () => {
    setRole(null);
    try {
      window.sessionStorage.removeItem(ROLE_STORAGE_KEY);
    } catch {
      // ignore persistence errors in demo environment
    }
  };

  const addPatient = (patient: Patient) => {
    setPatients((prev) => [patient, ...prev]);
  };

  const setAppointmentStatus = (id: string, status: AppointmentStatus) => {
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
  };

  const setAppointmentCheckIn = (id: string, status: Appointment["checkInStatus"]) => {
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, checkInStatus: status } : a)));
  };

  const approveReschedule = (id: string) => {
    setRescheduleRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "approved" } : r))
    );
    const req = rescheduleRequests.find((r) => r.id === id);
    if (req) {
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === req.appointmentId
            ? { ...a, date: req.requestedDate, time: req.requestedTime, status: "confirmed" }
            : a
        )
      );
    }
  };

  const denyReschedule = (id: string) => {
    setRescheduleRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "denied" } : r)));
  };

  const approveCancellation = (id: string) => {
    setCancellationRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "approved" } : r))
    );
    const req = cancellationRequests.find((r) => r.id === id);
    if (req) {
      setAppointments((prev) =>
        prev.map((a) => (a.id === req.appointmentId ? { ...a, status: "cancelled" } : a))
      );
    }
  };

  const denyCancellation = (id: string) => {
    setCancellationRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "denied" } : r)));
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const addBroadcast = (b: BroadcastMessage) => {
    setBroadcasts((prev) => [b, ...prev]);
  };

  const addChartNote = (patientId: string, note: ChartNote) => {
    setPatients((prev) =>
      prev.map((p) => (p.id === patientId ? { ...p, chartNotes: [note, ...p.chartNotes] } : p))
    );
  };

  const addPrescription = (patientId: string, rx: Prescription) => {
    setPatients((prev) =>
      prev.map((p) => (p.id === patientId ? { ...p, prescriptions: [rx, ...p.prescriptions] } : p))
    );
  };

  const updatePrescription = (patientId: string, rxId: string, rx: Prescription) => {
    setPatients((prev) =>
      prev.map((p) =>
        p.id === patientId
          ? { ...p, prescriptions: p.prescriptions.map((r) => (r.id === rxId ? rx : r)) }
          : p
      )
    );
  };

  const addTreatmentPlan = (patientId: string, plan: TreatmentPlan) => {
    setPatients((prev) =>
      prev.map((p) => (p.id === patientId ? { ...p, treatmentPlans: [plan, ...p.treatmentPlans] } : p))
    );
  };

  const updateTreatmentPlan = (patientId: string, planId: string, plan: TreatmentPlan) => {
    setPatients((prev) =>
      prev.map((p) =>
        p.id === patientId
          ? { ...p, treatmentPlans: p.treatmentPlans.map((tp) => (tp.id === planId ? plan : tp)) }
          : p
      )
    );
  };

  const addPatientImage = (patientId: string, image: PatientImage) => {
    setPatients((prev) =>
      prev.map((p) => (p.id === patientId ? { ...p, images: [image, ...p.images] } : p))
    );
  };

  const removePatientImage = (patientId: string, imageId: string) => {
    setPatients((prev) =>
      prev.map((p) =>
        p.id === patientId ? { ...p, images: p.images.filter((img) => img.id !== imageId) } : p
      )
    );
  };

  const addPatientReport = (patientId: string, report: PatientReport) => {
    setPatients((prev) =>
      prev.map((p) => (p.id === patientId ? { ...p, reports: [report, ...p.reports] } : p))
    );
  };

  const removePatientReport = (patientId: string, reportId: string) => {
    setPatients((prev) =>
      prev.map((p) =>
        p.id === patientId ? { ...p, reports: p.reports.filter((r) => r.id !== reportId) } : p
      )
    );
  };

  const addInvoice = (patientId: string, invoice: Invoice) => {
    setPatients((prev) =>
      prev.map((p) =>
        p.id === patientId
          ? { ...p, invoices: [invoice, ...p.invoices], balanceDue: p.balanceDue + invoice.amount }
          : p
      )
    );
  };

  const markInvoicePaid = (patientId: string, invoiceId: string) => {
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id !== patientId) return p;
        let due = 0;
        const invoices = p.invoices.map((inv) => {
          if (inv.id !== invoiceId) return inv;
          const remaining = inv.amount - (inv.status === "Partially Paid" ? inv.amountPaid ?? 0 : 0);
          due = remaining;
          return { ...inv, status: "Paid" as const, amountPaid: undefined };
        });
        return { ...p, invoices, balanceDue: Math.max(0, p.balanceDue - due) };
      })
    );
  };

  const saveWidgetLayout = (layout: WidgetLayoutItem[]) => {
    setWidgetLayout(layout);
    try {
      window.localStorage.setItem(WIDGET_LAYOUT_STORAGE_KEY, JSON.stringify(layout));
    } catch {
      // ignore persistence errors in demo environment
    }
  };

  const resetWidgetLayout = () => {
    saveWidgetLayout(DEFAULT_WIDGET_LAYOUT);
  };

  const toggleWidgetSpan = (layout: WidgetLayoutItem[], id: WidgetId) =>
    layout.map((item) => (item.id === id ? { ...item, span: item.span === 1 ? 2 : 1 } as WidgetLayoutItem : item));

  const toggleCampaign = (id: string) => {
    setCampaigns((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c));
      try {
        const flags = Object.fromEntries(next.map((c) => [c.id, c.enabled]));
        window.localStorage.setItem(CAMPAIGNS_STORAGE_KEY, JSON.stringify(flags));
      } catch {
        // ignore persistence errors in demo environment
      }
      return next;
    });
  };

  const value: AppStateContextValue = {
    loggedIn: role !== null,
    role,
    login,
    logout,
    theme,
    setTheme,
    toggleTheme,
    patients,
    appointments,
    notifications,
    broadcasts,
    addPatient,
    setAppointmentStatus,
    setAppointmentCheckIn,
    rescheduleRequests,
    approveReschedule,
    denyReschedule,
    cancellationRequests,
    approveCancellation,
    denyCancellation,
    markNotificationRead,
    markAllNotificationsRead,
    addBroadcast,
    addChartNote,
    addPrescription,
    updatePrescription,
    addTreatmentPlan,
    updateTreatmentPlan,
    addPatientImage,
    removePatientImage,
    addPatientReport,
    removePatientReport,
    addInvoice,
    markInvoicePaid,
    widgetLayout,
    setWidgetLayout,
    saveWidgetLayout,
    resetWidgetLayout,
    toggleWidgetSpan,
    campaigns,
    toggleCampaign,
    selectedPatientId,
    setSelectedPatientId,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = React.useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}
