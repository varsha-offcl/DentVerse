import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Check, X, Bot, Phone, UserCheck } from "lucide-react";
import { useAppState } from "@/context/AppStateContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

export default function AppointmentManagement() {
  const navigate = useNavigate();
  const { appointments, setAppointmentStatus } = useAppState();
  const [tab, setTab] = React.useState("all");

  const filtered = appointments
    .filter((a) => tab === "all" || a.status === tab)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Appointment Management</h1>
        <p className="text-sm text-muted-foreground">Full visibility into every appointment across the clinic.</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="space-y-3">
          {filtered.map((a) => (
            <Card key={a.id}>
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                <div className="flex flex-1 items-center gap-4">
                  <Avatar className="h-11 w-11">
                    <AvatarFallback className="bg-secondary text-primary">{a.avatarInitials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{a.patientName}</p>
                      <Badge variant={statusBadgeVariant(a.status)} className="capitalize">{a.status}</Badge>
                      {a.checkInStatus && a.checkInStatus !== "Not Arrived" && (
                        <Badge variant="outline" className="gap-1"><UserCheck className="h-3 w-3" /> {a.checkInStatus}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{a.type} · {a.doctorName ?? "Unassigned"}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{a.date} · {a.time} · {a.duration}</p>
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                      {a.source === "WhatsApp AI" ? <Bot className="h-3 w-3" /> : <Phone className="h-3 w-3" />}
                      Booked via {a.source}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  {a.status === "pending" && (
                    <>
                      <Button variant="success" size="sm" onClick={() => setAppointmentStatus(a.id, "confirmed")}>
                        <Check className="h-4 w-4" /> Confirm
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => setAppointmentStatus(a.id, "cancelled")}>
                        <X className="h-4 w-4" /> Decline
                      </Button>
                    </>
                  )}
                  {a.status === "confirmed" && a.date === "2026-07-10" && (
                    <Button variant="outline" size="sm" onClick={() => navigate("/reception/checkin")}>
                      <UserCheck className="h-4 w-4" /> Check-in
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <p className="py-16 text-center text-sm text-muted-foreground">No appointments in this view.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
