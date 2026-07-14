import * as React from "react";
import { CalendarClock, XCircle } from "lucide-react";
import { useAppState } from "@/context/AppStateContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type { Appointment } from "@/data/mockData";
import TimePicker from "@/components/shared/TimePicker";

// Staff acting directly on a confirmed appointment (phone call, walk-in) —
// creates a reschedule/cancellation request and approves it in the same
// action, so the change applies immediately while still leaving an audit
// record. See DentVerseDocs/12-milestones for the AI-vs-manual workflow.
export default function AppointmentActions({ appointment }: { appointment: Appointment }) {
  const { rescheduleAppointment, cancelAppointment } = useAppState();
  const [mode, setMode] = React.useState<"none" | "reschedule" | "cancel">("none");
  const [date, setDate] = React.useState(appointment.date);
  const [time, setTime] = React.useState(appointment.time);
  const [reason, setReason] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const openReschedule = () => {
    setDate(appointment.date);
    setTime(appointment.time);
    setReason("");
    setError(null);
    setMode("reschedule");
  };

  const openCancel = () => {
    setReason("");
    setError(null);
    setMode("cancel");
  };

  const close = () => {
    if (saving) return;
    setMode("none");
  };

  const submitReschedule = async () => {
    if (!date.trim() || !time.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await rescheduleAppointment(appointment.id, date, time, reason.trim());
      setMode("none");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reschedule this appointment.");
    } finally {
      setSaving(false);
    }
  };

  const submitCancel = async () => {
    setSaving(true);
    setError(null);
    try {
      await cancelAppointment(appointment.id, reason.trim());
      setMode("none");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not cancel this appointment.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={openReschedule}>
        <CalendarClock className="h-3.5 w-3.5" /> Reschedule
      </Button>
      <Button variant="outline" size="sm" onClick={openCancel} className="text-destructive hover:text-destructive">
        <XCircle className="h-3.5 w-3.5" /> Cancel
      </Button>

      <Dialog open={mode === "reschedule"} onOpenChange={(open) => !open && close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
            <DialogDescription>
              {appointment.patientName} · currently {appointment.date} at {appointment.time}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="resched-date">New Date</Label>
                <Input id="resched-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="resched-time">New Time</Label>
                <TimePicker id="resched-time" value={time} onChange={setTime} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="resched-reason">Reason (optional)</Label>
              <Textarea
                id="resched-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Patient requested a later slot"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={close} disabled={saving}>Cancel</Button>
            <Button onClick={submitReschedule} disabled={!date.trim() || !time.trim() || saving}>
              {saving ? "Rescheduling..." : "Reschedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={mode === "cancel"} onOpenChange={(open) => !open && close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
            <DialogDescription>
              {appointment.patientName} · {appointment.date} at {appointment.time}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="cancel-reason">Reason</Label>
              <Textarea
                id="cancel-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Patient is travelling, will rebook"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={close} disabled={saving}>Back</Button>
            <Button variant="destructive" onClick={submitCancel} disabled={saving}>
              {saving ? "Cancelling..." : "Cancel Appointment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
