import * as React from "react";
import { Clock, Plane, Save } from "lucide-react";
import { weeklyAvailability } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function Availability() {
  const [schedule, setSchedule] = React.useState(weeklyAvailability);
  const [saved, setSaved] = React.useState(false);
  const [vacationMode, setVacationMode] = React.useState(false);

  const toggleDay = (day: string) => {
    setSchedule((prev) => prev.map((d) => (d.day === day ? { ...d, enabled: !d.enabled } : d)));
    setSaved(false);
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Availability Management</h1>
        <p className="text-sm text-muted-foreground">
          Set your working hours — your AI receptionist only books within these slots.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Weekly Working Hours
          </CardTitle>
          <CardDescription>Toggle days on/off and review available slot windows.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {schedule.map((d) => (
            <div key={d.day} className="flex items-center justify-between rounded-lg px-3 py-3 hover:bg-accent/50">
              <div className="flex items-center gap-3">
                <Switch checked={d.enabled} onCheckedChange={() => toggleDay(d.day)} />
                <span className={`w-24 text-sm font-medium ${!d.enabled && "text-muted-foreground"}`}>{d.day}</span>
              </div>
              <span className={`text-sm ${d.enabled ? "text-muted-foreground" : "text-muted-foreground/50"}`}>
                {d.enabled ? d.slots : "Closed"}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-4 w-4 text-primary" />
            Vacation / Time Off
          </CardTitle>
          <CardDescription>Block the AI from booking any appointments during this range.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="text-sm font-medium">Enable vacation mode</p>
              <p className="text-xs text-muted-foreground">The AI will inform patients you're unavailable and suggest dates after your return.</p>
            </div>
            <Switch checked={vacationMode} onCheckedChange={setVacationMode} />
          </div>
          {vacationMode && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>From</Label>
                <Input type="date" defaultValue="2026-08-01" />
              </div>
              <div className="space-y-1.5">
                <Label>To</Label>
                <Input type="date" defaultValue="2026-08-07" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={() => setSaved(true)}>
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
        {saved && <span className="text-sm text-success">Availability updated ✓</span>}
      </div>
    </div>
  );
}
