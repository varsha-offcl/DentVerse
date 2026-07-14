import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Search, Phone, ChevronRight, IndianRupee, UserPlus } from "lucide-react";
import { useAppState } from "@/context/AppStateContext";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

export default function PatientList() {
  const navigate = useNavigate();
  const { patients, addPatient } = useAppState();
  const [query, setQuery] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [age, setAge] = React.useState("");
  const [gender, setGender] = React.useState<"Male" | "Female">("Female");
  const [email, setEmail] = React.useState("");
  const [tags, setTags] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const filtered = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.phone.includes(query) ||
      p.tags.some((t) => t.toLowerCase().includes(query.toLowerCase()))
  );

  const resetForm = () => {
    setName("");
    setPhone("");
    setAge("");
    setGender("Female");
    setEmail("");
    setTags("");
  };

  const handleCreate = async () => {
    if (!name.trim() || !phone.trim()) return;
    setSaving(true);
    setFormError(null);
    try {
      const patient = await addPatient({
        name: name.trim(),
        phone: phone.trim(),
        age: parseInt(age, 10) || 0,
        gender,
        email: email.trim() || "—",
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
      setDialogOpen(false);
      resetForm();
      navigate(`/patient/${patient.id}`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not create patient.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Patients</h1>
          <p className="text-sm text-muted-foreground">{patients.length} active patients on record.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search name, phone, or tag..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <UserPlus className="h-4 w-4" /> Add Patient
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => (
          <Card
            key={p.id}
            className="cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md"
            onClick={() => navigate(`/patient/${p.id}`)}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-11 w-11">
                    <AvatarFallback className="bg-secondary text-primary">{p.avatarInitials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold">{p.name}</p>
                      {p.patientNumber && (
                        <span className="text-[11px] font-medium text-muted-foreground">#{p.patientNumber}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{p.age} yrs · {p.gender}</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {p.tags.map((t) => (
                  <Badge key={t} variant="secondary">{t}</Badge>
                ))}
                {p.allergies.length > 0 && <Badge variant="destructive">Allergy: {p.allergies.join(", ")}</Badge>}
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" /> {p.phone}
                </span>
                {p.balanceDue > 0 ? (
                  <span className="flex items-center gap-0.5 font-medium text-destructive">
                    <IndianRupee className="h-3 w-3" /> {p.balanceDue.toLocaleString("en-IN")} due
                  </span>
                ) : (
                  <span className="text-success">No balance due</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full py-16 text-center text-sm text-muted-foreground">No patients match your search.</p>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Patient</DialogTitle>
            <DialogDescription>Create a patient record to start booking visits, charting, and messaging.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="np-name">Full Name</Label>
              <Input id="np-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Neha Kulkarni" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="np-phone">Phone</Label>
                <Input id="np-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 90000 00000" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="np-age">Age</Label>
                <Input id="np-age" type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="32" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Gender</Label>
                <Select value={gender} onValueChange={(v) => setGender(v as "Male" | "Female")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Male">Male</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="np-email">Email</Label>
                <Input id="np-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="patient@email.com" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="np-tags">Tags (comma separated)</Label>
              <Input id="np-tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="New Patient, Ortho" />
            </div>
            {formError && <p className="text-sm text-destructive">{formError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!name.trim() || !phone.trim() || saving}>
              <UserPlus className="h-4 w-4" /> {saving ? "Creating..." : "Create Patient"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
