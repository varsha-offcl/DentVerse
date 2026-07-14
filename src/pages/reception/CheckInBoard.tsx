import * as React from "react";
import { useAppState } from "@/context/AppStateContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Clock, UserCheck, Stethoscope, LogOut, Circle, AlertTriangle } from "lucide-react";
import type { CheckInStatus } from "@/data/mockData";
import { cn } from "@/lib/utils";

const TODAY = new Date().toISOString().slice(0, 10);

const COLUMNS: { status: CheckInStatus; label: string; icon: React.ElementType; next?: CheckInStatus; nextLabel?: string; tint: string }[] = [
  { status: "Not Arrived", label: "Not Arrived", icon: Clock, next: "Checked In", nextLabel: "Check In", tint: "text-muted-foreground" },
  { status: "Checked In", label: "Checked In", icon: UserCheck, next: "In Treatment", nextLabel: "Start Treatment", tint: "text-primary" },
  { status: "In Treatment", label: "In Treatment", icon: Stethoscope, next: "Checked Out", nextLabel: "Check Out", tint: "text-warning-foreground" },
  { status: "Checked Out", label: "Checked Out", icon: LogOut, tint: "text-success" },
];

export default function CheckInBoard() {
  const { appointments, setAppointmentCheckIn } = useAppState();
  const [movingId, setMovingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // "Checked Out" flips the appointment's status to "completed" (see
  // AppStateContext.setAppointmentCheckIn) so a finished visit stays
  // visible in its column instead of disappearing from the board.
  const todaysConfirmed = appointments.filter(
    (a) => a.date === TODAY && (a.status === "confirmed" || a.status === "completed")
  );

  const handleMove = async (appointmentId: string, next: CheckInStatus | undefined) => {
    if (!next) return;
    setMovingId(appointmentId);
    setError(null);
    try {
      await setAppointmentCheckIn(appointmentId, next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update this patient's status.");
    } finally {
      setMovingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Check-in / Check-out</h1>
        <p className="text-sm text-muted-foreground">Track today's patients as they move through their visit.</p>
      </div>

      {error && (
        <p className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col) => {
          const items = todaysConfirmed.filter((a) => (a.checkInStatus ?? "Not Arrived") === col.status);
          return (
            <Card key={col.status} className="flex flex-col">
              <CardHeader className="flex-row items-center gap-2 space-y-0 pb-3">
                <col.icon className={cn("h-4 w-4", col.tint)} />
                <CardTitle className="text-sm">{col.label}</CardTitle>
                <span className="ml-auto text-xs text-muted-foreground">{items.length}</span>
              </CardHeader>
              <CardContent className="flex-1 space-y-2">
                {items.map((a) => (
                  <div key={a.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-secondary text-xs text-primary">{a.avatarInitials}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{a.patientName}</p>
                        <p className="truncate text-[11px] text-muted-foreground">{a.time} · {a.type}</p>
                      </div>
                    </div>
                    {col.next && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2 w-full"
                        disabled={movingId === a.id}
                        onClick={() => handleMove(a.id, col.next)}
                      >
                        {movingId === a.id ? "Updating..." : col.nextLabel}
                      </Button>
                    )}
                  </div>
                ))}
                {items.length === 0 && (
                  <div className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-8 text-center">
                    <Circle className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">No patients here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
