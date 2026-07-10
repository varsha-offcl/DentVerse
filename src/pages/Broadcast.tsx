import * as React from "react";
import { Megaphone, Send, Users, Calendar, CheckCircle2 } from "lucide-react";
import { useAppState } from "@/context/AppStateContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const audiences = [
  "All Active Patients",
  "All Patients",
  "New Patients (Last 30 Days)",
  "Cosmetic Interest Segment",
  "Ortho Patients",
  "Patients with Outstanding Balance",
];

export default function Broadcast() {
  const { broadcasts, addBroadcast, patients } = useAppState();
  const [title, setTitle] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [audience, setAudience] = React.useState(audiences[0]);
  const [sent, setSent] = React.useState(false);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;
    addBroadcast({
      id: `b${Date.now()}`,
      title,
      message,
      audience,
      sentAt: "2026-07-10",
      recipients: patients.length,
      status: "Sent",
    });
    setTitle("");
    setMessage("");
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Broadcast Center</h1>
        <p className="text-sm text-muted-foreground">Send a WhatsApp message to a segment of your patients at once.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-primary" />
              Compose Broadcast
            </CardTitle>
            <CardDescription>Delivered instantly to your selected patient segment on WhatsApp.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSend} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Audience</Label>
                <Select value={audience} onValueChange={setAudience}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {audiences.map((a) => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Monsoon Oral Care Tips" />
              </div>
              <div className="space-y-1.5">
                <Label>Message</Label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write the WhatsApp message that will be sent..."
                  rows={5}
                />
              </div>
              <Button type="submit" className="w-full">
                <Send className="h-4 w-4" />
                Send Broadcast
              </Button>
              {sent && (
                <p className="flex items-center gap-1.5 text-sm text-success">
                  <CheckCircle2 className="h-4 w-4" /> Broadcast sent successfully!
                </p>
              )}
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Broadcast History</CardTitle>
            <CardDescription>Previously sent and scheduled messages.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {broadcasts.map((b) => (
              <div key={b.id} className="rounded-lg border border-border p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold">{b.title}</p>
                  <Badge variant={b.status === "Sent" ? "success" : b.status === "Scheduled" ? "warning" : "muted"}>
                    {b.status}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{b.message}</p>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" /> {b.audience}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {b.sentAt}
                  </span>
                  {b.recipients > 0 && <span>{b.recipients} recipients</span>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
