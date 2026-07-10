// Clinic Admin analytics + operations mock data.

export interface MonthlyPoint {
  month: string;
  appointments: number;
  revenue: number;
}

export const monthlyTrends: MonthlyPoint[] = [
  { month: "Feb", appointments: 142, revenue: 612000 },
  { month: "Mar", appointments: 158, revenue: 684000 },
  { month: "Apr", appointments: 149, revenue: 645000 },
  { month: "May", appointments: 171, revenue: 738000 },
  { month: "Jun", appointments: 186, revenue: 812000 },
  { month: "Jul", appointments: 96, revenue: 486500 },
];

export const clinicStats = {
  totalPatients: 503,
  activePatients: 412,
  newPatientsThisMonth: 34,
  todaysAppointments: 4,
  noShowRate: 6.2,
  aiResolutionRate: 87,
  patientSatisfaction: 4.7,
};

export interface WhatsAppAnalytics {
  messagesSent: number;
  messagesReceived: number;
  deliveryRate: number;
  aiResponseRate: number;
  avgResponseTimeSec: number;
}

export const whatsappAnalytics: WhatsAppAnalytics = {
  messagesSent: 3184,
  messagesReceived: 2760,
  deliveryRate: 97.4,
  aiResponseRate: 91,
  avgResponseTimeSec: 18,
};

export const broadcastAnalytics = {
  totalBroadcasts: 12,
  totalRecipients: 2340,
  avgDeliveryRate: 95,
};

export interface AuditLogEntry {
  id: string;
  actor: string;
  action: string;
  target: string;
  timestamp: string;
}

export const auditLogs: AuditLogEntry[] = [
  { id: "al1", actor: "Dr. Ananya Rao", action: "Approved treatment plan", target: "Rohan Mehta — Invisalign Phase 2", timestamp: "Today, 9:12 AM" },
  { id: "al2", actor: "Priya Sharma", action: "Confirmed appointment", target: "Sneha Kapoor — Whitening Consultation", timestamp: "Today, 8:50 AM" },
  { id: "al3", actor: "Vikram Nair", action: "Updated clinic settings", target: "Working hours — Saturday", timestamp: "Yesterday, 6:20 PM" },
  { id: "al4", actor: "Dr. Ananya Rao", action: "Digitally signed prescription", target: "Rohan Mehta — Sensitivity Follow-up", timestamp: "Yesterday, 4:05 PM" },
  { id: "al5", actor: "Rahul Deshmukh", action: "Checked in patient", target: "Arjun Verma — Root Canal Sitting 3", timestamp: "Yesterday, 2:00 PM" },
  { id: "al6", actor: "Vikram Nair", action: "Added staff member", target: "Dr. Karthik Iyer", timestamp: "2 days ago" },
  { id: "al7", actor: "Priya Sharma", action: "Approved reschedule request", target: "Vikram Singh — 6-Month Cleaning", timestamp: "3 days ago" },
];

export interface SystemLogEntry {
  id: string;
  level: "info" | "warning" | "error";
  message: string;
  source: string;
  timestamp: string;
}

export const systemLogs: SystemLogEntry[] = [
  { id: "sl1", level: "info", message: "WhatsApp Business API webhook connected successfully.", source: "WhatsApp Integration", timestamp: "Today, 6:00 AM" },
  { id: "sl2", level: "warning", message: "Broadcast delivery rate dipped below 90% for segment 'Cosmetic Interest'.", source: "Broadcast Engine", timestamp: "Today, 7:30 AM" },
  { id: "sl3", level: "info", message: "Nightly patient data backup completed.", source: "Backup Service", timestamp: "Today, 3:00 AM" },
  { id: "sl4", level: "error", message: "5 broadcast messages failed to deliver — invalid phone numbers.", source: "Broadcast Engine", timestamp: "2026-07-05, 10:15 AM" },
  { id: "sl5", level: "info", message: "Sarvam AI transcription service latency: 1.2s avg (nominal).", source: "Voice-to-Chart", timestamp: "Today, 9:00 AM" },
  { id: "sl6", level: "warning", message: "AI receptionist escalated 2 conversations to front desk this week.", source: "AI Receptionist", timestamp: "3 days ago" },
];
