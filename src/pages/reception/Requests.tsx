import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Inbox, Check, X, Bot, Phone, AlertTriangle } from "lucide-react";
import { useAppState } from "@/context/AppStateContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function ReceptionRequests() {
  const navigate = useNavigate();
  const { appointments, setAppointmentStatus } = useAppState();
  const pending = appointments.filter((a) => a.status === "pending");
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleStatus = async (id: string, status: "confirmed" | "cancelled") => {
    setBusyId(id);
    setError(null);
    try {
      await setAppointmentStatus(id, status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update this appointment.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pending Appointment Requests</h1>
        <p className="text-sm text-muted-foreground">
          Requests captured by the AI receptionist over WhatsApp, awaiting front-desk confirmation.
        </p>
      </div>

      {error && (
        <p className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </p>
      )}

      {pending.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Inbox className="h-10 w-10 text-muted-foreground" />
            <p className="font-medium">No pending requests</p>
            <p className="text-sm text-muted-foreground">New AI-booked requests will show up here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {pending.map((a) => (
            <Card key={a.id}>
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                <div className="flex flex-1 items-center gap-4">
                  <Avatar className="h-11 w-11">
                    <AvatarFallback className="bg-secondary text-primary">{a.avatarInitials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{a.patientName}</p>
                      <Badge variant="warning">Pending</Badge>
                      {a.type.toLowerCase().includes("urgent") && <Badge variant="destructive">Urgent</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{a.type}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Requested {a.date} · {a.time} {a.requestedAt && `· ${a.requestedAt}`}
                    </p>
                    {a.notes && <p className="mt-1 text-xs italic text-muted-foreground">"{a.notes}"</p>}
                    <p className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                      {a.source === "WhatsApp AI" ? <Bot className="h-3 w-3" /> : <Phone className="h-3 w-3" />}
                      Booked via {a.source}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigate("/reception/communication")}>
                    View Conversation
                  </Button>
                  <Button variant="success" size="sm" disabled={busyId === a.id} onClick={() => handleStatus(a.id, "confirmed")}>
                    <Check className="h-4 w-4" /> Confirm
                  </Button>
                  <Button variant="destructive" size="sm" disabled={busyId === a.id} onClick={() => handleStatus(a.id, "cancelled")}>
                    <X className="h-4 w-4" /> Decline
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
