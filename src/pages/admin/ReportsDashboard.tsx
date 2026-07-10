import * as React from "react";
import {
  FileBarChart,
  Users,
  CalendarClock,
  IndianRupee,
  Users2,
  MessageCircle,
  Megaphone,
  Download,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const REPORTS = [
  { id: "r1", title: "Patient Report", description: "New, active, and inactive patients over a date range", icon: Users },
  { id: "r2", title: "Appointment Report", description: "Bookings, cancellations, and no-shows by doctor", icon: CalendarClock },
  { id: "r3", title: "Revenue Report", description: "Revenue breakdown by treatment type and doctor", icon: IndianRupee },
  { id: "r4", title: "Staff Performance Report", description: "Doctor and receptionist productivity metrics", icon: Users2 },
  { id: "r5", title: "WhatsApp Communication Report", description: "Message volume, AI resolution, and escalations", icon: MessageCircle },
  { id: "r6", title: "Broadcast Report", description: "Delivery rates and engagement by campaign", icon: Megaphone },
];

export default function ReportsDashboard() {
  const [generating, setGenerating] = React.useState<string | null>(null);
  const [ready, setReady] = React.useState<Record<string, boolean>>({});

  const generate = (id: string) => {
    setGenerating(id);
    setTimeout(() => {
      setGenerating(null);
      setReady((prev) => ({ ...prev, [id]: true }));
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports Dashboard</h1>
        <p className="text-sm text-muted-foreground">Generate exportable reports across every part of the clinic.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map((r) => (
          <Card key={r.id}>
            <CardContent className="flex h-full flex-col p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-primary">
                <r.icon className="h-5 w-5" />
              </div>
              <p className="mt-3 text-sm font-semibold">{r.title}</p>
              <p className="mt-1 flex-1 text-xs text-muted-foreground">{r.description}</p>
              <Button
                size="sm"
                variant={ready[r.id] ? "outline" : "secondary"}
                className="mt-4"
                disabled={generating === r.id}
                onClick={() => generate(r.id)}
              >
                {generating === r.id ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating...
                  </>
                ) : ready[r.id] ? (
                  <>
                    <Download className="h-3.5 w-3.5" /> Download PDF
                  </>
                ) : (
                  <>
                    <FileBarChart className="h-3.5 w-3.5" /> Generate Report
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
