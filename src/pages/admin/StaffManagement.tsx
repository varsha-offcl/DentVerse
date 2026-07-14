import * as React from "react";
import {
  CalendarClock,
  Users,
  ShieldCheck,
  XCircle,
  CheckCircle2,
  UserPlus,
  Copy,
  Check,
  Ban,
  Mail,
} from "lucide-react";
import { useAppState } from "@/context/AppStateContext";
import type { StaffMember, StaffInvite, NewStaffInviteInput } from "@/context/AppStateContext";
import { PERMISSIONS, RESTRICTED, ROLE_LABELS, type Role } from "@/data/roles";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const ROLES: Role[] = ["doctor", "receptionist", "admin"];
const TODAY = new Date().toISOString().slice(0, 10);

function doctorStats(doctorId: string, appointments: ReturnType<typeof useAppState>["appointments"]) {
  const own = appointments.filter((a) => a.doctorId === doctorId && a.status !== "cancelled");
  const patientsCount = new Set(own.map((a) => a.patientId)).size;
  const currentMonthPrefix = TODAY.slice(0, 7);
  const appointmentsThisMonth = own.filter((a) => a.date.startsWith(currentMonthPrefix)).length;
  const completionRate =
    own.length > 0 ? Math.round((own.filter((a) => a.status === "completed").length / own.length) * 100) : 0;
  return { patientsCount, appointmentsThisMonth, completionRate };
}

function StatusToggle({ member, onToggle }: { member: StaffMember; onToggle: (next: string) => void }) {
  const active = member.status === "Active";
  return (
    <button
      onClick={() => onToggle(active ? "On Leave" : "Active")}
      className="focus:outline-none"
      title={active ? "Mark as On Leave" : "Mark as Active"}
    >
      <Badge variant={active ? "success" : "muted"} className="cursor-pointer">
        {member.status}
      </Badge>
    </button>
  );
}

