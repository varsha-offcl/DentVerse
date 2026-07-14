import * as React from "react";
import { Clock, Plane, Save, Loader2 } from "lucide-react";
import { weeklyAvailability } from "@/data/mockData";
import { useAppState } from "@/context/AppStateContext";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function Availability() {
  const { profile } = useAppState();
  const [schedule, setSchedule] = React.useState(weeklyAvailability);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [vacationMode, setVacationMode] = React.useState(false);

  React.useEffect(() => {
    if (!profile) return;
    let active = true;
    supabase
      .from("doctor_availability")
      .select("day_of_week, enabled, slots_label")
      .eq("doctor_id", profile.id)
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setLoadError(error.message);
          setLoading(false);
          return;
        }
        if (data && data.length > 0) {
          const byDay = new Map(data.map((d) => [d.day_of_week, d]));
          setSchedule(
            DAY_ORDER.map((day) => {
              const row = byDay.get(day);
              return row
                ? { day, enabled: row.enabled, slots: row.slots_label }
                : { day, enabled: false, slots: "Closed" };
            })
          );
        }
        // No rows yet (first time this doctor has opened this screen) —
        // the imported default template stays as the editable starting point.
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [profile]);

  const toggleDay = (day: string) => {
    setSchedule((prev) => prev.map((d) => (d.day === day ? { ...d, enabled: !d.enabled } : d)));
    setSaved(false);
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    const rows = schedule.map((d) => ({
      tenant_id: profile.tenantId,
      doctor_id: profile.id,
      day_of_week: d.day,
      enabled: d.enabled,
      slots_label: d.slots,
    }));
    const { data, error } = await supabase
      .from("doctor_availability")
      .upsert(rows, { onConflict: "doctor_id,day_of_week" })
      .select("day_of_week, enabled, slots_label");
    setSaving(false);
    if (error) {
      setSaveError(error.message);
      return;
    }
    // Re-sync from exactly what the database now holds, rather than
    // trusting local state matches it — the fastest way to notice if a
    // write silently didn't take.
    if (data) {
      const byDay = new Map(data.map((d) => [d.day_of_week, d]));
      setSchedule(
        DAY_ORDER.map((day) => {
          const row = byDay.get(day);
          return row ? { day, enabled: row.enabled, slots: row.slots_label } : { day, enabled: false, slots: "Closed" };
        })
      );
    }
    setSaved(true);
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
          {loadError && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              Couldn't load your schedule: {loadError}
            </p>
          )}
          {loading && (
            <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading your schedule...
            </div>
          )}
          {!loading && schedule.map((d) => (
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
        <Button onClick={handleSave} disabled={saving || loading}>
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
        {saved && <span className="text-sm text-success">Availability updated ✓</span>}
        {saveError && <span className="text-sm text-destructive">Couldn't save: {saveError}</span>}
      </div>
    </div>
  );
}
