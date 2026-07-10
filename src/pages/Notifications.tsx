import { Bot, CalendarClock, IndianRupee, XCircle, Info, CheckCheck } from "lucide-react";
import { useAppState } from "@/context/AppStateContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const iconMap = {
  request: CalendarClock,
  reschedule: CalendarClock,
  payment: IndianRupee,
  ai: Bot,
  cancellation: XCircle,
  system: Info,
};

export default function Notifications() {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useAppState();

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground">Updates from your AI receptionist and practice activity.</p>
        </div>
        <Button variant="outline" size="sm" onClick={markAllNotificationsRead}>
          <CheckCheck className="h-4 w-4" />
          Mark all as read
        </Button>
      </div>

      <div className="space-y-3">
        {notifications.map((n) => {
          const Icon = iconMap[n.type];
          return (
            <Card
              key={n.id}
              className={cn("cursor-pointer transition-colors", !n.read && "border-primary/30 bg-secondary/40")}
              onClick={() => markNotificationRead(n.id)}
            >
              <CardContent className="flex items-start gap-4 p-5">
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                    n.type === "ai" && "bg-secondary text-primary",
                    n.type === "payment" && "bg-warning/15 text-warning-foreground",
                    n.type === "cancellation" && "bg-destructive/10 text-destructive",
                    (n.type === "request" || n.type === "reschedule") && "bg-secondary text-primary",
                    n.type === "system" && "bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{n.title}</p>
                    {!n.read && <span className="h-2 w-2 rounded-full bg-primary" />}
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>
                  <p className="mt-1.5 text-xs text-muted-foreground">{n.time}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
