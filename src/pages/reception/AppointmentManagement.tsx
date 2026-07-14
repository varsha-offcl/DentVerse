import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Check, X, Bot, Phone, UserCheck, Plus, AlertTriangle, UserPlus } from "lucide-react";
import { useAppState } from "@/context/AppStateContext";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AppointmentActions from "@/components/shared/AppointmentActions";
import TimePicker from "@/components/shared/TimePicker";

function statusBadgeVariant(status: string) {
  switch (status) {
    case "confirmed":
      return "success" as const;
    case "pending":
      return "warning" as const;
    case "cancelled":
      return "destructive" as const;
    default:
      return "muted" as const;
  }
}

const TODAY = new Date().toISOString().slice(0, 10);

interface DoctorOption {
  id: string;
  name: string;
}

export default function AppointmentManagement() {
  const navigate = useNavigate();
  const { appointments, patients, profile, setAppointmentStatus, addAppointment, addPatient } = useAppState();
  const [tab, setTab] = React.useState("all");
  const [doctors, setDoctors] = React.useState<DoctorOption[]>([]);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [patientMode, setPatientMode] = React.useState<"existing" | "new">("existing");
  const [patientId, setPatientId] = React.useState("");
  const [newPatientName, setNewPatientName] = React.useState("");
  const [newPatientPhone, setNewPatientPhone] = React.useState("");
  const [newPatientAge, setNewPatientAge] = React.useState("");
  const [newPatientGender, setNewPatientGender] = React.useState<"Male" | "Female">("Female");
  const [newPatientEmail, setNewPatientEmail] = React.useState("");
  const [doctorId, setDoctorId] = React.useState("");
  const [date, setDate] = React.useState("");
  const [time, setTime] = React.useState("");
  const [duration, setDuration] = React.useState("30 min");
  const [type, setType] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [statusError, setStatusError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!profile) return;
    supabase
      .from("profiles")
      .select("id, name")
      .eq("tenant_id", profile.tenantId)
      .eq("role", "doctor")
      .then(({ data }) => setDoctors(data ?? []));
  }, [profile]);

  const filtered = appointments
    .filter((a) => tab === "all" || a.status === tab)
    .sort((a, b) => b.date.localeCompare(a.date));

  const resetForm = () => {
    setPatientMode("existing");
    setPatientId("");
    setNewPatientName("");
    setNewPatientPhone("");
    setNewPatientAge("");
    setNewPatientGender("Female");
    setNewPatientEmail("");
    setDoctorId("");
    setDate("");
    setTime("");
    setDuration("30 min");
    setType("");
    setNotes("");
    setFormError(null);
  };

  const patientStepValid =
    patientMode === "existing" ? !!patientId : newPatientName.trim() !== "" && newPatientPhone.trim() !== "";

  const handleCreate = async () => {
    if (!patientStepValid || !doctorId || !date || !time.trim() || !type.trim()) return;
    setSaving(true);
    setFormError(null);
    try {
      let resolvedPatientId = patientId;
      if (patientMode === "new") {
        const newPatient = await addPatient({
          name: newPatientName.trim(),
          phone: newPatientPhone.trim(),
          age: parseInt(newPatientAge, 10) || 0,
          gender: newPatientGender,
          email: newPatientEmail.trim() || "—",
          tags: [],
        });
        resolvedPatientId = newPatient.id;
      }
      await addAppointment({
        patientId: resolvedPatientId,
        doctorId,
        date,
        time: time.trim(),
        duration: duration.trim(),
        type: type.trim(),
        notes: notes.trim() || undefined,
      });
      setDialogOpen(false);
      resetForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not create the appointment.");
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async (id: string, status: "confirmed" | "cancelled") => {
    setBusyId(id);
    setStatusError(null);
    try {
      await setAppointmentStatus(id, status);
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : "Could not update this appointment.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Appointment Management</h1>
          <p className="text-sm text-muted-foreground">Full visibility into every appointment across the clinic.</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" /> New Appointment
        </Button>
      </div>

      {statusError && (
        <p className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {statusError}
        </p>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="space-y-3">
          {filtered.map((a) => (
            <Card key={a.id}>
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                <div className="flex flex-1 items-center gap-4">
                  <Avatar className="h-11 w-11">
                    <AvatarFallback className="bg-secondary text-primary">{a.avatarInitials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{a.patientName}</p>
                      <Badge variant={statusBadgeVariant(a.status)} className="capitalize">{a.status}</Badge>
                      {a.checkInStatus && a.checkInStatus !== "Not Arrived" && (
                        <Badge variant="outline" className="gap-1"><UserCheck className="h-3 w-3" /> {a.checkInStatus}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{a.type} · {a.doctorName ?? "Unassigned"}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{a.date} · {a.time} · {a.duration}</p>
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                      {a.source === "WhatsApp AI" ? <Bot className="h-3 w-3" /> : <Phone className="h-3 w-3" />}
                      Booked via {a.source}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {a.status === "pending" && (
                    <>
                      <Button variant="success" size="sm" disabled={busyId === a.id} onClick={() => handleStatus(a.id, "confirmed")}>
                        <Check className="h-4 w-4" /> Confirm
                      </Button>
                      <Button variant="destructive" size="sm" disabled={busyId === a.id} onClick={() => handleStatus(a.id, "cancelled")}>
                        <X className="h-4 w-4" /> Decline
                      </Button>
                    </>
                  )}
                  {a.status === "confirmed" && a.date === TODAY && (
                    <Button variant="outline" size="sm" onClick={() => navigate("/reception/checkin")}>
                      <UserCheck className="h-4 w-4" /> Check-in
                    </Button>
                  )}
                  {a.status === "confirmed" && <AppointmentActions appointment={a} />}
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <p className="py-16 text-center text-sm text-muted-foreground">No appointments in this view.</p>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Appointment</DialogTitle>
            <DialogDescription>Book a visit on behalf of a patient calling in or walking in.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Patient</Label>
                <button
                  type="button"
                  onClick={() => setPatientMode(patientMode === "existing" ? "new" : "existing")}
                  className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  {patientMode === "existing" ? (
                    <><UserPlus className="h-3 w-3" /> New patient instead</>
                  ) : (
                    "Choose an existing patient instead"
                  )}
                </button>
              </div>

              {patientMode === "existing" ? (
                <>
                  <Select value={patientId} onValueChange={setPatientId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name} · {p.phone}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {patients.length === 0 && (
                    <p className="text-xs text-muted-foreground">No patients yet — switch to "New patient" above.</p>
                  )}
                </>
              ) : (
                <div className="space-y-3 rounded-lg border border-dashed border-border p-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="na-np-name">Full Name</Label>
                      <Input id="na-np-name" value={newPatientName} onChange={(e) => setNewPatientName(e.target.value)} placeholder="e.g. Neha Kulkarni" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="na-np-phone">Phone</Label>
                      <Input id="na-np-phone" value={newPatientPhone} onChange={(e) => setNewPatientPhone(e.target.value)} placeholder="+91 90000 00000" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="na-np-age">Age</Label>
                      <Input id="na-np-age" type="number" value={newPatientAge} onChange={(e) => setNewPatientAge(e.target.value)} placeholder="32" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Gender</Label>
                      <Select value={newPatientGender} onValueChange={(v) => setNewPatientGender(v as "Male" | "Female")}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Male">Male</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="na-np-email">Email (optional)</Label>
                    <Input id="na-np-email" type="email" value={newPatientEmail} onChange={(e) => setNewPatientEmail(e.target.value)} placeholder="patient@email.com" />
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Doctor</Label>
              <Select value={doctorId} onValueChange={setDoctorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a doctor" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="na-date">Date</Label>
                <Input id="na-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="na-time">Time</Label>
                <TimePicker id="na-time" value={time} onChange={setTime} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="na-type">Visit Type</Label>
                <Input id="na-type" value={type} onChange={(e) => setType(e.target.value)} placeholder="Cleaning" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="na-duration">Duration</Label>
                <Input id="na-duration" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="30 min" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="na-notes">Notes (optional)</Label>
              <Textarea id="na-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything the doctor should know ahead of the visit" />
            </div>
            {formError && <p className="text-sm text-destructive">{formError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button
              onClick={handleCreate}
              disabled={!patientStepValid || !doctorId || !date || !time.trim() || !type.trim() || saving}
            >
              <Plus className="h-4 w-4" /> {saving ? "Booking..." : "Book Appointment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
