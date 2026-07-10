import { useNavigate } from "react-router-dom";
import { XCircle } from "lucide-react";
import { useAppState } from "@/context/AppStateContext";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Cancelled() {
  const navigate = useNavigate();
  const { appointments } = useAppState();
  const cancelled = appointments
    .filter((a) => a.status === "cancelled")
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Cancelled Appointments</h1>
        <p className="text-sm text-muted-foreground">Visits cancelled by patients or the clinic.</p>
      </div>

      {cancelled.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <XCircle className="h-10 w-10 text-muted-foreground" />
            <p className="font-medium">No cancelled appointments</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {cancelled.map((a) => (
            <Card key={a.id} className="border-destructive/20">
              <CardContent className="flex items-center gap-4 p-5">
                <Avatar className="h-11 w-11 opacity-70">
                  <AvatarFallback className="bg-muted text-muted-foreground">{a.avatarInitials}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-muted-foreground line-through">{a.patientName}</p>
                    <Badge variant="destructive">Cancelled</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{a.type} · {a.date} at {a.time}</p>
                  {a.notes && <p className="mt-1 text-xs italic text-muted-foreground">{a.notes}</p>}
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate(`/patient/${a.patientId}`)}>
                  View Patient
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
