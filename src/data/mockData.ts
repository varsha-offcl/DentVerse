// Shared dummy data for the DentVerse clickable prototype.
// Everything here is static demo content — no backend, no persistence beyond in-memory session state.

export type AppointmentStatus = "pending" | "confirmed" | "cancelled" | "completed";
export type CheckInStatus = "Not Arrived" | "Checked In" | "In Treatment" | "Checked Out";

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  avatarInitials: string;
  date: string; // ISO date "2026-07-10"
  time: string; // "09:30 AM"
  duration: string;
  type: string;
  status: AppointmentStatus;
  source: "WhatsApp AI" | "Manual" | "Phone";
  notes?: string;
  requestedAt?: string;
  doctorName?: string;
  checkInStatus?: CheckInStatus;
}

export interface WhatsAppMessage {
  id: string;
  sender: "patient" | "ai" | "doctor";
  text: string;
  time: string;
}

export interface ChartNote {
  id: string;
  date: string;
  title: string;
  soap: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  };
  recordedVia: "Voice-to-Chart AI" | "Manual Entry";
}

export interface Prescription {
  id: string;
  date: string;
  medicines: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }[];
  notes: string;
  status: "Draft" | "Sent to Patient";
  signed?: boolean;
}

export interface TreatmentPhase {
  id: string;
  name: string;
  procedure: string;
  cost: number;
  status: "Completed" | "In Progress" | "Upcoming";
  estDate: string;
}

export interface TreatmentPlan {
  id: string;
  title: string;
  createdOn: string;
  totalCost: number;
  status: "Proposed" | "Approved" | "In Progress" | "Completed";
  phases: TreatmentPhase[];
}

export interface MedicalHistory {
  conditions: string[];
  medications: string[];
  notes: string;
}

export interface FollowUpEntry {
  id: string;
  date: string;
  channel: "WhatsApp" | "Call" | "In-Clinic";
  summary: string;
  outcome: "Resolved" | "Awaiting Reply" | "Scheduled Visit";
}

export type ImageCategory = "Clinical Photo" | "Treatment Image" | "X-Ray";

export interface PatientImage {
  id: string;
  url: string;
  category: ImageCategory;
  label: string;
  uploadedAt: string;
}

export interface PatientReport {
  id: string;
  name: string;
  type: string;
  uploadedAt: string;
  url: string;
}

export interface Invoice {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: "Paid" | "Pending" | "Overdue";
}

export interface Patient {
  id: string;
  name: string;
  avatarInitials: string;
  phone: string;
  age: number;
  gender: "Male" | "Female";
  email: string;
  tags: string[];
  allergies: string[];
  lastVisit: string;
  nextVisit?: string;
  balanceDue: number;
  memberSince: string;
  whatsappThread: WhatsAppMessage[];
  chartNotes: ChartNote[];
  prescriptions: Prescription[];
  treatmentPlans: TreatmentPlan[];
  medicalHistory: MedicalHistory;
  followUps: FollowUpEntry[];
  images: PatientImage[];
  reports: PatientReport[];
  invoices: Invoice[];
}

