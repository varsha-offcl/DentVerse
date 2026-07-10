import { Star, IndianRupee, CalendarClock, Users, MessageCircle, Clock, ShieldCheck, XCircle, CheckCircle2 } from "lucide-react";
import { staffDoctors, staffReceptionists, PERMISSIONS, RESTRICTED, ROLE_LABELS, type Role } from "@/data/roles";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ROLES: Role[] = ["doctor", "receptionist", "admin"];

export default function StaffManagement() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Staff Management</h1>
        <p className="text-sm text-muted-foreground">Manage doctors, front-desk staff, and role-based permissions.</p>
      </div>

      <Tabs defaultValue="doctors">
        <TabsList>
          <TabsTrigger value="doctors">Doctors</TabsTrigger>
          <TabsTrigger value="receptionists">Receptionists</TabsTrigger>
          <TabsTrigger value="roles">Roles &amp; Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="doctors" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {staffDoctors.map((d) => (
            <Card key={d.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-11 w-11">
                      <AvatarFallback className="bg-secondary text-primary">{d.avatarInitials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{d.name}</p>
                      <p className="text-xs text-muted-foreground">{d.title}</p>
                    </div>
                  </div>
                  <Badge variant={d.status === "Active" ? "success" : "muted"}>{d.status}</Badge>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="h-3.5 w-3.5" /> {d.patientsCount} patients
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <CalendarClock className="h-3.5 w-3.5" /> {d.appointmentsThisMonth}/mo
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Star className="h-3.5 w-3.5" /> {d.rating}/5 rating
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <IndianRupee className="h-3.5 w-3.5" /> {(d.revenueThisMonth / 1000).toFixed(0)}k/mo
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="receptionists" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {staffReceptionists.map((r) => (
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
                  <Badge variant={r.status === "Active" ? "success" : "muted"}>{r.status}</Badge>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <CalendarClock className="h-3.5 w-3.5" /> {r.checkInsToday} check-ins today
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <MessageCircle className="h-3.5 w-3.5" /> {r.messagesHandledThisWeek}/wk
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" /> {r.avgResponseTimeMin} min avg reply
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Star className="h-3.5 w-3.5" /> {r.rating}/5 rating
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
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
    </div>
  );
}
