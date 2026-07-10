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

export interface StaffDoctor {
  id: string;
  name: string;
  title: string;
  avatarInitials: string;
  email: string;
  status: "Active" | "On Leave";
  patientsCount: number;
  appointmentsThisMonth: number;
  rating: number;
  revenueThisMonth: number;
}

export interface StaffReceptionist {
  id: string;
  name: string;
  avatarInitials: string;
  email: string;
  status: "Active" | "On Leave";
  checkInsToday: number;
  messagesHandledThisWeek: number;
  avgResponseTimeMin: number;
  rating: number;
}

export const currentReceptionist = {
  name: "Priya Sharma",
  title: "Front Desk Receptionist",
  clinic: "DentVerse Smile Studio",
  email: "priya.sharma@dentverse.clinic",
  avatarInitials: "PS",
};

export const currentAdmin = {
  name: "Vikram Nair",
  title: "Clinic Administrator",
  clinic: "DentVerse Smile Studio",
  email: "vikram.nair@dentverse.clinic",
  avatarInitials: "VN",
};

export const staffDoctors: StaffDoctor[] = [
  {
    id: "doc1",
    name: "Dr. Ananya Rao",
    title: "BDS, MDS — Prosthodontics",
    avatarInitials: "AR",
    email: "ananya.rao@dentverse.clinic",
    status: "Active",
    patientsCount: 214,
    appointmentsThisMonth: 96,
    rating: 4.9,
    revenueThisMonth: 486500,
  },
  {
    id: "doc2",
    name: "Dr. Karthik Iyer",
    title: "BDS — Orthodontics",
    avatarInitials: "KI",
    email: "karthik.iyer@dentverse.clinic",
    status: "Active",
    patientsCount: 168,
    appointmentsThisMonth: 74,
    rating: 4.7,
    revenueThisMonth: 352000,
  },
  {
    id: "doc3",
    name: "Dr. Fatima Sheikh",
    title: "BDS, MDS — Periodontics",
    avatarInitials: "FS",
    email: "fatima.sheikh@dentverse.clinic",
    status: "On Leave",
    patientsCount: 121,
    appointmentsThisMonth: 12,
    rating: 4.8,
    revenueThisMonth: 84000,
  },
];

export const staffReceptionists: StaffReceptionist[] = [
  {
    id: "rec1",
    name: "Priya Sharma",
    avatarInitials: "PS",
    email: "priya.sharma@dentverse.clinic",
    status: "Active",
    checkInsToday: 12,
    messagesHandledThisWeek: 143,
    avgResponseTimeMin: 4,
    rating: 4.8,
  },
  {
    id: "rec2",
    name: "Rahul Deshmukh",
    avatarInitials: "RD",
    email: "rahul.deshmukh@dentverse.clinic",
    status: "Active",
    checkInsToday: 8,
    messagesHandledThisWeek: 97,
    avgResponseTimeMin: 6,
    rating: 4.6,
  },
];

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