export interface NotificationItem {
  id: string;
  type: "request" | "reschedule" | "payment" | "ai" | "cancellation" | "system";
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export interface BroadcastMessage {
  id: string;
  title: string;
  message: string;
  audience: string;
  sentAt: string;
  recipients: number;
  status: "Sent" | "Scheduled" | "Draft";
  delivered?: number;
  failed?: number;
  pending?: number;
}

export const currentDoctor = {
  name: "Dr. Ananya Rao",
  title: "BDS, MDS — Prosthodontics",
  clinic: "DentVerse Smile Studio",
  email: "ananya.rao@dentverse.clinic",
  avatarInitials: "AR",
};

type PatientSeed = Omit<Patient, "medicalHistory" | "followUps" | "images" | "reports" | "invoices">;

const patientsSeed: PatientSeed[] = [
  {
    id: "p1",
    name: "Rohan Mehta",
    avatarInitials: "RM",
    phone: "+91 98200 11234",
    age: 34,
    gender: "Male",
    email: "rohan.mehta@gmail.com",
    tags: ["VIP", "Ortho"],
    allergies: ["Penicillin"],
    lastVisit: "2026-06-28",
    nextVisit: "2026-07-10",
    balanceDue: 0,
    memberSince: "2023-02-14",
    whatsappThread: [
      { id: "m1", sender: "patient", text: "Hi, I have some sensitivity in my lower left molar since yesterday.", time: "Yesterday, 6:12 PM" },
      { id: "m2", sender: "ai", text: "Sorry to hear that, Rohan! I can help you book a slot with Dr. Rao. Would tomorrow morning work for you?", time: "Yesterday, 6:13 PM" },
      { id: "m3", sender: "patient", text: "Yes, morning works great.", time: "Yesterday, 6:15 PM" },
      { id: "m4", sender: "ai", text: "You're booked for tomorrow, 10 July at 9:30 AM with Dr. Ananya Rao. I'll send a reminder an hour before. Reply RESCHEDULE anytime to change it.", time: "Yesterday, 6:16 PM" },
      { id: "m5", sender: "ai", text: "Reminder: your appointment is in 1 hour at DentVerse Smile Studio. See you soon!", time: "Today, 8:30 AM" },
    ],
    chartNotes: [
      {
        id: "c1",
        date: "2026-06-28",
        title: "Routine Cleaning + Sensitivity Check",
        recordedVia: "Voice-to-Chart AI",
        soap: {
          subjective: "Patient reports mild cold sensitivity on lower left quadrant, onset ~3 days.",
          objective: "No visible caries. Slight gum recession near #19. No swelling.",
          assessment: "Likely dentin hypersensitivity due to recession.",
          plan: "Prescribe desensitizing toothpaste, recommend soft-bristle brush, review in 2 weeks.",
        },
      },
    ],
    prescriptions: [
      {
        id: "rx1",
        date: "2026-06-28",
        status: "Sent to Patient",
        notes: "For dentin hypersensitivity, review in 2 weeks.",
        medicines: [
          { name: "Sensodyne Rapid Relief", dosage: "Apply pea-sized amount", frequency: "Twice daily", duration: "4 weeks", instructions: "Massage on affected teeth for 1 min, do not rinse immediately." },
        ],
      },
    ],
    treatmentPlans: [
      {
        id: "tp1",
        title: "Invisalign — Full Upper & Lower Arch",
        createdOn: "2026-03-01",
        totalCost: 185000,
        status: "In Progress",
        phases: [
          { id: "ph1", name: "Phase 1", procedure: "Initial scan + aligner set 1-6", cost: 65000, status: "Completed", estDate: "2026-03-10" },
          { id: "ph2", name: "Phase 2", procedure: "Aligner set 7-14 + attachments", cost: 70000, status: "In Progress", estDate: "2026-07-15" },
          { id: "ph3", name: "Phase 3", procedure: "Refinement + retainers", cost: 50000, status: "Upcoming", estDate: "2026-10-20" },
        ],
      },
    ],
  },
  {
    id: "p2",
    name: "Sneha Kapoor",
    avatarInitials: "SK",
    phone: "+91 90040 55621",
    age: 28,
    gender: "Female",
    email: "sneha.kapoor@outlook.com",
    tags: ["New Patient"],
    allergies: [],
    lastVisit: "—",
    nextVisit: "2026-07-10",
    balanceDue: 1500,
    memberSince: "2026-07-05",
    whatsappThread: [
      { id: "m1", sender: "patient", text: "Hello, I'd like to book a consultation for teeth whitening.", time: "Mon, 11:02 AM" },
      { id: "m2", sender: "ai", text: "Hi Sneha! Welcome to DentVerse Smile Studio 😊 I can set up a consultation with Dr. Rao. What day suits you best?", time: "Mon, 11:03 AM" },
      { id: "m3", sender: "patient", text: "This Friday afternoon?", time: "Mon, 11:05 AM" },
      { id: "m4", sender: "ai", text: "Friday 10 July, 11:00 AM is available. Shall I confirm?", time: "Mon, 11:05 AM" },
      { id: "m5", sender: "patient", text: "Yes please!", time: "Mon, 11:06 AM" },
      { id: "m6", sender: "ai", text: "Confirmed ✅ Please arrive 10 mins early for a quick intake form. See you Friday!", time: "Mon, 11:06 AM" },
    ],
    chartNotes: [],
    prescriptions: [],
    treatmentPlans: [],
  },
  {
    id: "p3",
    name: "Arjun Verma",
    avatarInitials: "AV",
    phone: "+91 87654 33210",
    age: 45,
    gender: "Male",
    email: "arjun.verma@yahoo.com",
    tags: ["Root Canal"],
    allergies: ["Latex"],
    lastVisit: "2026-06-20",
    nextVisit: "2026-07-10",
    balanceDue: 8000,
    memberSince: "2021-11-02",
    whatsappThread: [
      { id: "m1", sender: "patient", text: "The pain in my tooth came back a little after the last sitting.", time: "2 days ago, 9:40 AM" },
      { id: "m2", sender: "ai", text: "Thanks for letting us know, Arjun. That can be normal during root canal therapy, but let's have Dr. Rao take a look. I've found a slot today at 2:00 PM — want it?", time: "2 days ago, 9:42 AM" },
      { id: "m3", sender: "patient", text: "Can we do tomorrow instead, at 2?", time: "2 days ago, 9:45 AM" },
      { id: "m4", sender: "ai", text: "Sure, moved to 10 July at 2:00 PM. You're all set.", time: "2 days ago, 9:46 AM" },
    ],
    chartNotes: [
      {
        id: "c1",
        date: "2026-06-20",
        title: "Root Canal — Sitting 2 of 3",
        recordedVia: "Voice-to-Chart AI",
        soap: {
          subjective: "Patient reports intermittent dull ache on #30, no swelling.",
          objective: "Access cavity clean, canal irrigated with NaOCl, working length confirmed at 21mm.",
          assessment: "RCT #30 progressing normally, mild post-op sensitivity expected.",
          plan: "Continue obturation next visit, prescribe analgesic if needed.",
        },
      },
    ],
    prescriptions: [
      {
        id: "rx1",
        date: "2026-06-20",
        status: "Sent to Patient",
        notes: "Post RCT sitting 2, pain management",
        medicines: [
          { name: "Ibuprofen 400mg", dosage: "1 tablet", frequency: "Every 8 hours as needed", duration: "3 days", instructions: "Take after food." },
          { name: "Amoxicillin 500mg", dosage: "1 capsule", frequency: "Every 8 hours", duration: "5 days", instructions: "Complete full course." },
        ],
      },
    ],
    treatmentPlans: [
      {
        id: "tp1",
        title: "Root Canal Therapy — Tooth #30 + Crown",
        createdOn: "2026-06-05",
        totalCost: 24000,
        status: "In Progress",
        phases: [
          { id: "ph1", name: "Sitting 1", procedure: "Access opening + cleaning", cost: 6000, status: "Completed", estDate: "2026-06-12" },
          { id: "ph2", name: "Sitting 2", procedure: "Shaping + irrigation", cost: 6000, status: "Completed", estDate: "2026-06-20" },
          { id: "ph3", name: "Sitting 3", procedure: "Obturation", cost: 6000, status: "Upcoming", estDate: "2026-07-10" },
          { id: "ph4", name: "Final", procedure: "Crown placement", cost: 6000, status: "Upcoming", estDate: "2026-07-24" },
        ],
      },
    ],
  },
  {
    id: "p4",
    name: "Priya Nair",
    avatarInitials: "PN",
    phone: "+91 99887 66554",
    age: 31,
    gender: "Female",
    email: "priya.nair@gmail.com",
    tags: ["Pediatric Parent"],
    allergies: [],
    lastVisit: "2026-05-15",
    nextVisit: "2026-07-11",
    balanceDue: 0,
    memberSince: "2022-08-19",
    whatsappThread: [
      { id: "m1", sender: "patient", text: "Can I get an appointment for my daughter's dental checkup?", time: "3 days ago, 4:20 PM" },
      { id: "m2", sender: "ai", text: "Of course! How old is your daughter, and does she have any specific concern?", time: "3 days ago, 4:21 PM" },
      { id: "m3", sender: "patient", text: "She's 7, just a regular checkup.", time: "3 days ago, 4:22 PM" },
      { id: "m4", sender: "ai", text: "Great, I have Saturday 11 July at 10:00 AM with Dr. Rao — she specializes in pediatric care too. Shall I book it?", time: "3 days ago, 4:23 PM" },
      { id: "m5", sender: "patient", text: "Perfect, yes.", time: "3 days ago, 4:24 PM" },
    ],
    chartNotes: [],
    prescriptions: [],
    treatmentPlans: [],
  },
  {
    id: "p5",
    name: "Karan Malhotra",
    avatarInitials: "KM",
    phone: "+91 91234 87654",
    age: 52,
    gender: "Male",
    email: "karan.malhotra@gmail.com",
    tags: ["Implants"],
    allergies: [],
    lastVisit: "2026-04-30",
    balanceDue: 12000,
    memberSince: "2020-01-10",
    whatsappThread: [
      { id: "m1", sender: "patient", text: "I want to cancel my appointment this week, something urgent came up.", time: "5 days ago, 1:10 PM" },
      { id: "m2", sender: "ai", text: "No problem, Karan. I've cancelled your 8 July appointment. Would you like me to suggest a new slot for next week?", time: "5 days ago, 1:11 PM" },
      { id: "m3", sender: "patient", text: "I'll message you once I know my schedule.", time: "5 days ago, 1:12 PM" },
      { id: "m4", sender: "ai", text: "Sounds good, I'll check in with you in a few days!", time: "5 days ago, 1:12 PM" },
    ],
    chartNotes: [],
    prescriptions: [],
    treatmentPlans: [
      {
        id: "tp1",
        title: "Dental Implant — Tooth #14",
        createdOn: "2026-04-01",
        totalCost: 45000,
        status: "Proposed",
        phases: [
          { id: "ph1", name: "Phase 1", procedure: "Implant placement surgery", cost: 25000, status: "Upcoming", estDate: "TBD" },
          { id: "ph2", name: "Phase 2", procedure: "Healing + osseointegration (3 months)", cost: 0, status: "Upcoming", estDate: "TBD" },
          { id: "ph3", name: "Phase 3", procedure: "Abutment + crown placement", cost: 20000, status: "Upcoming", estDate: "TBD" },
        ],
      },
    ],
  },
  {
    id: "p6",
    name: "Isha Chatterjee",
    avatarInitials: "IC",
    phone: "+91 98765 12340",
    age: 24,
    gender: "Female",
    email: "isha.c@gmail.com",
    tags: ["Wisdom Tooth"],
    allergies: ["Ibuprofen"],
    lastVisit: "2026-06-01",
    balanceDue: 0,
    memberSince: "2025-09-23",
    whatsappThread: [
      { id: "m1", sender: "patient", text: "My wisdom tooth is hurting a lot again 😣", time: "Today, 7:45 AM" },
      { id: "m2", sender: "ai", text: "I'm sorry to hear that, Isha. Is the pain severe enough to need an urgent visit today?", time: "Today, 7:46 AM" },
      { id: "m3", sender: "patient", text: "Yes it's pretty bad", time: "Today, 7:46 AM" },
      { id: "m4", sender: "ai", text: "I've flagged this as urgent for Dr. Rao's team to confirm a same-day slot. You'll hear back shortly.", time: "Today, 7:47 AM" },
    ],
    chartNotes: [],
    prescriptions: [],
    treatmentPlans: [],
  },
  {
    id: "p7",
    name: "Vikram Singh",
    avatarInitials: "VS",
    phone: "+91 90909 45678",
    age: 39,
    gender: "Male",
    email: "vikram.singh@proton.me",
    tags: [],
    allergies: [],
    lastVisit: "2026-06-15",
    balanceDue: 0,
    memberSince: "2024-05-12",
    whatsappThread: [
      { id: "m1", sender: "ai", text: "Hi Vikram, this is a reminder that it's time for your 6-month cleaning! Would you like to book a slot?", time: "6 days ago, 10:00 AM" },
      { id: "m2", sender: "patient", text: "Sure, next Tuesday works.", time: "6 days ago, 5:30 PM" },
      { id: "m3", sender: "ai", text: "Got it — I don't have a Tuesday slot yet, checking with the clinic and will confirm shortly.", time: "6 days ago, 5:31 PM" },
    ],
    chartNotes: [],
    prescriptions: [],
    treatmentPlans: [],
  },
  {
    id: "p8",
    name: "Meera Iyer",
    avatarInitials: "MI",
    phone: "+91 88990 12345",
    age: 41,
    gender: "Female",
    email: "meera.iyer@gmail.com",
    tags: ["Gum Care"],
    allergies: [],
    lastVisit: "2026-05-28",
    balanceDue: 3200,
    memberSince: "2022-02-27",
    whatsappThread: [
      { id: "m1", sender: "patient", text: "My gums have been bleeding a bit when I brush.", time: "1 week ago, 8:15 PM" },
      { id: "m2", sender: "ai", text: "Thanks for sharing that, Meera. Dr. Rao would like to check on that — I have a slot on 15 July at 4:00 PM. Does that work?", time: "1 week ago, 8:16 PM" },
      { id: "m3", sender: "patient", text: "Works for me.", time: "1 week ago, 8:17 PM" },
    ],
    chartNotes: [],
    prescriptions: [],
    treatmentPlans: [],
  },
];

function placeholderImage(label: string, bg: string, fg = "#ffffff") {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="${bg}"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Inter, sans-serif" font-size="20" fill="${fg}">${label}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const defaultMedicalHistory: MedicalHistory = {
  conditions: [],
  medications: [],
  notes: "No significant medical history on file.",
};

const patientExtras: Record<
  string,
  Partial<Pick<Patient, "medicalHistory" | "followUps" | "images" | "reports" | "invoices">>
> = {
  p1: {
    medicalHistory: {
      conditions: ["Mild gum recession"],
      medications: ["None"],
      notes: "No known systemic conditions. Allergic to Penicillin — avoid amoxicillin-class antibiotics.",
    },
    followUps: [
      { id: "f1", date: "2026-06-30", channel: "WhatsApp", summary: "Checked in on sensitivity symptoms after cleaning.", outcome: "Resolved" },
      { id: "f2", date: "2026-03-15", channel: "WhatsApp", summary: "Reminded about wearing aligners 22 hrs/day.", outcome: "Resolved" },
    ],
    images: [
      { id: "img1", url: placeholderImage("Intraoral — Lower Left", "#0891a8"), category: "Clinical Photo", label: "Intraoral — Lower Left Molar", uploadedAt: "2026-06-28" },
      { id: "img2", url: placeholderImage("Aligner Fit Check", "#0e7490"), category: "Treatment Image", label: "Aligner Fit Check — Set 7", uploadedAt: "2026-06-10" },
      { id: "img3", url: placeholderImage("OPG X-Ray", "#164e63"), category: "X-Ray", label: "Panoramic OPG", uploadedAt: "2026-03-01" },
    ],
    reports: [
      { id: "rep1", name: "Orthodontic Assessment Report.pdf", type: "Lab Report", uploadedAt: "2026-03-01", url: "#" },
    ],
    invoices: [
      { id: "inv1", date: "2026-06-28", description: "Routine Cleaning + Sensitivity Check", amount: 1800, status: "Paid" },
      { id: "inv2", date: "2026-03-10", description: "Invisalign Phase 1", amount: 65000, status: "Paid" },
    ],
  },
  p3: {
    medicalHistory: {
      conditions: ["Hypertension (controlled)"],
      medications: ["Amlodipine 5mg — once daily"],
      notes: "Latex allergy — use nitrile gloves and latex-free dam during procedures.",
    },
    followUps: [
      { id: "f1", date: "2026-06-22", channel: "WhatsApp", summary: "Followed up on post-RCT sensitivity, patient reported improvement.", outcome: "Resolved" },
      { id: "f2", date: "2026-07-08", channel: "WhatsApp", summary: "Confirmed sitting 3 appointment and pre-visit instructions.", outcome: "Scheduled Visit" },
    ],
    images: [
      { id: "img1", url: placeholderImage("Pre-Op X-Ray #30", "#164e63"), category: "X-Ray", label: "Pre-Op Periapical — Tooth #30", uploadedAt: "2026-06-05" },
      { id: "img2", url: placeholderImage("Post Sitting 2", "#164e63"), category: "X-Ray", label: "Working Length Confirmation", uploadedAt: "2026-06-20" },
      { id: "img3", url: placeholderImage("Access Cavity", "#0e7490"), category: "Treatment Image", label: "Access Cavity Preparation", uploadedAt: "2026-06-12" },
    ],
    reports: [
      { id: "rep1", name: "Blood Pressure Clearance.pdf", type: "Medical Clearance", uploadedAt: "2026-06-01", url: "#" },
    ],
    invoices: [
      { id: "inv1", date: "2026-06-20", description: "Root Canal — Sitting 2", amount: 6000, status: "Paid" },
      { id: "inv2", date: "2026-07-10", description: "Root Canal — Sitting 3", amount: 6000, status: "Pending" },
      { id: "inv3", date: "2026-06-05", description: "Diagnostic X-Rays", amount: 2000, status: "Overdue" },
    ],
  },
  p5: {
    medicalHistory: {
      conditions: ["Type 2 Diabetes (managed)"],
      medications: ["Metformin 500mg — twice daily"],
      notes: "Monitor healing time post-implant surgery due to diabetes.",
    },
    followUps: [
      { id: "f1", date: "2026-07-05", channel: "Call", summary: "Discussed rescheduling implant consultation.", outcome: "Awaiting Reply" },
    ],
    images: [
      { id: "img1", url: placeholderImage("Implant Site X-Ray", "#164e63"), category: "X-Ray", label: "Implant Site — Tooth #14", uploadedAt: "2026-04-01" },
    ],
    reports: [],
    invoices: [
      { id: "inv1", date: "2026-04-01", description: "Implant Consultation", amount: 1500, status: "Paid" },
      { id: "inv2", date: "2026-06-15", description: "Implant Deposit", amount: 12000, status: "Overdue" },
    ],
  },
};

export const patients: Patient[] = patientsSeed.map((p) => ({
  ...p,
  medicalHistory: patientExtras[p.id]?.medicalHistory ?? defaultMedicalHistory,
  followUps: patientExtras[p.id]?.followUps ?? [],
  images: patientExtras[p.id]?.images ?? [],
  reports: patientExtras[p.id]?.reports ?? [],
  invoices:
    patientExtras[p.id]?.invoices ??
    (p.balanceDue > 0
      ? [{ id: `${p.id}-inv1`, date: p.lastVisit === "—" ? p.memberSince : p.lastVisit, description: "Consultation & Treatment", amount: p.balanceDue, status: "Pending" }]
      : []),
}));

export const appointments: Appointment[] = [
  { id: "a1", patientId: "p1", patientName: "Rohan Mehta", avatarInitials: "RM", date: "2026-07-10", time: "09:30 AM", duration: "30 min", type: "Sensitivity Check", status: "confirmed", source: "WhatsApp AI", doctorName: "Dr. Ananya Rao", checkInStatus: "Checked In" },
  { id: "a2", patientId: "p2", patientName: "Sneha Kapoor", avatarInitials: "SK", date: "2026-07-10", time: "11:00 AM", duration: "45 min", type: "Whitening Consultation", status: "confirmed", source: "WhatsApp AI", doctorName: "Dr. Ananya Rao", checkInStatus: "Not Arrived" },
  { id: "a3", patientId: "p3", patientName: "Arjun Verma", avatarInitials: "AV", date: "2026-07-10", time: "02:00 PM", duration: "60 min", type: "Root Canal — Sitting 3", status: "confirmed", source: "WhatsApp AI", doctorName: "Dr. Ananya Rao", checkInStatus: "Not Arrived" },
  { id: "a4", patientId: "p4", patientName: "Priya Nair", avatarInitials: "PN", date: "2026-07-11", time: "10:00 AM", duration: "30 min", type: "Pediatric Checkup", status: "confirmed", source: "WhatsApp AI", doctorName: "Dr. Ananya Rao" },
  { id: "a5", patientId: "p8", patientName: "Meera Iyer", avatarInitials: "MI", date: "2026-07-15", time: "04:00 PM", duration: "40 min", type: "Gum Evaluation", status: "confirmed", source: "WhatsApp AI" },
  { id: "a6", patientId: "p6", patientName: "Isha Chatterjee", avatarInitials: "IC", date: "2026-07-10", time: "12:30 PM", duration: "45 min", type: "Urgent — Wisdom Tooth Pain", status: "pending", source: "WhatsApp AI", requestedAt: "Today, 7:47 AM", notes: "Patient reports severe pain, requested same-day slot." },
  { id: "a7", patientId: "p7", patientName: "Vikram Singh", avatarInitials: "VS", date: "2026-07-14", time: "TBD", duration: "30 min", type: "6-Month Cleaning", status: "pending", source: "WhatsApp AI", requestedAt: "6 days ago", notes: "Patient requested Tuesday, no slot confirmed yet." },
  { id: "a8", patientId: "p5", patientName: "Karan Malhotra", avatarInitials: "KM", date: "2026-07-16", time: "03:00 PM", duration: "30 min", type: "Implant Follow-up", status: "pending", source: "Phone", requestedAt: "1 day ago" },
  { id: "a9", patientId: "p3", patientName: "Arjun Verma", avatarInitials: "AV", date: "2026-07-22", time: "11:30 AM", duration: "30 min", type: "Crown Placement", status: "pending", source: "WhatsApp AI", requestedAt: "3 hours ago" },
  { id: "a10", patientId: "p5", patientName: "Karan Malhotra", avatarInitials: "KM", date: "2026-07-08", time: "10:00 AM", duration: "30 min", type: "Implant Consultation", status: "cancelled", source: "WhatsApp AI", notes: "Cancelled by patient — urgent personal matter." },
  { id: "a11", patientId: "p6", patientName: "Isha Chatterjee", avatarInitials: "IC", date: "2026-06-30", time: "09:00 AM", duration: "30 min", type: "Wisdom Tooth Review", status: "cancelled", source: "Manual", notes: "Rescheduled by clinic due to doctor unavailability." },
  { id: "a12", patientId: "p1", patientName: "Rohan Mehta", avatarInitials: "RM", date: "2026-06-28", time: "09:00 AM", duration: "30 min", type: "Routine Cleaning", status: "completed", source: "WhatsApp AI" },
  { id: "a13", patientId: "p3", patientName: "Arjun Verma", avatarInitials: "AV", date: "2026-06-20", time: "02:00 PM", duration: "60 min", type: "Root Canal — Sitting 2", status: "completed", source: "WhatsApp AI" },
];

export const notifications: NotificationItem[] = [
  { id: "n1", type: "ai", title: "Urgent request flagged", message: "AI flagged Isha Chatterjee's wisdom tooth pain as urgent and is requesting a same-day slot.", time: "5 min ago", read: false },
  { id: "n2", type: "request", title: "New appointment request", message: "Karan Malhotra requested an implant follow-up for 16 Jul, 3:00 PM.", time: "1 hour ago", read: false },
  { id: "n3", type: "reschedule", title: "Reschedule requested", message: "Vikram Singh asked to move his cleaning to next Tuesday — AI is finding a slot.", time: "3 hours ago", read: false },
  { id: "n4", type: "payment", title: "Payment reminder sent", message: "AI sent a balance reminder of ₹8,000 to Arjun Verma via WhatsApp.", time: "Yesterday", read: true },
  { id: "n5", type: "cancellation", title: "Appointment cancelled", message: "Karan Malhotra cancelled his 8 Jul implant consultation.", time: "2 days ago", read: true },
  { id: "n6", type: "system", title: "Weekly summary ready", message: "Your practice summary for last week is ready to view.", time: "3 days ago", read: true },
];

export const broadcasts: BroadcastMessage[] = [
  { id: "b1", title: "Monsoon Oral Care Tips", message: "Rainy season can increase risk of gum infections — here are 3 quick tips to keep your smile healthy this monsoon!", audience: "All Active Patients", sentAt: "2026-07-05", recipients: 214, status: "Sent", delivered: 206, failed: 5, pending: 3 },
  { id: "b2", title: "Independence Day Clinic Hours", message: "We'll be open 10 AM–2 PM on 15 August. Book your slot early via WhatsApp!", audience: "All Patients", sentAt: "2026-08-10", recipients: 0, status: "Scheduled", delivered: 0, failed: 0, pending: 0 },
  { id: "b3", title: "Free Whitening Consultation Week", message: "Book a free whitening consultation this week only — reply BOOK to grab a slot.", audience: "Cosmetic Interest Segment", sentAt: "2026-06-20", recipients: 87, status: "Sent", delivered: 82, failed: 2, pending: 3 },
];

export const weeklyAvailability = [
  { day: "Monday", enabled: true, slots: "9:00 AM – 1:00 PM, 3:00 PM – 7:00 PM" },
  { day: "Tuesday", enabled: true, slots: "9:00 AM – 1:00 PM, 3:00 PM – 7:00 PM" },
  { day: "Wednesday", enabled: true, slots: "9:00 AM – 1:00 PM" },
  { day: "Thursday", enabled: true, slots: "9:00 AM – 1:00 PM, 3:00 PM – 7:00 PM" },
  { day: "Friday", enabled: true, slots: "9:00 AM – 1:00 PM, 3:00 PM – 7:00 PM" },
  { day: "Saturday", enabled: true, slots: "10:00 AM – 4:00 PM" },
  { day: "Sunday", enabled: false, slots: "Closed" },
];

export const quickStats = {
  todayAppointments: 3,
  pendingRequests: 4,
  weeklyRevenue: 186500,
  newPatientsThisMonth: 12,
  avgRating: 4.9,
  completionRate: 96,
};

export function getPatientById(id: string | undefined) {
  return patients.find((p) => p.id === id);
}

export function getAppointmentById(id: string | undefined) {
  return appointments.find((a) => a.id === id);
}
