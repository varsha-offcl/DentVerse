// Automated AI campaign definitions for the Broadcast Center.

export interface Campaign {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

export const DEFAULT_CAMPAIGNS: Campaign[] = [
  {
    id: "birthday",
    name: "Birthday Wishes",
    description: "Automatically sent to patients on their Date of Birth, on file in their patient record.",
    enabled: true,
  },
  {
    id: "appt-confirmation",
    name: "Appointment Confirmation",
    description: "Sent instantly via WhatsApp the moment an appointment is confirmed.",
    enabled: true,
  },
  {
    id: "appt-cancellation",
    name: "Appointment Cancellation",
    description: "Sent to the patient whenever an appointment is cancelled by the clinic or the patient.",
    enabled: true,
  },
  {
    id: "appt-reschedule",
    name: "Appointment Reschedule",
    description: "Sent whenever an appointment is moved to a new date or time.",
    enabled: true,
  },
  {
    id: "followup-reminders",
    name: "Follow-up Reminders",
    description: "1 week before: reminder sent to the patient. 1 day before: reminder sent to both the patient and the doctor.",
    enabled: true,
  },
  {
    id: "recall-6month",
    name: "6-Month Recall Reminder",
    description: "Nudges patients who are due for their routine 6-month cleaning or checkup.",
    enabled: false,
  },
  {
    id: "prescription-delivery",
    name: "Prescription Delivery",
    description: "Automatically delivers the signed prescription PDF to the patient once issued.",
    enabled: true,
  },
  {
    id: "treatment-plan-delivery",
    name: "Treatment Plan Delivery",
    description: "Automatically delivers an approved treatment plan to the patient once signed off.",
    enabled: true,
  },
];

export const CAMPAIGNS_STORAGE_KEY = "dentverse.campaigns.v1";

export function loadStoredCampaigns(): Campaign[] {
  if (typeof window === "undefined") return DEFAULT_CAMPAIGNS;
  try {
    const raw = window.localStorage.getItem(CAMPAIGNS_STORAGE_KEY);
    if (!raw) return DEFAULT_CAMPAIGNS;
    const parsed = JSON.parse(raw) as Record<string, boolean>;
    return DEFAULT_CAMPAIGNS.map((c) => ({ ...c, enabled: parsed[c.id] ?? c.enabled }));
  } catch {
    return DEFAULT_CAMPAIGNS;
  }
}
