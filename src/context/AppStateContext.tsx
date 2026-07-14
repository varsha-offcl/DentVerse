import * as React from "react";
import {
  broadcasts as seedBroadcasts,
  type Appointment,
  type NotificationItem,
  type BroadcastMessage,
  type Patient,
  type AppointmentStatus,
  type ChartNote,
  type Prescription,
  type TreatmentPlan,
  type TreatmentPhase,
  type ImageCategory,
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
import { type RescheduleRequest, type CancellationRequest } from "@/data/reception";
import { type Campaign, CAMPAIGNS_STORAGE_KEY, loadStoredCampaigns } from "@/data/campaigns";
import { supabase } from "@/lib/supabase";
import { peekPendingClinicSetup, clearPendingClinicSetup } from "@/lib/pendingClinicSetup";
import { peekPendingStaffInvite, clearPendingStaffInvite } from "@/lib/pendingStaffInvite";
import { timeAgo } from "@/lib/utils";

export type Theme = "light" | "dark";

const THEME_STORAGE_KEY = "dentverse.theme";

export interface StaffProfile {
  id: string;
  tenantId: string;
  clinicName: string;
  clinicAddress: string;
  clinicPhone: string;
  aiBookingEnabled: boolean;
  aiRemindersEnabled: boolean;
  aiAutoEscalateEnabled: boolean;
  role: Role;
  name: string;
  firstName: string;
  title: string | null;
  email: string;
  avatarInitials: string;
}

const NAME_TITLES = /^(dr|mr|mrs|ms|prof)\.?$/i;

function computeInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

function computeFirstName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length > 1 && NAME_TITLES.test(parts[0])) return parts[1];
  return parts[0] ?? name;
}

async function fetchProfile(userId: string): Promise<StaffProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, tenant_id, role, name, title, email, avatar_initials, clinics ( name, address, phone, ai_booking_enabled, ai_reminders_enabled, ai_auto_escalate_enabled )"
    )
    .eq("id", userId)
    .single();
  if (error || !data) return null;
  const clinic = data.clinics as unknown as {
    name: string;
    address: string | null;
    phone: string | null;
    ai_booking_enabled: boolean;
    ai_reminders_enabled: boolean;
    ai_auto_escalate_enabled: boolean;
  } | null;
  return {
    id: data.id,
    tenantId: data.tenant_id,
    clinicName: clinic?.name ?? "",
    clinicAddress: clinic?.address ?? "",
    clinicPhone: clinic?.phone ?? "",
    aiBookingEnabled: clinic?.ai_booking_enabled ?? true,
    aiRemindersEnabled: clinic?.ai_reminders_enabled ?? true,
    aiAutoEscalateEnabled: clinic?.ai_auto_escalate_enabled ?? true,
    role: data.role as Role,
    name: data.name,
    firstName: computeFirstName(data.name),
    title: data.title,
    email: data.email,
    avatarInitials: data.avatar_initials || computeInitials(data.name),
  };
}

async function resolveProfileForSession(userId: string): Promise<StaffProfile | null> {
  let profile = await fetchProfile(userId);
  if (profile === null) {
    const pendingClinic = peekPendingClinicSetup();
    if (pendingClinic) {
      const { error } = await supabase.rpc("create_clinic_and_admin_profile", {
        clinic_name: pendingClinic.clinicName,
        admin_name: pendingClinic.adminName,
      });
      if (!error) {
        clearPendingClinicSetup();
        profile = await fetchProfile(userId);
      }
    }
  }
  if (profile === null) {
    const pendingInvite = peekPendingStaffInvite();
    if (pendingInvite) {
      const { error } = await supabase.rpc("accept_staff_invite", {
        p_token: pendingInvite.token,
        p_name: pendingInvite.name,
      });
      if (!error) {
        clearPendingStaffInvite();
        profile = await fetchProfile(userId);
      }
    }
  }
  return profile;
}

export interface NewPatientInput {
  name: string;
  phone: string;
  age: number;
  gender: "Male" | "Female";
  email: string;
  tags: string[];
}

export interface NewAppointmentInput {
  patientId: string;
  doctorId: string;
  date: string;
  time: string;
  duration: string;
  type: string;
  notes?: string;
}

export interface NewChartNoteInput {
  title: string;
  soap: { subjective: string; objective: string; assessment: string; plan: string };
  recordedVia: "Voice-to-Chart AI" | "Manual Entry";
}

export interface NewPrescriptionInput {
  medicines: { name: string; dosage: string; frequency: string; duration: string; instructions: string }[];
  notes: string;
  status: "Draft" | "Sent to Patient";
  signed: boolean;
  pdfStoragePath?: string;
  pdfSha256?: string;
}

export interface NewTreatmentPlanInput {
  title: string;
  totalCost: number;
  status: TreatmentPlan["status"];
  phases: { name: string; procedure: string; cost: number; status: TreatmentPhase["status"]; estDate: string }[];
}

export interface NewInvoiceInput {
  description: string;
  amount: number;
}

export interface InvoiceWithPatient extends Invoice {
  patientId: string;
  patientName: string;
  avatarInitials: string;
}

export interface StaffMember {
  id: string;
  name: string;
  title: string | null;
  email: string;
  role: Role;
  status: string;
  avatarInitials: string;
  memberSince: string;
}

export interface StaffInvite {
  id: string;
  name: string;
  email: string;
  role: Role;
  token: string;
  createdAt: string;
  expiresAt: string;
  accepted: boolean;
  revoked: boolean;
}

export interface NewStaffInviteInput {
  name: string;
  email: string;
  role: Role;
}

