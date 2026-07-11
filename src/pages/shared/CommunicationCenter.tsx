import * as React from "react";
import { useSearchParams } from "react-router-dom";
import {
  MessageCircle,
  Bot,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Inbox,
  Send,
  FileText,
  ClipboardList,
  Cake,
  RefreshCcw,
  Megaphone,
  Eye,
  RotateCcw,
  Check,
  Circle,
  X,
} from "lucide-react";
import { useAppState } from "@/context/AppStateContext";
import { conversations, outgoingMessages, type ConversationStatus, type OutgoingCategory } from "@/data/communication";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const CONVERSATION_FILTERS: ("All" | ConversationStatus)[] = [
  "All",
  "Active",
  "Awaiting Patient Reply",
  "Awaiting Doctor Approval",
  "Escalated",
  "Completed",
];

function conversationBadgeVariant(status: ConversationStatus) {
  switch (status) {
    case "Completed":
      return "success" as const;
    case "Escalated":
      return "destructive" as const;
    case "Awaiting Doctor Approval":
      return "warning" as const;
    case "Awaiting Patient Reply":
      return "outline" as const;
    default:
      return "muted" as const;
  }
}

const OUTGOING_CATEGORIES: OutgoingCategory[] = [
  "Appointment Confirmation",
  "Reminder",
  "Follow-up",
  "Prescription PDF",
  "Treatment Plan",
  "Birthday Wish",
  "Recall Reminder",
  "Broadcast",
];

const OUTGOING_ICONS: Record<OutgoingCategory, React.ElementType> = {
  "Appointment Confirmation": CheckCircle2,
  Reminder: Clock,
  "Follow-up": RefreshCcw,
  "Prescription PDF": FileText,
  "Treatment Plan": ClipboardList,
  "Birthday Wish": Cake,
  "Recall Reminder": RotateCcw,
  Broadcast: Megaphone,
};

