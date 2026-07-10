import { ScrollText, Info, AlertTriangle, OctagonAlert } from "lucide-react";
import { auditLogs, systemLogs } from "@/data/adminData";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const LEVEL_META = {
  info: { icon: Info, tint: "bg-secondary text-primary", label: "Info" },
  warning: { icon: AlertTriangle, tint: "bg-warning/15 text-warning-foreground", label: "Warning" },
  error: { icon: OctagonAlert, tint: "bg-destructive/10 text-destructive", label: "Error" },
};

export default function LogsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Audit &amp; System Logs</h1>
        <p className="text-sm text-muted-foreground">Track staff activity and monitor system health.</p>
      </div>

      <Tabs defaultValue="audit">
        <TabsList>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="system">System Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="audit" className="space-y-2">
          {auditLogs.map((log) => (
            <Card key={log.id}>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                  <ScrollText className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-semibold">{log.actor}</span> {log.action.toLowerCase()} —{" "}
                    <span className="text-muted-foreground">{log.target}</span>
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{log.timestamp}</span>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="system" className="space-y-2">
          {systemLogs.map((log) => {
            const meta = LEVEL_META[log.level];
            return (
              <Card key={log.id}>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", meta.tint)}>
                    <meta.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={log.level === "error" ? "destructive" : log.level === "warning" ? "warning" : "outline"}>
                        {meta.label}
                      </Badge>
                      <p className="text-xs text-muted-foreground">{log.source}</p>
                    </div>
                    <p className="mt-1 text-sm">{log.message}</p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{log.timestamp}</span>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}