export interface AuditLogEntry {
  id: string;
  actor: string;
  action: string;
  target: string | null;
  timestamp: string;
}

export interface SystemLogEntry {
  id: string;
  level: "info" | "warning" | "error";
  message: string;
  source: string;
  timestamp: string;
}

export interface ClinicSettingsInput {
  name: string;
  address: string;
  phone: string;
  aiBookingEnabled: boolean;
  aiRemindersEnabled: boolean;
  aiAutoEscalateEnabled: boolean;
}

function emptyPatientRelations() {
  return {
    whatsappThread: [],
    chartNotes: [],
    prescriptions: [],
    treatmentPlans: [],
    followUps: [],
    images: [],
    reports: [],
    invoices: [],
  };
}

function mapPatientRow(row: any): Patient {
  return {
    id: row.id,
    patientNumber: row.patient_number ?? undefined,
    name: row.name,
    avatarInitials: computeInitials(row.name),
    phone: row.phone,
    age: row.age ?? 0,
    gender: (row.gender as "Male" | "Female") ?? "Female",
    email: row.email ?? "—",
    tags: row.tags ?? [],
    allergies: row.allergies ?? [],
    lastVisit: "—",
    nextVisit: undefined,
    balanceDue: 0,
    memberSince: (row.created_at as string).slice(0, 10),
    medicalHistory: row.medical_history ?? { conditions: [], medications: [], notes: "" },
    ...emptyPatientRelations(),
  };
}

function mapAppointmentRow(row: any): Appointment {
  const patientName = row.patients?.name ?? "";
  return {
    id: row.id,
    patientId: row.patient_id,
    patientName,
    avatarInitials: computeInitials(patientName || "?"),
    date: row.date,
    time: row.time,
    duration: row.duration ?? "",
    type: row.type,
    status: row.status,
    source: row.source,
    notes: row.notes ?? undefined,
    requestedAt: row.requested_at ? timeAgo(row.requested_at) : undefined,
    doctorId: row.doctor_id ?? undefined,
    doctorName: row.profiles?.name ?? undefined,
    checkInStatus: row.check_in_status ?? undefined,
  };
}

function mapRescheduleRow(row: any): RescheduleRequest {
  const patientName = row.patients?.name ?? "";
  return {
    id: row.id,
    patientId: row.patient_id,
    patientName,
    avatarInitials: computeInitials(patientName || "?"),
    appointmentId: row.appointment_id,
    currentDate: row.current_date_snapshot,
    currentTime: row.current_time_snapshot,
    requestedDate: row.requested_date,
    requestedTime: row.requested_time,
    reason: row.reason ?? "",
    requestedAt: timeAgo(row.requested_at),
    status: row.status,
  };
}

function mapCancellationRow(row: any): CancellationRequest {
  const patientName = row.patients?.name ?? "";
  return {
    id: row.id,
    patientId: row.patient_id,
    patientName,
    avatarInitials: computeInitials(patientName || "?"),
    appointmentId: row.appointment_id,
    date: row.appointments?.date ?? "",
    time: row.appointments?.time ?? "",
    type: row.appointments?.type ?? "",
    reason: row.reason ?? "",
    requestedAt: timeAgo(row.requested_at),
    status: row.status,
  };
}

function mapChartNoteRow(row: any): ChartNote {
  return {
    id: row.id,
    date: row.date,
    title: row.title,
    soap: row.soap ?? { subjective: "", objective: "", assessment: "", plan: "" },
    recordedVia: row.recorded_via,
  };
}

function mapPrescriptionRow(row: any): Prescription {
  return {
    id: row.id,
    date: row.date,
    medicines: row.medicines ?? [],
    notes: row.notes ?? "",
    status: row.status,
    signed: row.signed ?? false,
  };
}

function mapTreatmentPlanRow(row: any): TreatmentPlan {
  const phaseRows = (row.treatment_plan_phases ?? []) as any[];
  return {
    id: row.id,
    title: row.title,
    createdOn: row.created_on,
    totalCost: Number(row.total_cost) || 0,
    status: row.status,
    phases: phaseRows.map((ph) => ({
      id: ph.id,
      name: ph.name,
      procedure: ph.procedure,
      cost: Number(ph.cost) || 0,
      status: ph.status,
      estDate: ph.est_date,
    })),
  };
}

function mapPatientImageRow(row: any, url: string): PatientImage {
  return {
    id: row.id,
    url,
    category: row.category as ImageCategory,
    label: row.label,
    uploadedAt: (row.uploaded_at as string).slice(0, 10),
  };
}

function mapPatientReportRow(row: any, url: string): PatientReport {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    uploadedAt: (row.uploaded_at as string).slice(0, 10),
    url,
  };
}

function mapInvoiceRow(row: any): InvoiceWithPatient {
  return {
    id: row.id,
    patientId: row.patient_id,
    patientName: row.patients?.name ?? "",
    avatarInitials: computeInitials(row.patients?.name || "?"),
    date: row.date,
    description: row.description,
    amount: Number(row.amount) || 0,
    amountPaid: row.amount_paid === null || row.amount_paid === undefined ? undefined : Number(row.amount_paid),
    status: row.status,
  };
}

function mapNotificationRow(row: any): NotificationItem {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    time: timeAgo(row.created_at),
    read: row.read,
  };
}

function mapStaffMemberRow(row: any): StaffMember {
  return {
    id: row.id,
    name: row.name,
    title: row.title,
    email: row.email,
    role: row.role as Role,
    status: row.status,
    avatarInitials: row.avatar_initials || computeInitials(row.name),
    memberSince: (row.created_at as string).slice(0, 10),
  };
}

