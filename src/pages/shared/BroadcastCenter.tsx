import * as React from "react";
import {
  Megaphone,
  Send,
  Users,
  Calendar,
  CheckCircle2,
  Sparkles,
  Eye,
  Clock,
  Cake,
  CalendarCheck,
  CalendarX,
  CalendarClock,
  Bell,
  RotateCcw,
  FileText,
  ClipboardList,
  Bot,
  MessageCircle,
} from "lucide-react";
import { useAppState } from "@/context/AppStateContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const audiences = [
  "All Active Patients",
  "All Patients",
  "New Patients (Last 30 Days)",
  "Cosmetic Interest Segment",
  "Ortho Patients",
  "Patients with Outstanding Balance",
];

const AI_TEMPLATES: Record<string, { title: string; message: string }> = {
  "All Active Patients": {
    title: "Keep Your Smile Healthy",
    message: "Hi! Just a friendly reminder from DentVerse Smile Studio to keep up with your oral hygiene routine. Reply to book your next cleaning anytime!",
  },
  "All Patients": {
    title: "We'd Love to See You Again",
    message: "Hi there! It's been a while — we'd love to help you keep your smile in top shape. Reply BOOK to schedule a visit at DentVerse Smile Studio.",
  },
  "New Patients (Last 30 Days)": {
    title: "Welcome to DentVerse!",
    message: "Welcome to the DentVerse family! If you have any questions after your first visit, just reply here — we're always happy to help.",
  },
  "Cosmetic Interest Segment": {
    title: "Free Whitening Consultation",
    message: "Curious about a brighter smile? Book a free whitening consultation this month — reply BOOK to grab a slot before they fill up!",
  },
  "Ortho Patients": {
    title: "Aligner Check-in",
    message: "Just checking in on your aligner progress! Remember to wear them 22 hours a day for the best results. Reply if you have any concerns.",
  },
  "Patients with Outstanding Balance": {
    title: "Friendly Payment Reminder",
    message: "Hi! This is a gentle reminder of your pending balance with DentVerse Smile Studio. Reply here if you'd like a payment link or have questions.",
  },
};

const CAMPAIGN_ICONS: Record<string, React.ElementType> = {
  birthday: Cake,
  "appt-confirmation": CalendarCheck,
  "appt-cancellation": CalendarX,
  "appt-reschedule": CalendarClock,
  "followup-reminders": Bell,
  "recall-6month": RotateCcw,
  "prescription-delivery": FileText,
  "treatment-plan-delivery": ClipboardList,
};

export default function BroadcastCenter() {
  const { broadcasts, addBroadcast, patients, campaigns, toggleCampaign } = useAppState();

  const [title, setTitle] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [audience, setAudience] = React.useState(audiences[0]);
  const [sent, setSent] = React.useState(false);
  const [showPreview, setShowPreview] = React.useState(false);
  const [scheduling, setScheduling] = React.useState(false);
  const [scheduleDate, setScheduleDate] = React.useState("2026-07-15");
  const [scheduleTime, setScheduleTime] = React.useState("10:00");

  const generateWithAi = () => {
    const template = AI_TEMPLATES[audience];
    setTitle(template.title);
    setMessage(template.message);
  };

  const resetForm = () => {
    setTitle("");
    setMessage("");
    setScheduling(false);
  };

  const handleSendNow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;
    addBroadcast({
      id: `b${Date.now()}`,
      title,
      message,
      audience,
      sentAt: "2026-07-11",
      recipients: patients.length,
      status: "Sent",
      delivered: patients.length,
      failed: 0,
      pending: 0,
    });
    resetForm();
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  };

  const handleSchedule = () => {
    if (!title || !message || !scheduleDate || !scheduleTime) return;
    addBroadcast({
      id: `b${Date.now()}`,
      title,
      message,
      audience,
      sentAt: `${scheduleDate} ${scheduleTime}`,
      recipients: patients.length,
      status: "Scheduled",
      delivered: 0,
      failed: 0,
      pending: patients.length,
    });
    resetForm();
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  };

  const enabledCount = campaigns.filter((c) => c.enabled).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Broadcast Center</h1>
        <p className="text-sm text-muted-foreground">Automate routine patient messages with AI, or send manual broadcasts to any segment.</p>
      </div>

      <Tabs defaultValue="automated">
        <TabsList>
          <TabsTrigger value="automated">Automated Campaigns ({enabledCount}/{campaigns.length} active)</TabsTrigger>
          <TabsTrigger value="manual">Manual Broadcasts</TabsTrigger>
        </TabsList>

        <TabsContent value="automated" className="space-y-3">
          <Card className="border-primary/20 bg-secondary/30">
            <CardContent className="flex items-center gap-3 p-4">
              <Bot className="h-5 w-5 shrink-0 text-primary" />
              <p className="text-sm text-muted-foreground">
                When enabled, DentVerse AI sends these messages automatically over WhatsApp — no manual action needed.
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {campaigns.map((c) => {
              const Icon = CAMPAIGN_ICONS[c.id] ?? Bell;
              return (
                <Card key={c.id}>
                  <CardContent className="flex items-start gap-4 p-5">
                    <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", c.enabled ? "bg-secondary text-primary" : "bg-muted text-muted-foreground")}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold">{c.name}</p>
                        <Switch checked={c.enabled} onCheckedChange={() => toggleCampaign(c.id)} />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{c.description}</p>
                      <Badge variant={c.enabled ? "success" : "muted"} className="mt-2">
                        {c.enabled ? "AI Automated" : "Disabled"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="manual">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-primary" />
                  Create Broadcast
                </CardTitle>
                <CardDescription>Personalized and delivered by AI over WhatsApp.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSendNow} className="space-y-4">
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

                  <Button type="button" variant="secondary" size="sm" onClick={generateWithAi}>
                    <Sparkles className="h-4 w-4" /> Generate Message with AI
                  </Button>

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

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={!title || !message}
                    onClick={() => setShowPreview(true)}
                  >
                    <Eye className="h-4 w-4" /> Preview
                  </Button>

                  {!scheduling ? (
                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1">
                        <Send className="h-4 w-4" /> Send Immediately
                      </Button>
                      <Button type="button" variant="outline" className="flex-1" onClick={() => setScheduling(true)}>
                        <Clock className="h-4 w-4" /> Schedule
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3 rounded-lg border border-border p-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label>Date</Label>
                          <Input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Time</Label>
                          <Input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" className="flex-1" onClick={() => setScheduling(false)}>
                          Cancel
                        </Button>
                        <Button type="button" className="flex-1" disabled={!title || !message} onClick={handleSchedule}>
                          <Clock className="h-4 w-4" /> Schedule Broadcast
                        </Button>
                      </div>
                    </div>
                  )}

                  {sent && (
                    <p className="flex items-center gap-1.5 text-sm text-success">
                      <CheckCircle2 className="h-4 w-4" /> Broadcast queued successfully!
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
        </TabsContent>
      </Tabs>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>WhatsApp Preview</DialogTitle>
          </DialogHeader>
          <div className="rounded-lg bg-[#e5ded5] p-4">
            <div className="rounded-lg bg-[#d9fdd3] px-3 py-2 text-sm shadow-sm">
              <p className="mb-0.5 flex items-center gap-1 text-[10px] font-semibold text-primary">
                <MessageCircle className="h-3 w-3" /> DentVerse Clinic
              </p>
              <p className="font-medium">{title}</p>
              <p className="mt-1">{message}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
