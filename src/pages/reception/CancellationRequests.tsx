import { XCircle, Check, X } from "lucide-react";
import { useAppState } from "@/context/AppStateContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function CancellationRequestsPage() {
  const { cancellationRequests, approveCancellation, denyCancellation } = useAppState();
  const pending = cancellationRequests.filter((r) => r.status === "pending");
  const resolved = cancellationRequests.filter((r) => r.status !== "pending");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pending Cancellation Requests</h1>
        <p className="text-sm text-muted-foreground">Patients asking to cancel an upcoming appointment.</p>
      </div>

      {pending.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <XCircle className="h-10 w-10 text-muted-foreground" />
            <p className="font-medium">No pending cancellation requests</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {pending.map((r) => (
            <Card key={r.id} className="border-destructive/20">
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                <div className="flex flex-1 items-center gap-4">
                  <Avatar className="h-11 w-11">
                    <AvatarFallback className="bg-secondary text-primary">{r.avatarInitials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold">{r.patientName}</p>
                    <p className="text-sm text-muted-foreground">{r.type} · {r.date} at {r.time}</p>
                    <p className="mt-1 text-xs italic text-muted-foreground">"{r.reason}"</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">Requested {r.requestedAt}</p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button variant="success" size="sm" onClick={() => approveCancellation(r.id)}>
                    <Check className="h-4 w-4" /> Approve Cancellation
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => denyCancellation(r.id)}>
                    <X className="h-4 w-4" /> Keep Appointment
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
                  <p className="text-sm">{r.patientName} · {r.date} {r.time}</p>
                  <Badge variant={r.status === "approved" ? "destructive" : "success"} className="capitalize">
                    {r.status === "approved" ? "Cancelled" : "Kept"}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
