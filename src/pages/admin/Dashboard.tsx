import * as React from "react";
import { Link } from "react-router-dom";
import {
  Users,
  UserCheck,
  UserPlus,
  CalendarClock,
  CalendarDays,
  Inbox,
  TrendingDown,
  Bot,
  Star,
  IndianRupee,
  Megaphone,
  MessageCircle,
  ArrowRight,
  Users2,
  BarChart3,
  ScrollText,
  Stethoscope,
  CheckCircle2,
  RotateCcw,
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
import { staffDoctors } from "@/data/roles";
import { monthlyTrends, clinicStats, whatsappAnalytics, broadcastAnalytics } from "@/data/adminData";
import { weeklyAvailability } from "@/data/mockData";
// clinicStats.totalPatients/activePatients/newPatientsThisMonth are NOT
// used below — computed from real `patients` instead. noShowRate,
// aiResolutionRate (needs M5), and patientSatisfaction (no rating system
// exists) remain correctly mock.
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

export default function AdminDashboard() {
  const { appointments, patients, profile } = useAppState();
  const [doctorId, setDoctorId] = React.useState("all");

  const selectedDoctor = staffDoctors.find((d) => d.id === doctorId);

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

  const doctorStatTiles = selectedDoctor
    ? [
        {
          label: "Today's Appointments",
          value: appointments.filter((a) => a.doctorName === selectedDoctor.name && a.date === TODAY && a.status !== "cancelled").length,
          icon: CalendarDays,
          tint: "bg-secondary text-primary",
        },
        {
          label: "Upcoming Appointments",
          value: appointments.filter((a) => a.doctorName === selectedDoctor.name && a.date > TODAY && (a.status === "confirmed" || a.status === "pending")).length,
          icon: CalendarClock,
          tint: "bg-secondary text-primary",
        },
        { label: "Assigned Patients", value: selectedDoctor.patientsCount, icon: Users, tint: "bg-secondary text-primary" },
        {
          label: "Pending Requests",
          value: appointments.filter((a) => a.doctorName === selectedDoctor.name && a.status === "pending").length,
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
              {staffDoctors.map((d) => (
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

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingDown className="h-4 w-4 text-destructive" /> No-show Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{clinicStats.noShowRate}%</p>
                <Progress value={clinicStats.noShowRate} className="mt-3" />
                <p className="mt-2 text-xs text-muted-foreground">Down from 9.1% last quarter</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Bot className="h-4 w-4 text-primary" /> AI Resolution Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{clinicStats.aiResolutionRate}%</p>
                <Progress value={clinicStats.aiResolutionRate} className="mt-3" />
                <p className="mt-2 text-xs text-muted-foreground">Conversations resolved without human escalation</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Star className="h-4 w-4 text-warning-foreground" /> Patient Satisfaction
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{clinicStats.patientSatisfaction}/5</p>
                <Progress value={clinicStats.patientSatisfaction * 20} className="mt-3" />
                <p className="mt-2 text-xs text-muted-foreground">Based on post-visit WhatsApp surveys</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-primary" /> WhatsApp Analytics
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Messages Sent</p>
                  <p className="text-xl font-bold">{whatsappAnalytics.messagesSent.toLocaleString("en-IN")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Messages Received</p>
                  <p className="text-xl font-bold">{whatsappAnalytics.messagesReceived.toLocaleString("en-IN")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Delivery Rate</p>
                  <p className="text-xl font-bold text-success">{whatsappAnalytics.deliveryRate}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Avg Response Time</p>
                  <p className="text-xl font-bold">{whatsappAnalytics.avgResponseTimeSec}s</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-primary" /> Broadcast Analytics
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Total Broadcasts</p>
                  <p className="text-xl font-bold">{broadcastAnalytics.totalBroadcasts}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Recipients</p>
                  <p className="text-xl font-bold">{broadcastAnalytics.totalRecipients.toLocaleString("en-IN")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Avg Delivery</p>
                  <p className="text-xl font-bold text-success">{broadcastAnalytics.avgDeliveryRate}%</p>
                </div>
              </CardContent>
            </Card>
          </div>

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
                  <IndianRupee className="h-4 w-4 text-success" /> Revenue Generated
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">₹{selectedDoctor.revenueThisMonth.toLocaleString("en-IN")}</p>
                <p className="mt-1 text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CheckCircle2 className="h-4 w-4 text-success" /> Completion Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{selectedDoctor.completionRate}%</p>
                <Progress value={selectedDoctor.completionRate} className="mt-2" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingDown className="h-4 w-4 text-destructive" /> No-show Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{selectedDoctor.noShowRate}%</p>
                <Progress value={selectedDoctor.noShowRate} className="mt-2" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <RotateCcw className="h-4 w-4 text-primary" /> Follow-up Completion
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{selectedDoctor.followUpCompletionRate}%</p>
                <Progress value={selectedDoctor.followUpCompletionRate} className="mt-2" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Star className="h-4 w-4 text-warning-foreground" /> Patient Satisfaction
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{selectedDoctor.rating}/5</p>
                <Progress value={selectedDoctor.rating * 20} className="mt-2" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Bot className="h-4 w-4 text-primary" /> AI Resolution Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{selectedDoctor.aiResolutionRate}%</p>
                <Progress value={selectedDoctor.aiResolutionRate} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-primary" /> Broadcast Statistics
                </CardTitle>
                <CardDescription>Broadcasts sent to this doctor's patients</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Broadcasts Sent</p>
                  <p className="text-xl font-bold">{selectedDoctor.broadcastsSent}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Avg Delivery Rate</p>
                  <p className="text-xl font-bold text-success">{selectedDoctor.broadcastDeliveryRate}%</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" /> Availability Schedule
                </CardTitle>
                <CardDescription>Read-only — set by the doctor</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {weeklyAvailability.map((d) => (
                  <div key={d.day} className="flex items-center justify-between rounded-md px-2 py-1.5">
                    <span className="text-sm font-medium">{d.day}</span>
                    {d.enabled ? (
                      <span className="text-xs text-muted-foreground">{d.slots}</span>
                    ) : (
                      <Badge variant="muted">Closed</Badge>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
