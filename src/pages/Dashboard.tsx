import { Link, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Inbox,
  CheckCircle2,
  XCircle,
  Users,
  Bell,
  Clock,
  Megaphone,
  Mic,
  TrendingUp,
  IndianRupee,
  Star,
  UserPlus,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { useAppState } from "@/context/AppStateContext";
import { quickStats } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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

export default function Dashboard() {
  const navigate = useNavigate();
  const { appointments, notifications, patients, invoices, profile } = useAppState();

  const today = new Date().toISOString().slice(0, 10);
  const todayLabel = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const todaysAppointments = appointments
    .filter((a) => a.date === today && a.status !== "cancelled")
    .sort((a, b) => a.time.localeCompare(b.time));
  const pending = appointments.filter((a) => a.status === "pending");
  const unreadNotifications = notifications.filter((n) => !n.read).slice(0, 4);

  // Computable from real M1/M2 data — not from quickStats.
  const currentMonthPrefix = today.slice(0, 7);
  const newPatientsThisMonth = patients.filter((p) => p.memberSince.startsWith(currentMonthPrefix)).length;
  const nonCancelledAppointments = appointments.filter((a) => a.status !== "cancelled");
  const completionRate =
    nonCancelledAppointments.length > 0
      ? Math.round(
          (appointments.filter((a) => a.status === "completed").length / nonCancelledAppointments.length) * 100
        )
      : 0;
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().slice(0, 10);
  const weeklyRevenue = invoices
    .filter((inv) => inv.date >= sevenDaysAgoStr && inv.date <= today)
    .reduce((sum, inv) => {
      if (inv.status === "Paid") return sum + inv.amount;
      if (inv.status === "Partially Paid") return sum + (inv.amountPaid ?? 0);
      return sum;
    }, 0);

  const statCards = [
    { label: "Today's Appointments", value: todaysAppointments.length, icon: CalendarDays, to: "/dashboard/calendar", tint: "text-primary bg-secondary" },
    { label: "Pending Requests", value: pending.length, icon: Inbox, to: "/dashboard/requests", tint: "text-warning-foreground bg-warning/15" },
    { label: "Weekly Revenue", value: `₹${weeklyRevenue.toLocaleString("en-IN")}`, icon: IndianRupee, to: "/dashboard/confirmed", tint: "text-success bg-success/10" },
    { label: "New Patients (Month)", value: newPatientsThisMonth, icon: UserPlus, to: "/dashboard/patients", tint: "text-primary bg-secondary" },
  ];

  const modules = [
    { label: "Calendar", description: "Full schedule view", icon: CalendarDays, to: "/dashboard/calendar" },
    { label: "Pending Requests", description: `${pending.length} awaiting review`, icon: Inbox, to: "/dashboard/requests" },
    { label: "Confirmed Appointments", description: "Upcoming confirmed visits", icon: CheckCircle2, to: "/dashboard/confirmed" },
    { label: "Cancelled Appointments", description: "Recently cancelled visits", icon: XCircle, to: "/dashboard/cancelled" },
    { label: "Patient List", description: `${patients.length} active patients`, icon: Users, to: "/dashboard/patients" },
    { label: "Notifications", description: `${unreadNotifications.length} unread`, icon: Bell, to: "/dashboard/notifications" },
    { label: "Availability Management", description: "Set your working hours", icon: Clock, to: "/dashboard/availability" },
    { label: "Broadcast Center", description: "Message patient segments", icon: Megaphone, to: "/dashboard/broadcast" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Good morning, {profile?.firstName} 👋</h1>
          <p className="text-sm text-muted-foreground">{todayLabel} · Here's what's happening at {profile?.clinicName} today.</p>
        </div>
        <Button size="lg" onClick={() => navigate("/dashboard/patients")}>
          <Mic className="h-4 w-4" />
          Start Voice-to-Chart
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Today's Appointments</CardTitle>
              <CardDescription>{todaysAppointments.length} scheduled for today</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard/calendar">
                View Calendar <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {todaysAppointments.map((appt) => (
              <button
                key={appt.id}
                onClick={() => navigate(`/patient/${appt.patientId}`)}
                className="flex w-full items-center gap-4 rounded-lg border border-border p-3 text-left transition-colors hover:bg-accent"
              >
                <Avatar>
                  <AvatarFallback className="bg-secondary text-primary">{appt.avatarInitials}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{appt.patientName}</p>
                  <p className="text-xs text-muted-foreground">{appt.type} · {appt.duration}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{appt.time}</p>
                  <Badge variant={statusBadgeVariant(appt.status)} className="mt-1 capitalize">
                    {appt.status}
                  </Badge>
                </div>
              </button>
            ))}
            {todaysAppointments.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">No appointments scheduled for today.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Notifications</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard/notifications">
                See all <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {unreadNotifications.map((n) => (
              <div key={n.id} className="rounded-lg border border-border p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium leading-tight">{n.title}</p>
                  <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{n.message}</p>
                <p className="mt-1.5 text-[11px] text-muted-foreground">{n.time}</p>
              </div>
            ))}
            {unreadNotifications.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">You're all caught up!</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Quick Access</h2>
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

      <Card>
        <CardHeader>
          <CardTitle>Quick Statistics</CardTitle>
          <CardDescription>Practice performance at a glance</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-bold">{completionRate}%</p>
              <p className="text-xs text-muted-foreground">Completion Rate</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/15 text-warning-foreground">
              <Star className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-bold">{quickStats.avgRating}/5</p>
              <p className="text-xs text-muted-foreground">Avg. Rating</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-primary">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-bold">{patients.length}</p>
              <p className="text-xs text-muted-foreground">Active Patients</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-primary">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-bold">{newPatientsThisMonth}</p>
              <p className="text-xs text-muted-foreground">New This Month</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
