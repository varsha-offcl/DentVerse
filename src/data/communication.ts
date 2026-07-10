// Communication Center mock data — monitors AI-handled WhatsApp conversations and outgoing messages.

export type ConversationStatus = "Active" | "Awaiting Patient Reply" | "Awaiting Doctor Approval" | "Escalated" | "Completed";
export type IncomingCategory = "New" | "AI Responded" | "Waiting for Patient Reply" | "Escalated" | "Unread";

export interface TimelineStage {
  label: string;
  done: boolean;
  timestamp?: string;
}

export const PIPELINE_STAGE_LABELS = [
  "Patient Message",
  "AI Reply",
  "Appointment Requested",
  "Doctor Approval",
  "Appointment Confirmed",
  "Reminder Scheduled",
  "Prescription Sent",
  "Follow-up Scheduled",
] as const;

export interface Conversation {
  id: string;
  patientName: string;
  avatarInitials: string;
  phone: string;
  lastMessage: string;
  lastMessageAt: string;
  status: ConversationStatus;
  incomingCategory: IncomingCategory;
  unread: boolean;
  timeline: TimelineStage[];
}

function buildTimeline(doneCount: number, timestamps: string[]): TimelineStage[] {
  return PIPELINE_STAGE_LABELS.map((label, i) => ({
    label,
    done: i < doneCount,
    timestamp: i < doneCount ? timestamps[i] : undefined,
  }));
}

export const conversations: Conversation[] = [
  {
    id: "conv1",
    patientName: "Isha Chatterjee",
    avatarInitials: "IC",
    phone: "+91 98765 12340",
    lastMessage: "Yes it's pretty bad",
    lastMessageAt: "Today, 7:46 AM",
    status: "Awaiting Doctor Approval",
    incomingCategory: "Escalated",
    unread: true,
    timeline: buildTimeline(3, ["Today, 7:45 AM", "Today, 7:46 AM", "Today, 7:47 AM"]),
  },
  {
    id: "conv2",
    patientName: "Karan Malhotra",
    avatarInitials: "KM",
    phone: "+91 91234 87654",
    lastMessage: "I want to cancel my appointment this week, something urgent came up.",
    lastMessageAt: "1 day ago",
    status: "Awaiting Doctor Approval",
    incomingCategory: "New",
    unread: true,
    timeline: buildTimeline(2, ["1 day ago", "1 day ago"]),
  },
  {
    id: "conv3",
    patientName: "Vikram Singh",
    avatarInitials: "VS",
    phone: "+91 90909 45678",
    lastMessage: "Got it — I don't have a Tuesday slot yet, checking with the clinic and will confirm shortly.",
    lastMessageAt: "6 days ago",
    status: "Awaiting Patient Reply",
    incomingCategory: "Waiting for Patient Reply",
    unread: false,
    timeline: buildTimeline(2, ["6 days ago", "6 days ago"]),
  },
  {
    id: "conv4",
    patientName: "Sneha Kapoor",
    avatarInitials: "SK",
    phone: "+91 90040 55621",
    lastMessage: "Confirmed ✅ Please arrive 10 mins early for a quick intake form. See you Friday!",
    lastMessageAt: "Mon, 11:06 AM",
    status: "Completed",
    incomingCategory: "AI Responded",
    unread: false,
    timeline: buildTimeline(5, ["Mon", "Mon", "Mon", "Mon", "Mon"]),
  },
  {
    id: "conv5",
    patientName: "Rohan Mehta",
    avatarInitials: "RM",
    phone: "+91 98200 11234",
    lastMessage: "Reminder: your appointment is in 1 hour at DentVerse Smile Studio. See you soon!",
    lastMessageAt: "Today, 8:30 AM",
    status: "Completed",
    incomingCategory: "AI Responded",
    unread: false,
    timeline: buildTimeline(6, ["Yesterday", "Yesterday", "Yesterday", "Yesterday", "Yesterday", "Today, 8:30 AM"]),
  },
  {
    id: "conv6",
    patientName: "Arjun Verma",
    avatarInitials: "AV",
    phone: "+91 87654 33210",
    lastMessage: "Sure, moved to 10 July at 2:00 PM. You're all set.",
    lastMessageAt: "2 days ago",
    status: "Active",
    incomingCategory: "AI Responded",
    unread: false,
    timeline: buildTimeline(5, ["2 days ago", "2 days ago", "2 days ago", "2 days ago", "2 days ago"]),
  },
  {
    id: "conv7",
    patientName: "Meera Iyer",
    avatarInitials: "MI",
    phone: "+91 88990 12345",
    lastMessage: "Works for me.",
    lastMessageAt: "1 week ago",
    status: "Completed",
    incomingCategory: "AI Responded",
    unread: false,
    timeline: buildTimeline(5, ["1 week ago", "1 week ago", "1 week ago", "1 week ago", "1 week ago"]),
  },
  {
    id: "conv8",
    patientName: "Priya Nair",
    avatarInitials: "PN",
    phone: "+91 99887 66554",
    lastMessage: "Perfect, yes.",
    lastMessageAt: "3 days ago",
    status: "Completed",
    incomingCategory: "Unread",
    unread: true,
    timeline: buildTimeline(5, ["3 days ago", "3 days ago", "3 days ago", "3 days ago", "3 days ago"]),
  },
];

