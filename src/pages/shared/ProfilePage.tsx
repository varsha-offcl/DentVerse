import { useAppState } from "@/context/AppStateContext";
import { ROLE_LABELS, PERMISSIONS } from "@/data/roles";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Mail, Building2, ShieldCheck } from "lucide-react";

export default function ProfilePage() {
  const { role, profile } = useAppState();
  if (!role || !profile) return null;
  const permissions = PERMISSIONS[role];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
        <p className="text-sm text-muted-foreground">Your account details and role permissions.</p>
      </div>

      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-secondary text-lg text-primary">{profile.avatarInitials}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-lg font-semibold">{profile.name}</p>
              <Badge variant="secondary">{ROLE_LABELS[role]}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{profile.title}</p>
            <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {profile.email}</span>
              <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> {profile.clinicName}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Role Permissions
          </CardTitle>
          <CardDescription>What your {ROLE_LABELS[role]} account can access in DentVerse.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {permissions.map((p) => (
              <Badge key={p} variant="outline">{p}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
