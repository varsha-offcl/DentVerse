import * as React from "react";
import { Search, Phone, Mail, IndianRupee, CalendarClock } from "lucide-react";
import { useAppState } from "@/context/AppStateContext";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { Patient } from "@/data/mockData";

export default function PatientSearch() {
  const { patients, appointments } = useAppState();
  const [query, setQuery] = React.useState("");
  const [selected, setSelected] = React.useState<Patient | null>(null);

  const filtered = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.phone.includes(query) ||
      p.tags.some((t) => t.toLowerCase().includes(query.toLowerCase()))
  );

  const upcomingFor = (patientId: string) =>
    appointments
      .filter((a) => a.patientId === patientId && (a.status === "confirmed" || a.status === "pending"))
      .sort((a, b) => a.date.localeCompare(b.date))[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Patient Search</h1>
          <p className="text-sm text-muted-foreground">Look up contact details, balances, and upcoming visits.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name, phone, or tag..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => (
          <Card
            key={p.id}
            className="cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md"
            onClick={() => setSelected(p)}
          >
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <Avatar className="h-11 w-11">
                  <AvatarFallback className="bg-secondary text-primary">{p.avatarInitials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.age} yrs · {p.gender}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {p.phone}</span>
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

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-secondary text-primary">{selected.avatarInitials}</AvatarFallback>
                  </Avatar>
                  {selected.name}
                </DialogTitle>
                <DialogDescription>Front-desk contact card — clinical records are doctor-only.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> {selected.phone}</div>
                <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /> {selected.email}</div>
                <div className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-muted-foreground" />
                  {(() => {
                    const upcoming = upcomingFor(selected.id);
                    return upcoming ? `${upcoming.type} — ${upcoming.date} at ${upcoming.time}` : "No upcoming appointment";
                  })()}
                </div>
                <div className="flex items-center gap-2">
                  <IndianRupee className="h-4 w-4 text-muted-foreground" />
                  {selected.balanceDue > 0 ? (
                    <span className="font-medium text-destructive">₹{selected.balanceDue.toLocaleString("en-IN")} due</span>
                  ) : (
                    <span className="text-success">No balance due</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selected.tags.map((t) => (
                    <Badge key={t} variant="secondary">{t}</Badge>
                  ))}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
