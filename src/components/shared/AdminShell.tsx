import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users2,
  MessagesSquare,
  BarChart3,
  Settings,
  ScrollText,
  Bell,
  Stethoscope,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppState } from "@/context/AppStateContext";
import { currentAdmin } from "@/data/roles";
import { Badge } from "@/components/ui/badge";
import ProfileMenu from "@/components/shared/ProfileMenu";

const navItems = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/staff", label: "Staff Management", icon: Users2 },
  { to: "/admin/communication", label: "Communication Overview", icon: MessagesSquare },
  { to: "/admin/reports", label: "Reports Dashboard", icon: BarChart3 },
  { to: "/admin/logs", label: "Audit & System Logs", icon: ScrollText },
  { to: "/admin/settings", label: "Clinic Settings", icon: Settings },
  { to: "/admin/notifications", label: "Notifications", icon: Bell, badgeKey: "unread" },
];

export default function AdminShell() {
  const navigate = useNavigate();
  const { notifications } = useAppState();
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="flex min-h-screen bg-muted/40">
      <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-border bg-card">
        <Link to="/admin" className="flex items-center gap-2 px-6 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Stethoscope className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">DentVerse</span>
        </Link>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {navItems.map((item) => {
            const badgeCount = item.badgeKey === "unread" ? unreadCount : 0;
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
          <div className="rounded-lg bg-secondary px-3 py-2.5 text-xs text-secondary-foreground">
            Full system access — clinic operations, analytics, and configuration.
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-end gap-4 border-b border-border bg-card/80 px-6 backdrop-blur">
          <button
            onClick={() => navigate("/admin/notifications")}
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
            )}
          </button>

          <ProfileMenu
            name={currentAdmin.name}
            email={currentAdmin.email}
            avatarInitials={currentAdmin.avatarInitials}
            basePath="/admin"
          />
        </header>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