export default function CommunicationCenter() {
  const { broadcasts } = useAppState();
  const [searchParams, setSearchParams] = useSearchParams();
  const patientFilter = searchParams.get("patient");
  const [filter, setFilter] = React.useState<"All" | ConversationStatus>("All");
  const [timelineConv, setTimelineConv] = React.useState<(typeof conversations)[number] | null>(null);
  const [retryingId, setRetryingId] = React.useState<string | null>(null);
  const [retried, setRetried] = React.useState<Record<string, boolean>>({});

  const filteredConversations = conversations.filter(
    (c) => (filter === "All" || c.status === filter) && (!patientFilter || c.patientName === patientFilter)
  );

  const incomingCounts = {
    New: conversations.filter((c) => c.incomingCategory === "New").length,
    "AI Responded": conversations.filter((c) => c.incomingCategory === "AI Responded").length,
    "Waiting for Patient Reply": conversations.filter((c) => c.incomingCategory === "Waiting for Patient Reply").length,
    Escalated: conversations.filter((c) => c.incomingCategory === "Escalated").length,
    Unread: conversations.filter((c) => c.unread).length,
  };

  const analytics = [
    { label: "Incoming Messages Today", value: conversations.filter((c) => c.lastMessageAt.startsWith("Today")).length, icon: Inbox },
    { label: "AI Resolved Conversations", value: conversations.filter((c) => c.status === "Completed").length, icon: Bot },
    { label: "Human Escalations", value: conversations.filter((c) => c.status === "Escalated").length, icon: AlertTriangle },
    { label: "Broadcasts Sent", value: broadcasts.filter((b) => b.status === "Sent").length, icon: Megaphone },
    { label: "Prescriptions Delivered", value: outgoingMessages.filter((m) => m.category === "Prescription PDF" && m.status === "Delivered").length, icon: FileText },
    { label: "Pending Replies", value: conversations.filter((c) => c.status === "Awaiting Patient Reply").length, icon: Clock },
  ];

  const handleRetry = (id: string) => {
    setRetryingId(id);
    setTimeout(() => {
      setRetryingId(null);
      setRetried((prev) => ({ ...prev, [id]: true }));
    }, 900);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Communication Center</h1>
        <p className="text-sm text-muted-foreground">
          Monitor AI-handled WhatsApp conversations and message delivery — this is a monitoring view, not a manual reply inbox.
        </p>
      </div>

      {patientFilter && (
        <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-secondary/40 p-3 text-sm">
          <span>
            Showing conversations and messages for <span className="font-semibold">{patientFilter}</span>
          </span>
          <Button variant="ghost" size="sm" onClick={() => setSearchParams({})}>
            <X className="h-3.5 w-3.5" /> Clear filter
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {analytics.map((a) => (
          <Card key={a.label}>
            <CardContent className="p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-primary">
                <a.icon className="h-4 w-4" />
              </div>
              <p className="mt-2 text-xl font-bold">{a.value}</p>
              <p className="text-[11px] text-muted-foreground">{a.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="incoming">
        <TabsList>
          <TabsTrigger value="incoming">Incoming Messages</TabsTrigger>
          <TabsTrigger value="outgoing">Outgoing Messages</TabsTrigger>
          <TabsTrigger value="broadcasts">Broadcast Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="incoming" className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(incomingCounts) as (keyof typeof incomingCounts)[]).map((key) => (
              <Badge key={key} variant="outline" className="gap-1">
                {key} <span className="font-semibold">{incomingCounts[key]}</span>
              </Badge>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {CONVERSATION_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  filter === f
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:bg-accent"
                )}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {filteredConversations.map((c) => (
              <Card key={c.id} className={cn(c.unread && "border-primary/30 bg-secondary/30")}>
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback className="bg-secondary text-primary">{c.avatarInitials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">{c.patientName}</p>
                      <Badge variant={conversationBadgeVariant(c.status)}>{c.status}</Badge>
                      <Badge variant="outline" className="gap-1"><Bot className="h-3 w-3" /> {c.incomingCategory}</Badge>
                      {c.unread && <span className="h-2 w-2 rounded-full bg-primary" />}
                    </div>
                    <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{c.lastMessage}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{c.phone} · {c.lastMessageAt}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setTimelineConv(c)}>
                    <Eye className="h-3.5 w-3.5" /> View Timeline
                  </Button>
                </CardContent>
              </Card>
            ))}
            {filteredConversations.length === 0 && (
              <p className="py-12 text-center text-sm text-muted-foreground">No conversations match this filter.</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="outgoing">
          <Tabs defaultValue={OUTGOING_CATEGORIES[0]}>
            <TabsList className="h-auto flex-wrap">
              {OUTGOING_CATEGORIES.map((cat) => (
                <TabsTrigger key={cat} value={cat} className="text-xs">{cat}</TabsTrigger>
              ))}
            </TabsList>
            {OUTGOING_CATEGORIES.map((cat) => {
              const Icon = OUTGOING_ICONS[cat];
              const items = outgoingMessages.filter(
                (m) => m.category === cat && (!patientFilter || m.patientName === patientFilter)
              );
              return (
                <TabsContent key={cat} value={cat} className="space-y-2">
                  {items.map((m) => (
                    <Card key={m.id}>
                      <CardContent className="flex items-center gap-3 p-4">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-medium">{m.patientName}</p>
                            <Badge variant={m.status === "Delivered" ? "success" : m.status === "Pending" ? "warning" : "destructive"}>
                              {m.status}
                            </Badge>
                          </div>
                          <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{m.message}</p>
                        </div>
                        <span className="shrink-0 text-xs text-muted-foreground">{m.sentAt}</span>
                      </CardContent>
                    </Card>
                  ))}
                  {items.length === 0 && (
                    <p className="py-10 text-center text-sm text-muted-foreground">No {cat.toLowerCase()} messages yet.</p>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        </TabsContent>

        <TabsContent value="broadcasts" className="space-y-3">
          {broadcasts.map((b) => {
            const failed = retried[b.id] ? 0 : b.failed ?? 0;
            return (
              <Card key={b.id}>
                <CardHeader className="flex-row items-start justify-between space-y-0">
                  <div>
                    <CardTitle className="text-base">{b.title}</CardTitle>
                    <CardDescription>{b.audience} · {b.sentAt}</CardDescription>
                  </div>
                  <Badge variant={b.status === "Sent" ? "success" : b.status === "Scheduled" ? "warning" : "muted"}>{b.status}</Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{b.message}</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg bg-success/10 p-2.5 text-center">
                      <p className="text-[11px] text-muted-foreground">Delivered</p>
                      <p className="text-sm font-semibold text-success">{b.delivered ?? 0}</p>
                    </div>
                    <div className="rounded-lg bg-destructive/10 p-2.5 text-center">
                      <p className="text-[11px] text-muted-foreground">Failed</p>
                      <p className="text-sm font-semibold text-destructive">{failed}</p>
                    </div>
                    <div className="rounded-lg bg-warning/15 p-2.5 text-center">
                      <p className="text-[11px] text-muted-foreground">Pending</p>
                      <p className="text-sm font-semibold text-warning-foreground">{b.pending ?? 0}</p>
                    </div>
                  </div>
                  {(b.failed ?? 0) > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={retryingId === b.id || retried[b.id]}
                      onClick={() => handleRetry(b.id)}
                    >
                      <RefreshCcw className={cn("h-3.5 w-3.5", retryingId === b.id && "animate-spin")} />
                      {retried[b.id] ? "Retried ✓" : retryingId === b.id ? "Retrying..." : "Retry Failed Messages"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>

      <Dialog open={!!timelineConv} onOpenChange={(open) => !open && setTimelineConv(null)}>
        <DialogContent>
          {timelineConv && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-primary" /> {timelineConv.patientName} — Conversation Timeline
                </DialogTitle>
                <DialogDescription>Automated pipeline from first message to follow-up.</DialogDescription>
              </DialogHeader>
              <div className="space-y-0">
                {timelineConv.timeline.map((stage, i) => (
                  <div key={stage.label} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-full border-2",
                          stage.done ? "border-success bg-success text-success-foreground" : "border-border bg-muted text-muted-foreground"
                        )}
                      >
                        {stage.done ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-3 w-3" />}
                      </div>
                      {i < timelineConv.timeline.length - 1 && (
                        <div className={cn("my-0.5 h-full w-px flex-1", stage.done ? "bg-success" : "bg-border")} />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className={cn("text-sm font-medium", !stage.done && "text-muted-foreground")}>{stage.label}</p>
                      {stage.timestamp && <p className="text-[11px] text-muted-foreground">{stage.timestamp}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
