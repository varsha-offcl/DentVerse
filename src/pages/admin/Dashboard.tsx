import * as React from "react";
import { Link } from "react-router-dom";
import {
  Users,
  UserCheck,
  UserPlus,
  CalendarClock,
  CalendarDays,
  Inbox,
  ArrowRight,
  Users2,
  BarChart3,
  ScrollText,
  Stethoscope,
  CheckCircle2,
  Clock,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { useAppState } from "@/context/AppStateContext";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TODAY = new Date().toISOString().slice(0, 10);
const TODAY_LABEL = new Date().toLocaleDateString("en-IN", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

function ChartTooltip({ active, payload, label, formatter }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-foreground">{label}</p>
      <p className="text-muted-foreground">{formatter ? formatter(payload[0].value) : payload[0].value}</p>
    </div>
  );
}

interface DoctorAvailabilityRow {
  day: string;
  enabled: boolean;
  slots: string;
}

const TREND_MONTHS = 6;

export default function AdminDashboard() {
  const { appointments, patients, invoices, staffMembers, loadStaffDirectory, profile } = useAppState();
  const [doctorId, setDoctorId] = React.useState("all");
  const [doctorAvailability, setDoctorAvailability] = React.useState<DoctorAvailabilityRow[]>([]);

  React.useEffect(() => {
    void loadStaffDirectory();
  }, [loadStaffDirectory]);

  const doctors = staffMembers.filter((s) => s.role === "doctor");
  const selectedDoctor = doctors.find((d) => d.id === doctorId);

  React.useEffect(() => {
    if (!selectedDoctor) {
      setDoctorAvailability([]);
      return;
    }
    let active = true;
    supabase
      .from("doctor_availability")
      .select("day_of_week, enabled, slots_label")
      .eq("doctor_id", selectedDoctor.id)
      .then(({ data }) => {
        if (!active) return;
        setDoctorAvailability(
          (data ?? []).map((row) => ({ day: row.day_of_week, enabled: row.enabled, slots: row.slots_label }))
        );
      });
    return () => {
      active = false;
    };
  }, [selectedDoctor]);

  // Real per-month appointments + revenue, computed from this tenant's own
  // data — replaces the previous hardcoded mock trend that showed the same
  // numbers to every clinic regardless of how much (or little) real
  // activity they actually had.
  const monthlyTrends = React.useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: TREND_MONTHS }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (TREND_MONTHS - 1 - i), 1);
      return { key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: d.toLocaleDateString("en-IN", { month: "short" }) };
    });
    return months.map(({ key, label }) => ({
      month: label,
      appointments: appointments.filter((a) => a.date.startsWith(key) && (a.status === "confirmed" || a.status === "completed")).length,
      revenue: invoices
        .filter((inv) => inv.date.startsWith(key) && inv.status === "Paid")
        .reduce((sum, inv) => sum + inv.amount, 0),
    }));
  }, [appointments, invoices]);

  const currentMonthPrefix = TODAY.slice(0, 7);
  const totalPatients = patients.length;
  const activePatients = patients.filter((p) => p.lastVisit !== "—" || p.nextVisit).length;
  const newPatientsThisMonth = patients.filter((p) => p.memberSince.startsWith(currentMonthPrefix)).length;

  const statTiles = [
    { label: "Total Patients", value: totalPatients, icon: Users, tint: "bg-secondary text-primary" },
    { label: "Active Patients", value: activePatients, icon: UserCheck, tint: "bg-success/10 text-success" },
    { label: "New This Month", value: newPatientsThisMonth, icon: UserPlus, tint: "bg-secondary text-primary" },
    { label: "Today's Appointments", value: appointments.filter((a) => a.date === TODAY && a.status !== "cancelled").length, icon: CalendarClock, tint: "bg-secondary text-primary" },
  ];

  const doctorAppointments = selectedDoctor ? appointments.filter((a) => a.doctorId === selectedDoctor.id) : [];
  const doctorNonCancelled = doctorAppointments.filter((a) => a.status !== "cancelled");
  const doctorCompletionRate =
    doctorNonCancelled.length > 0
      ? Math.round((doctorNonCancelled.filter((a) => a.status === "completed").length / doctorNonCancelled.length) * 100)
      : 0;
  const doctorAssignedPatients = new Set(doctorNonCancelled.map((a) => a.patientId)).size;

  const doctorStatTiles = selectedDoctor
    ? [
        {
          label: "Today's Appointments",
          value: doctorAppointments.filter((a) => a.date === TODAY && a.status !== "cancelled").length,
          icon: CalendarDays,
          tint: "bg-secondary text-primary",
        },
        {
          label: "Upcoming Appointments",
          value: doctorAppointments.filter((a) => a.date > TODAY && (a.status === "confirmed" || a.status === "pending")).length,
          icon: CalendarClock,
          tint: "bg-secondary text-primary",
        },
        { label: "Assigned Patients", value: doctorAssignedPatients, icon: Users, tint: "bg-secondary text-primary" },
        {
          label: "Pending Requests",
          value: doctorAppointments.filter((a) => a.status === "pending").length,
          icon: Inbox,
          tint: "bg-warning/15 text-warning-foreground",
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back, {profile?.firstName}</h1>
          <p className="text-sm text-muted-foreground">Clinic-wide overview for {profile?.clinicName} · {TODAY_LABEL}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Doctor Filter</span>
          <Select value={doctorId} onValueChange={setDoctorId}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Doctors</SelectItem>
              {doctors.map((d) => (
                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!selectedDoctor ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statTiles.map((s) => (
              <Card key={s.label}>
                <CardContent className="flex items-center justify-between p-5">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
                    <p className="mt-1.5 text-2xl font-bold">{s.value}</p>
                  </div>
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${s.tint}`}>
                    <s.icon className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Appointment Trends</CardTitle>
                <CardDescription>Confirmed + completed appointments per month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyTrends} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                      <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={{ stroke: "hsl(var(--border))" }} tickLine={false} />
                      <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} width={36} />
                      <Tooltip content={<ChartTooltip />} cursor={{ stroke: "hsl(var(--border))" }} />
                      <Line type="monotone" dataKey="appointments" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3, fill: "hsl(var(--primary))" }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
                <CardDescription>Monthly revenue in ₹</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyTrends} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                      <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={{ stroke: "hsl(var(--border))" }} tickLine={false} />
                      <YAxis
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        width={44}
                        tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip content={<ChartTooltip formatter={(v: number) => `₹${v.toLocaleString("en-IN")}`} />} cursor={{ fill: "hsl(var(--accent))" }} />
                      <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={36} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <p className="text-xs text-muted-foreground">
            No-show rate, AI resolution rate, patient satisfaction, WhatsApp analytics, and broadcast analytics aren't
            available yet — they depend on appointment attendance tracking, the AI Receptionist, a rating system, and
            the WhatsApp/broadcast milestones, none of which exist yet.
          </p>

          <div>
            <h2 className="mb-3 text-lg font-semibold">Manage</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Link to="/admin/staff">
                <Card className="group h-full transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <CardContent className="flex items-center gap-4 p-5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
                      <Users2 className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">Staff Management</p>
                      <p className="text-xs text-muted-foreground">Doctors, receptionists & roles</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </CardContent>
                </Card>
              </Link>
              <Link to="/admin/reports">
                <Card className="group h-full transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <CardContent className="flex items-center gap-4 p-5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
                      <BarChart3 className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">Reports Dashboard</p>
                      <p className="text-xs text-muted-foreground">Exportable clinic reports</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </CardContent>
                </Card>
              </Link>
              <Link to="/admin/logs">
                <Card className="group h-full transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <CardContent className="flex items-center gap-4 p-5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
                      <ScrollText className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">Audit & System Logs</p>
                      <p className="text-xs text-muted-foreground">Staff activity & system health</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </>
      ) : (
        <>
          <Card className="border-primary/20 bg-secondary/30">
            <CardContent className="flex items-center gap-3 p-4">
              <Stethoscope className="h-5 w-5 shrink-0 text-primary" />
              <p className="text-sm text-muted-foreground">
                Showing operational performance for <span className="font-semibold text-foreground">{selectedDoctor.name}</span> —
                clinical records (charts, prescriptions, treatment plans) are not accessible from the Admin Dashboard.
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {doctorStatTiles.map((s) => (
              <Card key={s.label}>
                <CardContent className="flex items-center justify-between p-5">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
                    <p className="mt-1.5 text-2xl font-bold">{s.value}</p>
                  </div>
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${s.tint}`}>
                    <s.icon className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CheckCircle2 className="h-4 w-4 text-success" /> Completion Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{doctorCompletionRate}%</p>
                <Progress value={doctorCompletionRate} className="mt-2" />
              </CardContent>
            </Card>
          </div>
          <p className="text-xs text-muted-foreground">
            Revenue, no-show rate, follow-up completion, patient satisfaction, AI resolution, and broadcast stats aren't
            available yet — they depend on billing attribution, follow-up tracking, a rating system, and the AI
            receptionist/broadcast milestones, none of which exist yet.
          </p>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" /> Availability Schedule
                </CardTitle>
                <CardDescription>Read-only — set by the doctor</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {doctorAvailability.map((d) => (
                  <div key={d.day} className="flex items-center justify-between rounded-md px-2 py-1.5">
                    <span className="text-sm font-medium">{d.day}</span>
                    {d.enabled ? (
                      <span className="text-xs text-muted-foreground">{d.slots}</span>
                    ) : (
                      <Badge variant="muted">Closed</Badge>
                    )}
                  </div>
                ))}
                {doctorAvailability.length === 0 && (
                  <p className="py-4 text-center text-sm text-muted-foreground">No availability set yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
