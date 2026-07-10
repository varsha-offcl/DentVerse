import { RefreshCcw, Check, X, ArrowRight } from "lucide-react";
import { useAppState } from "@/context/AppStateContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function RescheduleRequests() {
  const { rescheduleRequests, approveReschedule, denyReschedule } = useAppState();
  const pending = rescheduleRequests.filter((r) => r.status === "pending");
  const resolved = rescheduleRequests.filter((r) => r.status !== "pending");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pending Reschedule Requests</h1>
        <p className="text-sm text-muted-foreground">Patients asking to move their appointment to a new date or time.</p>
      </div>

      {pending.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <RefreshCcw className="h-10 w-10 text-muted-foreground" />
            <p className="font-medium">No pending reschedule requests</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {pending.map((r) => (
            <Card key={r.id}>
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                <div className="flex flex-1 items-center gap-4">
                  <Avatar className="h-11 w-11">
                    <AvatarFallback className="bg-secondary text-primary">{r.avatarInitials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold">{r.patientName}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                      <span className="text-muted-foreground line-through">{r.currentDate} · {r.currentTime}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-medium text-primary">{r.requestedDate} · {r.requestedTime}</span>
                    </div>
                    <p className="mt-1 text-xs italic text-muted-foreground">"{r.reason}"</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">Requested {r.requestedAt}</p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button variant="success" size="sm" onClick={() => approveReschedule(r.id)}>
                    <Check className="h-4 w-4" /> Approve
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => denyReschedule(r.id)}>
                    <X className="h-4 w-4" /> Deny
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {resolved.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Resolved</h2>
          <div className="space-y-2">
            {resolved.map((r) => (
              <Card key={r.id} className="opacity-70">
                <CardContent className="flex items-center justify-between p-4">
                  <p className="text-sm">{r.patientName} · {r.requestedDate} {r.requestedTime}</p>
                  <Badge variant={r.status === "approved" ? "success" : "destructive"} className="capitalize">{r.status}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
