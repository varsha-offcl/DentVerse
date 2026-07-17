// Role-based access data for the DentVerse prototype.

export type Role = "doctor" | "receptionist" | "admin";

export const ROLE_LABELS: Record<Role, string> = {
  doctor: "Doctor",
  receptionist: "Receptionist",
  admin: "Clinic Admin",
};

export const ROLE_HOME: Record<Role, string> = {
  doctor: "/dashboard",
  receptionist: "/reception",
  admin: "/admin",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  doctor: "Clinical workflows — patient charts, prescriptions, and treatment plans.",
  receptionist: "Front-desk operations — appointments, check-ins, and patient communication.",
  admin: "Full clinic oversight — analytics, staff, settings, and system health.",
};

export const PERMISSIONS: Record<Role, string[]> = {
  doctor: [
    "Patient Workspace",
    "Calendar",
    "Voice-to-Chart",
    "Prescriptions",
    "Treatment Plans",
    "Availability Management",
    "Notifications",
  ],
  receptionist: [
    "Communication Center",
    "Appointment Management",
    "Check-in / Check-out",
    "Patient Search",
    "Billing & Payments",
    "Notifications",
  ],
  admin: [
    "Analytics",
    "Reports",
    "Staff Management",
    "Doctor Management",
    "User Roles & Permissions",
    "Clinic Settings",
    "WhatsApp Configuration",
    "Communication Overview",
    "Audit & System Logs",
  ],
};

export const RESTRICTED: Record<Role, string[]> = {
  doctor: [],
  receptionist: ["Voice-to-Chart", "Clinical Notes", "Patient Charts", "Prescription Editing", "Treatment Plans"],
  admin: [],
};