function mapStaffInviteRow(row: any): StaffInvite {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role as Role,
    token: row.token,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    accepted: !!row.accepted_at,
    revoked: row.revoked,
  };
}

function mapAuditLogRow(row: any): AuditLogEntry {
  return {
    id: row.id,
    actor: row.actor_name,
    action: row.action,
    target: row.target,
    timestamp: timeAgo(row.created_at),
  };
}

function mapSystemLogRow(row: any): SystemLogEntry {
  return {
    id: row.id,
    level: row.level,
    message: row.message,
    source: row.source,
    timestamp: timeAgo(row.created_at),
  };
}

// Derived, not stored: a patient's balance due and invoice list come
// from the tenant-wide invoices list, so BillingPayments (needs every
// invoice across the whole clinic) and each Patient Workspace's Invoice
// widget (needs just that patient's slice) always agree with each other.
function withDerivedBalanceAndInvoices(patients: Patient[], invoices: InvoiceWithPatient[]): Patient[] {
  return patients.map((p) => {
    const own = invoices.filter((inv) => inv.patientId === p.id);
    const balanceDue = own.reduce((sum, inv) => {
      if (inv.status === "Paid") return sum;
      if (inv.status === "Partially Paid") return sum + (inv.amount - (inv.amountPaid ?? 0));
      return sum + inv.amount;
    }, 0);
    const plainInvoices: Invoice[] = own.map(({ patientId: _pid, patientName: _pn, avatarInitials: _ai, ...inv }) => inv);
    return { ...p, balanceDue, invoices: plainInvoices };
  });
}

