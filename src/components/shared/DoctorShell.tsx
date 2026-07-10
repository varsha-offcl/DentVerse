import * as React from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  Inbox,
  CheckCircle2,
  XCircle,
  Users,
  Bell,
  Clock,
  Megaphone,
  Mic,
  Stethoscope,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppState } from "@/context/AppStateContext";
import { currentDoctor } from "@/data/mockData";
import { Badge } from "@/components/ui/badge";
import ProfileMenu from "@/components/shared/ProfileMenu";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/dashboard/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/dashboard/requests", label: "Pending Requests", icon: Inbox, badgeKey: "pending" },
  { to: "/dashboard/confirmed", label: "Confirmed", icon: CheckCircle2 },
  { to: "/dashboard/cancelled", label: "Cancelled", icon: XCircle },
  { to: "/dashboard/patients", label: "Patients", icon: Users },
  { to: "/dashboard/notifications", label: "Notifications", icon: Bell, badgeKey: "unread" },
  { to: "/dashboard/availability", label: "Availability", icon: Clock },
  { to: "/dashboard/broadcast", label: "Broadcast Center", icon: Megaphone },
];

export default function DoctorShell() {
  const navigate = useNavigate();
  const { appointments, notifications } = useAppState();

  const pendingCount = appointments.filter((a) => a.status === "pending").length;
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="flex min-h-screen bg-muted/40">
      <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-border bg-card">
        <Link to="/dashboard" className="flex items-center gap-2 px-6 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Stethoscope className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">DentVerse</span>
        </Link>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {navItems.map((item) => {
            const badgeCount = item.badgeKey === "pending" ? pendingCount : item.badgeKey === "unread" ? unreadCount : 0;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </span>
                    {badgeCount > 0 && (
                      <Badge
                        variant={isActive ? "secondary" : "default"}
                        className={cn("h-5 min-w-5 justify-center px-1.5", isActive && "bg-white/20 text-white")}
                      >
                        {badgeCount}
                      </Badge>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-border p-3">
          <Link
            to="/dashboard/patients"
            className="flex items-center gap-3 rounded-lg bg-secondary px-3 py-2.5 text-sm font-medium text-secondary-foreground hover:bg-secondary/80"
          >
            <Mic className="h-4 w-4" />
            Voice-to-Chart
          </Link>
        </div>
      </aside>

      <div className="flex flex-1 flex-col pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-end gap-4 border-b border-border bg-card/80 px-6 backdrop-blur">
          <button
            onClick={() => navigate("/dashboard/notifications")}
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
            )}
          </button>

          <ProfileMenu
            name={currentDoctor.name}
            email={currentDoctor.email}
            avatarInitials={currentDoctor.avatarInitials}
            basePath="/dashboard"
          />
        </header>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
