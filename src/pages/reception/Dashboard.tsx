import { Link, useNavigate } from "react-router-dom";
import {
  CalendarClock,
  UserCheck,
  Inbox,
  RefreshCcw,
  XCircle,
  Search,
  MessagesSquare,
  Receipt,
  Bell,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { useAppState } from "@/context/AppStateContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

function statusBadgeVariant(status: string) {
  switch (status) {
    case "confirmed":
      return "success" as const;
    case "pending":
      return "warning" as const;
    case "cancelled":
      return "destructive" as const;
    default:
      return "muted" as const;
  }
}

const TODAY = new Date().toISOString().slice(0, 10);
const TODAY_LABEL = new Date().toLocaleDateString("en-IN", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

export default function ReceptionDashboard() {
  const navigate = useNavigate();
  const { appointments, notifications, rescheduleRequests, cancellationRequests, profile } = useAppState();

  const todaysAppointments = appointments
    .filter((a) => a.date === TODAY && a.status !== "cancelled")
    .sort((a, b) => a.time.localeCompare(b.time));
  const pending = appointments.filter((a) => a.status === "pending");
  const checkedIn = todaysAppointments.filter((a) => a.checkInStatus && a.checkInStatus !== "Not Arrived").length;
  const rescheduleCount = rescheduleRequests.filter((r) => r.status === "pending").length;
  const cancellationCount = cancellationRequests.filter((r) => r.status === "pending").length;
  const unreadCount = notifications.filter((n) => !n.read).length;

  const statCards = [
    { label: "Today's Appointments", value: todaysAppointments.length, icon: CalendarClock, to: "/reception/appointments", tint: "text-primary bg-secondary" },
    { label: "Checked In Today", value: checkedIn, icon: UserCheck, to: "/reception/checkin", tint: "text-success bg-success/10" },
    { label: "Pending Requests", value: pending.length, icon: Inbox, to: "/reception/requests", tint: "text-warning-foreground bg-warning/15" },
    { label: "Unread Messages", value: unreadCount, icon: Bell, to: "/reception/notifications", tint: "text-primary bg-secondary" },
  ];

  const modules = [
    { label: "Appointment Management", description: "View & manage all appointments", icon: CalendarClock, to: "/reception/appointments" },
    { label: "Check-in / Check-out", description: "Track patients through their visit", icon: UserCheck, to: "/reception/checkin" },
    { label: "Pending Requests", description: `${pending.length} awaiting confirmation`, icon: Inbox, to: "/reception/requests" },
    { label: "Reschedule Requests", description: `${rescheduleCount} awaiting review`, icon: RefreshCcw, to: "/reception/reschedule" },
    { label: "Cancellation Requests", description: `${cancellationCount} awaiting review`, icon: XCircle, to: "/reception/cancellations" },
    { label: "Patient Search", description: "Look up contact & visit info", icon: Search, to: "/reception/patients" },
    { label: "Billing & Payments", description: "Invoices, receipts & payment status", icon: Receipt, to: "/reception/billing" },
    { label: "Communication Center", description: "Monitor AI conversations", icon: MessagesSquare, to: "/reception/communication" },
    { label: "Notifications", description: `${unreadCount} unread`, icon: Bell, to: "/reception/notifications" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Good morning, {profile?.firstName} 👋</h1>
          <p className="text-sm text-muted-foreground">{TODAY_LABEL} · Front desk overview for {profile?.clinicName}.</p>
        </div>
        <Button size="lg" onClick={() => navigate("/reception/checkin")}>
          <UserCheck className="h-4 w-4" />
          Open Check-in Board
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Link key={stat.label} to={stat.to}>
            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                  <p className="mt-1.5 text-2xl font-bold">{stat.value}</p>
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.tint}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Today's Appointments</CardTitle>
            <CardDescription>{todaysAppointments.length} scheduled for today</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/reception/appointments">
              View All <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {todaysAppointments.map((appt) => (
            <div key={appt.id} className="flex items-center gap-4 rounded-lg border border-border p-3">
              <Avatar>
                <AvatarFallback className="bg-secondary text-primary">{appt.avatarInitials}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-semibold">{appt.patientName}</p>
                <p className="text-xs text-muted-foreground">{appt.type} · {appt.doctorName ?? "Unassigned"}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{appt.time}</p>
                <Badge variant={statusBadgeVariant(appt.status)} className="mt-1 capitalize">
                  {appt.status}
                </Badge>
              </div>
              {appt.status === "confirmed" && (
                <Badge variant={appt.checkInStatus && appt.checkInStatus !== "Not Arrived" ? "success" : "outline"}>
                  {appt.checkInStatus ?? "Not Arrived"}
                </Badge>
              )}
            </div>
          ))}
          {todaysAppointments.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">No appointments scheduled for today.</p>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Front Desk Modules</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {modules.map((mod) => (
            <Link key={mod.label} to={mod.to}>
              <Card className="group h-full transition-all hover:-translate-y-0.5 hover:shadow-md">
                <CardContent className="flex h-full flex-col p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-primary">
                    <mod.icon className="h-5 w-5" />
                  </div>
                  <p className="mt-3 text-sm font-semibold">{mod.label}</p>
                  <p className="mt-1 flex-1 text-xs text-muted-foreground">{mod.description}</p>
                  <span className="mt-3 flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    Open <ArrowRight className="h-3 w-3" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