// Derived, not stored: a patient's last/next visit come from their real
// appointment history so they can never drift out of sync with it.
function withDerivedVisitDates(patients: Patient[], appointments: Appointment[]): Patient[] {
  const today = new Date().toISOString().slice(0, 10);
  return patients.map((p) => {
    const own = appointments.filter((a) => a.patientId === p.id);
    const past = own
      .filter((a) => a.status === "completed" && a.date <= today)
      .sort((a, b) => b.date.localeCompare(a.date));
    const upcoming = own
      .filter((a) => a.status === "confirmed" && a.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date));
    return { ...p, lastVisit: past[0]?.date ?? "—", nextVisit: upcoming[0]?.date };
  });
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
  authLoading: boolean;
  role: Role | null;
  profile: StaffProfile | null;
  logout: () => void;

  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;

  patients: Patient[];
  appointments: Appointment[];
  notifications: NotificationItem[];
  broadcasts: BroadcastMessage[];

  addPatient: (patient: NewPatientInput) => Promise<Patient>;
  addAppointment: (appointment: NewAppointmentInput) => Promise<Appointment>;
  setAppointmentStatus: (id: string, status: AppointmentStatus) => Promise<void>;
  setAppointmentCheckIn: (id: string, status: Appointment["checkInStatus"]) => Promise<void>;

  rescheduleRequests: RescheduleRequest[];
  approveReschedule: (id: string) => Promise<void>;
  denyReschedule: (id: string) => Promise<void>;
  // Staff acting directly (phone call, walk-in) — creates the request and
  // approves it in the same action, still leaving an audit record. AI
  // (Milestone 5) will instead leave a request pending for the exception
  // cases and call approveReschedule/approveCancellation separately.
  rescheduleAppointment: (appointmentId: string, requestedDate: string, requestedTime: string, reason: string) => Promise<void>;
  cancellationRequests: CancellationRequest[];
  approveCancellation: (id: string) => Promise<void>;
  denyCancellation: (id: string) => Promise<void>;
  cancelAppointment: (appointmentId: string, reason: string) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  addBroadcast: (b: BroadcastMessage) => void;

  // Staff directory, invites, and audit/system logs are admin-facing and
  // loaded lazily (like clinical data), not eagerly at login.
  staffMembers: StaffMember[];
  staffInvites: StaffInvite[];
  loadStaffDirectory: () => Promise<void>;
  inviteStaffMember: (draft: NewStaffInviteInput) => Promise<StaffInvite>;
  revokeStaffInvite: (id: string) => Promise<void>;
  updateStaffStatus: (id: string, status: string) => Promise<void>;

  auditLogs: AuditLogEntry[];
  systemLogs: SystemLogEntry[];
  loadAdminLogs: () => Promise<void>;

  updateClinicSettings: (input: ClinicSettingsInput) => Promise<void>;

  // Chart notes, prescriptions, treatment plans, images, and reports are
  // loaded lazily, per patient, when their Patient Workspace is opened —
  // not eagerly at login like patients/appointments/invoices, since a
  // clinic's full clinical history could be large. See loadPracticeData
  // vs. loadPatientClinicalData.
  loadPatientClinicalData: (patientId: string) => Promise<void>;
  addChartNote: (patientId: string, note: NewChartNoteInput) => Promise<ChartNote>;
  addPrescription: (patientId: string, rx: NewPrescriptionInput) => Promise<Prescription>;
  updatePrescription: (patientId: string, rxId: string, patch: NewPrescriptionInput) => Promise<Prescription>;
  addTreatmentPlan: (patientId: string, plan: NewTreatmentPlanInput) => Promise<TreatmentPlan>;
  updateTreatmentPlan: (patientId: string, planId: string, patch: NewTreatmentPlanInput) => Promise<TreatmentPlan>;
  updateTreatmentPlanStatus: (patientId: string, planId: string, status: TreatmentPlan["status"]) => Promise<void>;
  addPatientImage: (patientId: string, file: File, category: ImageCategory) => Promise<PatientImage>;
  removePatientImage: (patientId: string, imageId: string) => Promise<void>;
  addPatientReport: (patientId: string, file: File) => Promise<PatientReport>;
  removePatientReport: (patientId: string, reportId: string) => Promise<void>;

  invoices: InvoiceWithPatient[];
  addInvoice: (patientId: string, invoice: NewInvoiceInput) => Promise<Invoice>;
  markInvoicePaid: (patientId: string, invoiceId: string) => Promise<void>;

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
  const [profile, setProfile] = React.useState<StaffProfile | null>(null);
  const [authLoading, setAuthLoading] = React.useState(true);
  const role = profile?.role ?? null;
  const [patients, setPatients] = React.useState<Patient[]>([]);
  const [appointments, setAppointments] = React.useState<Appointment[]>([]);
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);
  const [broadcasts, setBroadcasts] = React.useState<BroadcastMessage[]>(seedBroadcasts);
  const [staffMembers, setStaffMembers] = React.useState<StaffMember[]>([]);
  const [staffInvites, setStaffInvites] = React.useState<StaffInvite[]>([]);
  const [auditLogs, setAuditLogs] = React.useState<AuditLogEntry[]>([]);
  const [systemLogs, setSystemLogs] = React.useState<SystemLogEntry[]>([]);
  const [selectedPatientId, setSelectedPatientId] = React.useState<string | null>(null);
  const [widgetLayout, setWidgetLayout] = React.useState<WidgetLayoutItem[]>(() => loadStoredWidgetLayout());
  const [theme, setThemeState] = React.useState<Theme>(() => loadStoredTheme());
  const [rescheduleRequests, setRescheduleRequests] = React.useState<RescheduleRequest[]>([]);
  const [cancellationRequests, setCancellationRequests] = React.useState<CancellationRequest[]>([]);
  const [invoices, setInvoices] = React.useState<InvoiceWithPatient[]>([]);
  const [campaigns, setCampaigns] = React.useState<Campaign[]>(() => loadStoredCampaigns());

  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  React.useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const nextProfile = session?.user ? await resolveProfileForSession(session.user.id) : null;
      if (!active) return;
      setProfile(nextProfile);
      setAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const nextProfile = session?.user ? await resolveProfileForSession(session.user.id) : null;
      if (!active) return;
      setProfile(nextProfile);
      setAuthLoading(false);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const loadPracticeData = React.useCallback(async (tenantId: string) => {
    const [patientsRes, appointmentsRes, rescheduleRes, cancellationRes, invoicesRes, notificationsRes] = await Promise.all([
      supabase.from("patients").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false }),
      supabase
        .from("appointments")
        .select("*, patients ( name ), profiles ( name )")
        .eq("tenant_id", tenantId)
        .order("date", { ascending: true }),
      supabase
        .from("reschedule_requests")
        .select("*, patients ( name )")
        .eq("tenant_id", tenantId)
        .order("requested_at", { ascending: false }),
      supabase
        .from("cancellation_requests")
        .select("*, patients ( name ), appointments ( date, time, type )")
        .eq("tenant_id", tenantId)
        .order("requested_at", { ascending: false }),
      supabase
        .from("invoices")
        .select("*, patients ( name )")
        .eq("tenant_id", tenantId)
        .order("date", { ascending: false }),
      supabase
        .from("notifications")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false }),
    ]);

    const mappedAppointments = (appointmentsRes.data ?? []).map(mapAppointmentRow);
    const mappedInvoices = (invoicesRes.data ?? []).map(mapInvoiceRow);
    let mappedPatients = withDerivedVisitDates((patientsRes.data ?? []).map(mapPatientRow), mappedAppointments);
    mappedPatients = withDerivedBalanceAndInvoices(mappedPatients, mappedInvoices);

    setPatients(mappedPatients);
    setAppointments(mappedAppointments);
    setRescheduleRequests((rescheduleRes.data ?? []).map(mapRescheduleRow));
    setCancellationRequests((cancellationRes.data ?? []).map(mapCancellationRow));
    setInvoices(mappedInvoices);
    setNotifications((notificationsRes.data ?? []).map(mapNotificationRow));
  }, []);

  // Staff directory, invites, and audit/system logs are admin-facing and
  // loaded lazily when Staff Management / Logs pages open, not eagerly
  // at login — matching the clinical-data lazy-load pattern.
  const loadStaffDirectory = React.useCallback(async () => {
    if (!profile) return;
    const [staffRes, invitesRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("tenant_id", profile.tenantId).order("created_at", { ascending: true }),
      profile.role === "admin"
        ? supabase
            .from("staff_invites")
            .select("*")
            .eq("tenant_id", profile.tenantId)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [] as any[] }),
    ]);
    setStaffMembers((staffRes.data ?? []).map(mapStaffMemberRow));
    setStaffInvites((invitesRes.data ?? []).map(mapStaffInviteRow));
  }, [profile]);

  const inviteStaffMember = async (draft: NewStaffInviteInput): Promise<StaffInvite> => {
    if (!profile) throw new Error("Not signed in");
    const { data, error } = await supabase
      .from("staff_invites")
      .insert({
        tenant_id: profile.tenantId,
        email: draft.email,
        role: draft.role,
        name: draft.name,
        invited_by: profile.id,
      })
      .select()
      .single();
    if (error) throw error;
    const invite = mapStaffInviteRow(data);
    setStaffInvites((prev) => [invite, ...prev]);
    return invite;
  };

  const revokeStaffInvite = async (id: string) => {
    const { error } = await supabase.from("staff_invites").update({ revoked: true }).eq("id", id);
    if (error) throw error;
    setStaffInvites((prev) => prev.map((i) => (i.id === id ? { ...i, revoked: true } : i)));
  };

  const updateStaffStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("profiles").update({ status }).eq("id", id);
    if (error) throw error;
    setStaffMembers((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
  };

  const loadAdminLogs = React.useCallback(async () => {
    if (!profile) return;
    const [auditRes, systemRes] = await Promise.all([
      supabase
        .from("audit_logs")
        .select("*")
        .eq("tenant_id", profile.tenantId)
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("system_logs")
        .select("*")
        .eq("tenant_id", profile.tenantId)
        .order("created_at", { ascending: false })
        .limit(100),
    ]);
    setAuditLogs((auditRes.data ?? []).map(mapAuditLogRow));
    setSystemLogs((systemRes.data ?? []).map(mapSystemLogRow));
  }, [profile]);

  const updateClinicSettings = async (input: ClinicSettingsInput) => {
    if (!profile) throw new Error("Not signed in");
    const { error } = await supabase
      .from("clinics")
      .update({
        name: input.name,
        address: input.address,
        phone: input.phone,
        ai_booking_enabled: input.aiBookingEnabled,
        ai_reminders_enabled: input.aiRemindersEnabled,
        ai_auto_escalate_enabled: input.aiAutoEscalateEnabled,
      })
      .eq("id", profile.tenantId);
    if (error) throw error;
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            clinicName: input.name,
            clinicAddress: input.address,
            clinicPhone: input.phone,
            aiBookingEnabled: input.aiBookingEnabled,
            aiRemindersEnabled: input.aiRemindersEnabled,
            aiAutoEscalateEnabled: input.aiAutoEscalateEnabled,
          }
        : prev
    );
  };

  // Chart notes, prescriptions, treatment plans (+ phases), images, and
  // reports for one patient — fetched on demand when their Patient
  // Workspace opens, not eagerly for the whole clinic at login.
  const loadPatientClinicalData = React.useCallback(async (patientId: string) => {
    const [chartRes, rxRes, planRes, imagesRes, reportsRes] = await Promise.all([
      supabase.from("chart_notes").select("*").eq("patient_id", patientId).order("date", { ascending: false }),
      supabase.from("prescriptions").select("*").eq("patient_id", patientId).order("date", { ascending: false }),
      supabase
        .from("treatment_plans")
        .select("*, treatment_plan_phases ( * )")
        .eq("patient_id", patientId)
        .order("created_on", { ascending: false }),
      supabase.from("patient_images").select("*").eq("patient_id", patientId).order("uploaded_at", { ascending: false }),
      supabase.from("patient_reports").select("*").eq("patient_id", patientId).order("uploaded_at", { ascending: false }),
    ]);

    const imageRows = imagesRes.data ?? [];
    const reportRows = reportsRes.data ?? [];
    const [imageUrls, reportUrls] = await Promise.all([
      imageRows.length
        ? supabase.storage.from("patient-images").createSignedUrls(imageRows.map((r) => r.storage_path), 3600)
        : Promise.resolve({ data: [] as { signedUrl: string }[] }),
      reportRows.length
        ? supabase.storage.from("patient-reports").createSignedUrls(reportRows.map((r) => r.storage_path), 3600)
        : Promise.resolve({ data: [] as { signedUrl: string }[] }),
    ]);

    const images = imageRows.map((row, i) => mapPatientImageRow(row, imageUrls.data?.[i]?.signedUrl ?? ""));
    const reports = reportRows.map((row, i) => mapPatientReportRow(row, reportUrls.data?.[i]?.signedUrl ?? ""));

    setPatients((prev) =>
      prev.map((p) =>
        p.id === patientId
          ? {
              ...p,
              chartNotes: (chartRes.data ?? []).map(mapChartNoteRow),
              prescriptions: (rxRes.data ?? []).map(mapPrescriptionRow),
              treatmentPlans: (planRes.data ?? []).map(mapTreatmentPlanRow),
              images,
              reports,
            }
          : p
      )
    );
  }, []);

  const tenantId = profile?.tenantId;
  React.useEffect(() => {
    if (!tenantId) {
      setPatients([]);
      setAppointments([]);
      setRescheduleRequests([]);
      setCancellationRequests([]);
      setInvoices([]);
      return;
    }
    void loadPracticeData(tenantId);
    // Depend on tenantId (a stable primitive), not the profile object —
    // `onAuthStateChange` fires a fresh profile object on every token
    // refresh / tab-focus revalidation even when nothing changed, and
    // re-running loadPracticeData would wipe out clinical data that
    // loadPatientClinicalData lazily merged onto `patients` in the meantime.
  }, [tenantId, loadPracticeData]);

  const setTheme = (next: Theme) => {
    setThemeState(next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // ignore persistence errors in demo environment
    }
  };

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  const logout = () => {
    void supabase.auth.signOut();
  };

  const addPatient = async (draft: NewPatientInput): Promise<Patient> => {
    if (!profile) throw new Error("Not signed in");
    const { data, error } = await supabase
      .from("patients")
      .insert({
        tenant_id: profile.tenantId,
        name: draft.name,
        phone: draft.phone,
        age: draft.age,
        gender: draft.gender,
        email: draft.email,
        tags: draft.tags,
      })
      .select()
      .single();
    if (error) throw error;
    const patient = mapPatientRow(data);
    setPatients((prev) => [patient, ...prev]);
    return patient;
  };

  const addAppointment = async (draft: NewAppointmentInput): Promise<Appointment> => {
    if (!profile) throw new Error("Not signed in");
    const { data, error } = await supabase
      .from("appointments")
      .insert({
        tenant_id: profile.tenantId,
        patient_id: draft.patientId,
        doctor_id: draft.doctorId,
        date: draft.date,
        time: draft.time,
        duration: draft.duration,
        type: draft.type,
        notes: draft.notes || null,
        status: "confirmed",
        source: "Manual",
      })
      .select("*, patients ( name ), profiles ( name )")
      .single();
    if (error) throw error;
    const appointment = mapAppointmentRow(data);
    setAppointments((prev) => {
      const next = [...prev, appointment].sort((a, b) => a.date.localeCompare(b.date));
      setPatients((prevPatients) => withDerivedVisitDates(prevPatients, next));
      return next;
    });
    return appointment;
  };

  const setAppointmentStatus = async (id: string, status: AppointmentStatus) => {
    const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
    if (error) throw error;
    // Compute the next array via the functional form (never a stale read of
    // `appointments`), but call setPatients as a separate, sibling update
    // rather than nesting it inside setAppointments' updater — nesting one
    // setState call inside another's updater function is fragile to rely on.
    let nextAppointments: Appointment[] = [];
    setAppointments((prev) => {
      nextAppointments = prev.map((a) => (a.id === id ? { ...a, status } : a));
      return nextAppointments;
    });
    // Completing/cancelling an appointment can change a patient's derived
    // last/next visit, so recompute those from the fresh appointment list.
    setPatients((prevPatients) => withDerivedVisitDates(prevPatients, nextAppointments));
  };

  const setAppointmentCheckIn = async (id: string, status: Appointment["checkInStatus"]) => {
    // Checking a patient out is the real-world signal that the visit is
    // done — without also flipping `status` to "completed" here, an
    // appointment's status never reaches "completed" through any UI path,
    // and a patient's derived last-visit date can never populate.
    const completesVisit = status === "Checked Out";
    const patch: { check_in_status: Appointment["checkInStatus"] | null; status?: AppointmentStatus } = {
      check_in_status: status ?? null,
    };
    if (completesVisit) patch.status = "completed";

    const { error } = await supabase.from("appointments").update(patch).eq("id", id);
    if (error) throw error;

    let nextAppointments: Appointment[] = [];
    setAppointments((prev) => {
      nextAppointments = prev.map((a) =>
        a.id === id ? { ...a, checkInStatus: status, status: completesVisit ? ("completed" as const) : a.status } : a
      );
      return nextAppointments;
    });
    if (completesVisit) {
      setPatients((prevPatients) => withDerivedVisitDates(prevPatients, nextAppointments));
    }
  };

  const approveReschedule = async (id: string) => {
    const { error } = await supabase.rpc("approve_reschedule_request", { request_id: id });
    if (error) throw error;
    if (profile) await loadPracticeData(profile.tenantId);
  };

  const denyReschedule = async (id: string) => {
    const { error } = await supabase.from("reschedule_requests").update({ status: "denied" }).eq("id", id);
    if (error) throw error;
    setRescheduleRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "denied" } : r)));
  };

  const approveCancellation = async (id: string) => {
    const { error } = await supabase.rpc("approve_cancellation_request", { request_id: id });
    if (error) throw error;
    if (profile) await loadPracticeData(profile.tenantId);
  };

  const denyCancellation = async (id: string) => {
    const { error } = await supabase.from("cancellation_requests").update({ status: "denied" }).eq("id", id);
    if (error) throw error;
    setCancellationRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "denied" } : r)));
  };

  const rescheduleAppointment = async (
    appointmentId: string,
    requestedDate: string,
    requestedTime: string,
    reason: string
  ) => {
    if (!profile) throw new Error("Not signed in");
    const appt = appointments.find((a) => a.id === appointmentId);
    if (!appt) throw new Error("Appointment not found");

    const { data, error: insertError } = await supabase
      .from("reschedule_requests")
      .insert({
        tenant_id: profile.tenantId,
        patient_id: appt.patientId,
        appointment_id: appointmentId,
        current_date_snapshot: appt.date,
        current_time_snapshot: appt.time,
        requested_date: requestedDate,
        requested_time: requestedTime,
        reason,
      })
      .select("id")
      .single();
    if (insertError) throw insertError;

    const { error: approveError } = await supabase.rpc("approve_reschedule_request", { request_id: data.id });
    if (approveError) throw approveError;

    await loadPracticeData(profile.tenantId);
  };

  const cancelAppointment = async (appointmentId: string, reason: string) => {
    if (!profile) throw new Error("Not signed in");
    const appt = appointments.find((a) => a.id === appointmentId);
    if (!appt) throw new Error("Appointment not found");

    const { data, error: insertError } = await supabase
      .from("cancellation_requests")
      .insert({
        tenant_id: profile.tenantId,
        patient_id: appt.patientId,
        appointment_id: appointmentId,
        reason,
      })
      .select("id")
      .single();
    if (insertError) throw insertError;

    const { error: approveError } = await supabase.rpc("approve_cancellation_request", { request_id: data.id });
    if (approveError) throw approveError;

    await loadPracticeData(profile.tenantId);
  };

  const markNotificationRead = async (id: string) => {
    const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id);
    if (error) throw error;
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    const { error } = await supabase.from("notifications").update({ read: true }).in("id", unreadIds);
    if (error) throw error;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const addBroadcast = (b: BroadcastMessage) => {
    setBroadcasts((prev) => [b, ...prev]);
  };

  const addChartNote = async (patientId: string, draft: NewChartNoteInput): Promise<ChartNote> => {
    if (!profile) throw new Error("Not signed in");
    const { data, error } = await supabase
      .from("chart_notes")
      .insert({
        tenant_id: profile.tenantId,
        patient_id: patientId,
        doctor_id: profile.role === "doctor" ? profile.id : null,
        date: new Date().toISOString().slice(0, 10),
        title: draft.title,
        soap: draft.soap,
        recorded_via: draft.recordedVia,
      })
      .select()
      .single();
    if (error) throw error;
    const note = mapChartNoteRow(data);
    setPatients((prev) => prev.map((p) => (p.id === patientId ? { ...p, chartNotes: [note, ...p.chartNotes] } : p)));
    return note;
  };

  const addPrescription = async (patientId: string, draft: NewPrescriptionInput): Promise<Prescription> => {
    if (!profile) throw new Error("Not signed in");
    const { data, error } = await supabase
      .from("prescriptions")
      .insert({
        tenant_id: profile.tenantId,
        patient_id: patientId,
        doctor_id: profile.role === "doctor" ? profile.id : null,
        date: new Date().toISOString().slice(0, 10),
        medicines: draft.medicines,
        notes: draft.notes,
        status: draft.status,
        signed: draft.signed,
        pdf_storage_path: draft.pdfStoragePath ?? null,
        pdf_sha256: draft.pdfSha256 ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    const rx = mapPrescriptionRow(data);
    setPatients((prev) => prev.map((p) => (p.id === patientId ? { ...p, prescriptions: [rx, ...p.prescriptions] } : p)));
    return rx;
  };

  const updatePrescription = async (patientId: string, rxId: string, patch: NewPrescriptionInput): Promise<Prescription> => {
    const { data, error } = await supabase
      .from("prescriptions")
      .update({
        medicines: patch.medicines,
        notes: patch.notes,
        status: patch.status,
        signed: patch.signed,
        pdf_storage_path: patch.pdfStoragePath ?? null,
        pdf_sha256: patch.pdfSha256 ?? null,
      })
      .eq("id", rxId)
      .select()
      .single();
    if (error) throw error;
    const rx = mapPrescriptionRow(data);
    setPatients((prev) =>
      prev.map((p) =>
        p.id === patientId ? { ...p, prescriptions: p.prescriptions.map((r) => (r.id === rxId ? rx : r)) } : p
      )
    );
    return rx;
  };

  const addTreatmentPlan = async (patientId: string, draft: NewTreatmentPlanInput): Promise<TreatmentPlan> => {
    if (!profile) throw new Error("Not signed in");
    const { data: planId, error } = await supabase.rpc("create_treatment_plan", {
      p_patient_id: patientId,
      p_doctor_id: profile.role === "doctor" ? profile.id : null,
      p_title: draft.title,
      p_created_on: new Date().toISOString().slice(0, 10),
      p_total_cost: draft.totalCost,
      p_status: draft.status,
      p_phases: draft.phases.map((ph) => ({
        name: ph.name,
        procedure: ph.procedure,
        cost: ph.cost,
        status: ph.status,
        est_date: ph.estDate,
      })),
    });
    if (error) throw error;

    const { data: row, error: fetchError } = await supabase
      .from("treatment_plans")
      .select("*, treatment_plan_phases ( * )")
      .eq("id", planId)
      .single();
    if (fetchError) throw fetchError;

    const plan = mapTreatmentPlanRow(row);
    setPatients((prev) => prev.map((p) => (p.id === patientId ? { ...p, treatmentPlans: [plan, ...p.treatmentPlans] } : p)));
    return plan;
  };

  const updateTreatmentPlan = async (
    patientId: string,
    planId: string,
    draft: NewTreatmentPlanInput
  ): Promise<TreatmentPlan> => {
    const { error } = await supabase.rpc("update_treatment_plan", {
      p_plan_id: planId,
      p_title: draft.title,
      p_total_cost: draft.totalCost,
      p_status: draft.status,
      p_phases: draft.phases.map((ph) => ({
        name: ph.name,
        procedure: ph.procedure,
        cost: ph.cost,
        status: ph.status,
        est_date: ph.estDate,
      })),
    });
    if (error) throw error;

    const { data: row, error: fetchError } = await supabase
      .from("treatment_plans")
      .select("*, treatment_plan_phases ( * )")
      .eq("id", planId)
      .single();
    if (fetchError) throw fetchError;

    const plan = mapTreatmentPlanRow(row);
    setPatients((prev) =>
      prev.map((p) =>
        p.id === patientId ? { ...p, treatmentPlans: p.treatmentPlans.map((tp) => (tp.id === planId ? plan : tp)) } : p
      )
    );
    return plan;
  };

  const updateTreatmentPlanStatus = async (patientId: string, planId: string, status: TreatmentPlan["status"]) => {
    const { error } = await supabase.from("treatment_plans").update({ status }).eq("id", planId);
    if (error) throw error;
    setPatients((prev) =>
      prev.map((p) =>
        p.id === patientId
          ? { ...p, treatmentPlans: p.treatmentPlans.map((tp) => (tp.id === planId ? { ...tp, status } : tp)) }
          : p
      )
    );
  };

  const addPatientImage = async (patientId: string, file: File, category: ImageCategory): Promise<PatientImage> => {
    if (!profile) throw new Error("Not signed in");
    const path = `${profile.tenantId}/${patientId}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("patient-images").upload(path, file);
    if (uploadError) throw uploadError;

    const { data, error } = await supabase
      .from("patient_images")
      .insert({
        tenant_id: profile.tenantId,
        patient_id: patientId,
        category,
        storage_path: path,
        label: file.name,
        uploaded_by: profile.id,
      })
      .select()
      .single();
    if (error) throw error;

    const { data: signed } = await supabase.storage.from("patient-images").createSignedUrl(path, 3600);
    const image = mapPatientImageRow(data, signed?.signedUrl ?? "");
    setPatients((prev) => prev.map((p) => (p.id === patientId ? { ...p, images: [image, ...p.images] } : p)));
    return image;
  };

  const removePatientImage = async (patientId: string, imageId: string) => {
    const { data: row, error: fetchError } = await supabase
      .from("patient_images")
      .select("storage_path")
      .eq("id", imageId)
      .single();
    if (fetchError) throw fetchError;

    const { error: deleteError } = await supabase.from("patient_images").delete().eq("id", imageId);
    if (deleteError) throw deleteError;

    if (row?.storage_path) {
      await supabase.storage.from("patient-images").remove([row.storage_path]);
    }

    setPatients((prev) =>
      prev.map((p) => (p.id === patientId ? { ...p, images: p.images.filter((img) => img.id !== imageId) } : p))
    );
  };

  const addPatientReport = async (patientId: string, file: File): Promise<PatientReport> => {
    if (!profile) throw new Error("Not signed in");
    const path = `${profile.tenantId}/${patientId}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("patient-reports").upload(path, file);
    if (uploadError) throw uploadError;

    const { data, error } = await supabase
      .from("patient_reports")
      .insert({
        tenant_id: profile.tenantId,
        patient_id: patientId,
        name: file.name,
        type: "Uploaded Document",
        storage_path: path,
        uploaded_by: profile.id,
      })
      .select()
      .single();
    if (error) throw error;

    const { data: signed } = await supabase.storage.from("patient-reports").createSignedUrl(path, 3600);
    const report = mapPatientReportRow(data, signed?.signedUrl ?? "");
    setPatients((prev) => prev.map((p) => (p.id === patientId ? { ...p, reports: [report, ...p.reports] } : p)));
    return report;
  };

  const removePatientReport = async (patientId: string, reportId: string) => {
    const { data: row, error: fetchError } = await supabase
      .from("patient_reports")
      .select("storage_path")
      .eq("id", reportId)
      .single();
    if (fetchError) throw fetchError;

    const { error: deleteError } = await supabase.from("patient_reports").delete().eq("id", reportId);
    if (deleteError) throw deleteError;

    if (row?.storage_path) {
      await supabase.storage.from("patient-reports").remove([row.storage_path]);
    }

    setPatients((prev) =>
      prev.map((p) => (p.id === patientId ? { ...p, reports: p.reports.filter((r) => r.id !== reportId) } : p))
    );
  };

  const addInvoice = async (patientId: string, draft: NewInvoiceInput): Promise<Invoice> => {
    if (!profile) throw new Error("Not signed in");
    const { data, error } = await supabase
      .from("invoices")
      .insert({
        tenant_id: profile.tenantId,
        patient_id: patientId,
        date: new Date().toISOString().slice(0, 10),
        description: draft.description,
        amount: draft.amount,
        status: "Pending",
      })
      .select("*, patients ( name )")
      .single();
    if (error) throw error;
    const invoice = mapInvoiceRow(data);
    let nextInvoices: InvoiceWithPatient[] = [];
    setInvoices((prev) => {
      nextInvoices = [invoice, ...prev];
      return nextInvoices;
    });
    setPatients((prevPatients) => withDerivedBalanceAndInvoices(prevPatients, nextInvoices));
    return invoice;
  };

  const markInvoicePaid = async (_patientId: string, invoiceId: string) => {
    const { error } = await supabase.from("invoices").update({ status: "Paid", amount_paid: null }).eq("id", invoiceId);
    if (error) throw error;
    let nextInvoices: InvoiceWithPatient[] = [];
    setInvoices((prev) => {
      nextInvoices = prev.map((inv) => (inv.id === invoiceId ? { ...inv, status: "Paid" as const, amountPaid: undefined } : inv));
      return nextInvoices;
    });
    setPatients((prevPatients) => withDerivedBalanceAndInvoices(prevPatients, nextInvoices));
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
    authLoading,
    role,
    profile,
    logout,
    theme,
    setTheme,
    toggleTheme,
    patients,
    appointments,
    notifications,
    broadcasts,
    addPatient,
    addAppointment,
    setAppointmentStatus,
    setAppointmentCheckIn,
    rescheduleRequests,
    approveReschedule,
    denyReschedule,
    rescheduleAppointment,
    cancellationRequests,
    approveCancellation,
    denyCancellation,
    cancelAppointment,
    markNotificationRead,
    markAllNotificationsRead,
    addBroadcast,
    staffMembers,
    staffInvites,
    loadStaffDirectory,
    inviteStaffMember,
    revokeStaffInvite,
    updateStaffStatus,
    auditLogs,
    systemLogs,
    loadAdminLogs,
    updateClinicSettings,
    loadPatientClinicalData,
    addChartNote,
    addPrescription,
    updatePrescription,
    addTreatmentPlan,
    updateTreatmentPlan,
    updateTreatmentPlanStatus,
    addPatientImage,
    removePatientImage,
    addPatientReport,
    removePatientReport,
    invoices,
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
