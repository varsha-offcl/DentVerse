// Reschedule/cancellation request types — shared between AppStateContext's
// real Supabase-backed data (Milestone 1) and any UI still needing them.
// No seed data here anymore: both were fully wired to real data in
// Milestone 1, so the mock arrays that used to live in this file were dead
// code (nothing imported them by value) and have been removed.

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
