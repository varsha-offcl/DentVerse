import * as React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { useAppState } from "@/context/AppStateContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const monthDays = Array.from({ length: 31 }, (_, i) => i + 1);
const weekDayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
// July 2026: 1 Jul 2026 is a Wednesday
const firstDayOffset = 3;

function statusColor(status: string) {
  switch (status) {
    case "confirmed":
      return "bg-primary";
    case "pending":
      return "bg-warning";
    case "cancelled":
      return "bg-destructive/70";
    default:
      return "bg-muted-foreground";
  }
}

export default function CalendarView() {
  const navigate = useNavigate();
  const { appointments } = useAppState();
  const [selectedDay, setSelectedDay] = React.useState(10);

  const apptsByDay: Record<number, typeof appointments> = {};
  appointments.forEach((a) => {
    const day = parseInt(a.date.split("-")[2], 10);
    if (a.date.startsWith("2026-07")) {
      apptsByDay[day] = apptsByDay[day] ? [...apptsByDay[day], a] : [a];
    }
  });

  const selectedAppts = (apptsByDay[selectedDay] || []).sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
          <p className="text-sm text-muted-foreground">Full schedule across all appointment statuses.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold">July 2026</span>
          <Button variant="outline" size="icon">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="p-4">
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
              {weekDayLabels.map((d) => (
                <div key={d} className="py-2">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDayOffset }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {monthDays.map((day) => {
                const dayAppts = apptsByDay[day] || [];
                const isSelected = day === selectedDay;
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={cn(
                      "flex h-20 flex-col items-start rounded-lg border p-1.5 text-left transition-colors",
                      isSelected ? "border-primary bg-secondary" : "border-border hover:bg-accent",
                      day === 10 && !isSelected && "border-primary/50"
                    )}
                  >
                    <span className={cn("text-xs font-semibold", isSelected && "text-primary")}>{day}</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {dayAppts.slice(0, 3).map((a) => (
                        <span key={a.id} className={cn("h-1.5 w-1.5 rounded-full", statusColor(a.status))} />
                      ))}
                    </div>
                    {dayAppts.length > 0 && (
                      <span className="mt-auto text-[10px] text-muted-foreground">{dayAppts.length} appt{dayAppts.length > 1 ? "s" : ""}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h3 className="font-semibold">July {selectedDay}, 2026</h3>
            <p className="text-xs text-muted-foreground">{selectedAppts.length} appointment{selectedAppts.length !== 1 ? "s" : ""}</p>
            <div className="mt-4 space-y-3">
              {selectedAppts.map((a) => (
                <button
                  key={a.id}
                  onClick={() => navigate(`/patient/${a.patientId}`)}
                  className="flex w-full items-start gap-3 rounded-lg border border-border p-3 text-left hover:bg-accent"
                >
                  <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-md bg-secondary text-primary">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{a.patientName}</p>
                    <p className="text-xs text-muted-foreground">{a.type}</p>
                    <p className="text-xs font-medium text-foreground">{a.time}</p>
                  </div>
                  <Badge
                    variant={a.status === "confirmed" ? "success" : a.status === "pending" ? "warning" : a.status === "cancelled" ? "destructive" : "muted"}
                    className="capitalize"
                  >
                    {a.status}
                  </Badge>
                </button>
              ))}
              {selectedAppts.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">No appointments this day.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
