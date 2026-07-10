// Reception-specific mock data: reschedule/cancellation requests awaiting front-desk action.

export interface RescheduleRequest {
  id: string;
  patientId: string;
  patientName: string;
  avatarInitials: string;
  appointmentId: string;
  currentDate: string;
  currentTime: string;
  requestedDate: string;
  requestedTime: string;
  reason: string;
  requestedAt: string;
  status: "pending" | "approved" | "denied";
}

export interface CancellationRequest {
  id: string;
  patientId: string;
  patientName: string;
  avatarInitials: string;
  appointmentId: string;
  date: string;
  time: string;
  type: string;
  reason: string;
  requestedAt: string;
  status: "pending" | "approved" | "denied";
}

export const rescheduleRequests: RescheduleRequest[] = [
  {
    id: "rr1",
    patientId: "p7",
    patientName: "Vikram Singh",
    avatarInitials: "VS",
    appointmentId: "a7",
    currentDate: "2026-07-14",
    currentTime: "TBD",
    requestedDate: "2026-07-15",
    requestedTime: "10:00 AM",
    reason: "Prefers Tuesday morning due to work schedule.",
    requestedAt: "6 days ago",
    status: "pending",
  },
  {
    id: "rr2",
    patientId: "p8",
    patientName: "Meera Iyer",
    avatarInitials: "MI",
    appointmentId: "a5",
    currentDate: "2026-07-15",
    currentTime: "4:00 PM",
    requestedDate: "2026-07-17",
    requestedTime: "5:00 PM",
    reason: "Family event on original date.",
    requestedAt: "1 hour ago",
    status: "pending",
  },
];

export const cancellationRequests: CancellationRequest[] = [
  {
    id: "cr1",
    patientId: "p5",
    patientName: "Karan Malhotra",
    avatarInitials: "KM",
    appointmentId: "a8",
    date: "2026-07-16",
    time: "3:00 PM",
    type: "Implant Follow-up",
    reason: "Traveling for work, will rebook next month.",
    requestedAt: "2 hours ago",
    status: "pending",
  },
];
