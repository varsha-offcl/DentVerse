import { useNavigate } from "react-router-dom";
import { CheckCircle2, Bot, Phone } from "lucide-react";
import { useAppState } from "@/context/AppStateContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import AppointmentActions from "@/components/shared/AppointmentActions";

export default function Confirmed() {
  const navigate = useNavigate();
  const { appointments } = useAppState();
  const confirmed = appointments
    .filter((a) => a.status === "confirmed")
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Confirmed Appointments</h1>
        <p className="text-sm text-muted-foreground">All upcoming visits confirmed with patients.</p>
      </div>

      {confirmed.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <CheckCircle2 className="h-10 w-10 text-muted-foreground" />
            <p className="font-medium">No confirmed appointments yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3">Patient</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Date & Time</th>
                <th className="px-5 py-3">Source</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {confirmed.map((a) => (
                <tr key={a.id} className="transition-colors hover:bg-accent/60">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-secondary text-primary text-xs">{a.avatarInitials}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{a.patientName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{a.type}</td>
                  <td className="px-5 py-3">
                    <span className="font-medium">{a.date}</span>
                    <span className="text-muted-foreground"> · {a.time}</span>
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant="outline" className="gap-1">
                      {a.source === "WhatsApp AI" ? <Bot className="h-3 w-3" /> : <Phone className="h-3 w-3" />}
                      {a.source}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <AppointmentActions appointment={a} />
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/patient/${a.patientId}`)}>
                        View
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