export type OutgoingCategory =
  | "Appointment Confirmation"
  | "Reminder"
  | "Follow-up"
  | "Prescription PDF"
  | "Treatment Plan"
  | "Birthday Wish"
  | "Recall Reminder"
  | "Broadcast";

export interface OutgoingMessage {
  id: string;
  category: OutgoingCategory;
  patientName: string;
  message: string;
  sentAt: string;
  status: "Delivered" | "Failed" | "Pending";
}

export const outgoingMessages: OutgoingMessage[] = [
  { id: "out1", category: "Appointment Confirmation", patientName: "Sneha Kapoor", message: "Your whitening consultation is confirmed for Fri, 10 Jul at 11:00 AM.", sentAt: "Mon, 11:06 AM", status: "Delivered" },
  { id: "out2", category: "Reminder", patientName: "Rohan Mehta", message: "Reminder: your appointment is in 1 hour at DentVerse Smile Studio.", sentAt: "Today, 8:30 AM", status: "Delivered" },
  { id: "out3", category: "Follow-up", patientName: "Arjun Verma", message: "How are you feeling after your root canal sitting? Let us know if there's any discomfort.", sentAt: "2 days ago", status: "Delivered" },
  { id: "out4", category: "Prescription PDF", patientName: "Rohan Mehta", message: "Your digitally signed prescription is attached.", sentAt: "2026-06-28", status: "Delivered" },
  { id: "out5", category: "Treatment Plan", patientName: "Arjun Verma", message: "Your approved treatment plan — Root Canal Therapy + Crown — is attached.", sentAt: "2026-06-05", status: "Delivered" },
  { id: "out6", category: "Birthday Wish", patientName: "Meera Iyer", message: "🎂 Happy Birthday Meera! Enjoy 15% off your next cosmetic visit this month.", sentAt: "3 days ago", status: "Delivered" },
  { id: "out7", category: "Recall Reminder", patientName: "Vikram Singh", message: "It's been 6 months since your last cleaning — time to book your next visit!", sentAt: "6 days ago", status: "Delivered" },
  { id: "out8", category: "Broadcast", patientName: "All Active Patients", message: "Monsoon Oral Care Tips — 3 quick tips to keep your smile healthy this season.", sentAt: "2026-07-05", status: "Delivered" },
  { id: "out9", category: "Reminder", patientName: "Karan Malhotra", message: "Reminder: your implant follow-up is tomorrow at 3:00 PM.", sentAt: "1 day ago", status: "Failed" },
  { id: "out10", category: "Appointment Confirmation", patientName: "Priya Nair", message: "Your daughter's pediatric checkup is confirmed for Sat, 11 Jul at 10:00 AM.", sentAt: "3 days ago", status: "Delivered" },
  { id: "out11", category: "Prescription PDF", patientName: "Arjun Verma", message: "Your digitally signed prescription is attached.", sentAt: "2026-06-20", status: "Pending" },
  { id: "out12", category: "Follow-up", patientName: "Isha Chatterjee", message: "We've flagged your case as urgent — the clinic will confirm a slot shortly.", sentAt: "Today, 7:47 AM", status: "Delivered" },
];