function InviteDialog({
  open,
  onOpenChange,
  onInvite,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvite: (draft: NewStaffInviteInput) => Promise<StaffInvite>;
}) {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<Role>("doctor");
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [link, setLink] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  const reset = () => {
    setName("");
    setEmail("");
    setRole("doctor");
    setError(null);
    setLink(null);
    setCopied(false);
  };

  const handleSend = async () => {
    if (!name.trim() || !email.trim()) return;
    setSending(true);
    setError(null);
    try {
      const invite = await onInvite({ name: name.trim(), email: email.trim(), role });
      setLink(`${window.location.origin}/join?invite=${invite.token}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create this invite.");
    } finally {
      setSending(false);
    }
  };

  const copyLink = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Staff Member</DialogTitle>
          <DialogDescription>
            {link
              ? "Share this link with them yourself — over WhatsApp, email, however works."
              : "Creates a one-time signup link. There's no automatic email — you send the link."}
          </DialogDescription>
        </DialogHeader>

        {link ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-3">
              <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
              <p className="flex-1 truncate text-xs text-muted-foreground">{link}</p>
              <Button size="sm" variant="outline" onClick={copyLink}>
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Expires in 7 days if not used.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="inv-name">Full Name</Label>
              <Input id="inv-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Dr. Jane Doe" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inv-email">Email</Label>
              <Input
                id="inv-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@clinic.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )}

        <DialogFooter>
          {link ? (
            <Button onClick={() => onOpenChange(false)}>Done</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
                Cancel
              </Button>
              <Button onClick={handleSend} disabled={!name.trim() || !email.trim() || sending}>
                {sending ? "Creating link..." : "Create Invite Link"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function StaffManagement() {
  const { staffMembers, staffInvites, appointments, loadStaffDirectory, inviteStaffMember, revokeStaffInvite, updateStaffStatus } =
    useAppState();
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [statusError, setStatusError] = React.useState<string | null>(null);
  const [revokingId, setRevokingId] = React.useState<string | null>(null);
  const [revokeError, setRevokeError] = React.useState<string | null>(null);

  React.useEffect(() => {
    void loadStaffDirectory();
  }, [loadStaffDirectory]);

  const doctors = staffMembers.filter((s) => s.role === "doctor");
  const receptionists = staffMembers.filter((s) => s.role === "receptionist");
  const pendingInvites = staffInvites.filter((i) => !i.accepted && !i.revoked);

  const handleToggleStatus = async (id: string, next: string) => {
    setStatusError(null);
    try {
      await updateStaffStatus(id, next);
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : "Could not update this staff member's status.");
    }
  };

  const handleRevoke = async (id: string) => {
    setRevokingId(id);
    setRevokeError(null);
    try {
      await revokeStaffInvite(id);
    } catch (err) {
      setRevokeError(err instanceof Error ? err.message : "Could not revoke this invite.");
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Staff Management</h1>
          <p className="text-sm text-muted-foreground">Manage doctors, front-desk staff, and role-based permissions.</p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus className="h-4 w-4" /> Invite Staff Member
        </Button>
      </div>

      {statusError && <p className="text-sm text-destructive">{statusError}</p>}

      {pendingInvites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pending Invites</CardTitle>
            <CardDescription>Not yet accepted — {pendingInvites.length} awaiting signup.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {revokeError && <p className="text-sm text-destructive">{revokeError}</p>}
            {pendingInvites.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium">{inv.name} · {ROLE_LABELS[inv.role]}</p>
                  <p className="text-xs text-muted-foreground">{inv.email}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={revokingId === inv.id}
                  onClick={() => handleRevoke(inv.id)}
                >
                  <Ban className="h-3.5 w-3.5" /> {revokingId === inv.id ? "Revoking..." : "Revoke"}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="doctors">
        <TabsList>
          <TabsTrigger value="doctors">Doctors</TabsTrigger>
          <TabsTrigger value="receptionists">Receptionists</TabsTrigger>
          <TabsTrigger value="roles">Roles &amp; Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="doctors" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {doctors.map((d) => {
            const stats = doctorStats(d.id, appointments);
            return (
              <Card key={d.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-11 w-11">
                        <AvatarFallback className="bg-secondary text-primary">{d.avatarInitials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{d.name}</p>
                        <p className="text-xs text-muted-foreground">{d.title || "Doctor"}</p>
                      </div>
                    </div>
                    <StatusToggle member={d} onToggle={(next) => handleToggleStatus(d.id, next)} />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Users className="h-3.5 w-3.5" /> {stats.patientsCount} patients
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <CalendarClock className="h-3.5 w-3.5" /> {stats.appointmentsThisMonth}/mo
                    </div>
                    <div className="col-span-2 flex items-center gap-1.5 text-muted-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5" /> {stats.completionRate}% completion rate
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {doctors.length === 0 && (
            <p className="col-span-full py-10 text-center text-sm text-muted-foreground">No doctors yet — invite one above.</p>
          )}
        </TabsContent>

        <TabsContent value="receptionists" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {receptionists.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-11 w-11">
                      <AvatarFallback className="bg-secondary text-primary">{r.avatarInitials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{r.name}</p>
                      <p className="text-xs text-muted-foreground">{r.email}</p>
                    </div>
                  </div>
                  <StatusToggle member={r} onToggle={(next) => handleToggleStatus(r.id, next)} />
                </div>
                <p className="mt-4 text-xs text-muted-foreground">Staff since {r.memberSince}</p>
              </CardContent>
            </Card>
          ))}
          {receptionists.length === 0 && (
            <p className="col-span-full py-10 text-center text-sm text-muted-foreground">
              No receptionists yet — invite one above.
            </p>
          )}
        </TabsContent>

        <TabsContent value="roles" className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {ROLES.map((role) => (
            <Card key={role}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" /> {ROLE_LABELS[role]}
                </CardTitle>
                <CardDescription>{PERMISSIONS[role].length} modules accessible</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">Has Access</p>
                  <div className="space-y-1.5">
                    {PERMISSIONS[role].map((p) => (
                      <div key={p} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-3.5 w-3.5 text-success" /> {p}
                      </div>
                    ))}
                  </div>
                </div>
                {RESTRICTED[role].length > 0 && (
                  <div>
                    <p className="mb-1.5 text-xs font-medium text-muted-foreground">Restricted</p>
                    <div className="space-y-1.5">
                      {RESTRICTED[role].map((p) => (
                        <div key={p} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <XCircle className="h-3.5 w-3.5 text-destructive" /> {p}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      <InviteDialog open={inviteOpen} onOpenChange={setInviteOpen} onInvite={inviteStaffMember} />
    </div>
  );
}
