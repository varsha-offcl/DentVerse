import { Link } from "react-router-dom";
import {
  Users,
  UserCheck,
  UserPlus,
  CalendarClock,
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
import { currentAdmin } from "@/data/roles";
import { monthlyTrends, clinicStats, whatsappAnalytics, broadcastAnalytics } from "@/data/adminData";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

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
  const { appointments } = useAppState();

  const statTiles = [
    { label: "Total Patients", value: clinicStats.totalPatients, icon: Users, tint: "bg-secondary text-primary" },
    { label: "Active Patients", value: clinicStats.activePatients, icon: UserCheck, tint: "bg-success/10 text-success" },
    { label: "New This Month", value: clinicStats.newPatientsThisMonth, icon: UserPlus, tint: "bg-secondary text-primary" },
    { label: "Today's Appointments", value: appointments.filter((a) => a.date === "2026-07-10" && a.status !== "cancelled").length, icon: CalendarClock, tint: "bg-secondary text-primary" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Welcome back, {currentAdmin.name.split(" ")[0]}</h1>
        <p className="text-sm text-muted-foreground">Clinic-wide overview for {currentAdmin.clinic} · Friday, 10 July 2026</p>
      </div>

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
    </div>
  );
}
