import { Navigate, Outlet } from "react-router-dom";
import { useAppState } from "@/context/AppStateContext";
import { ROLE_HOME, type Role } from "@/data/roles";

export default function RequireRole({ allow }: { allow: Role[] }) {
  const { loggedIn, role } = useAppState();

  if (!loggedIn || !role) {
    return <Navigate to="/login" replace />;
  }

  if (!allow.includes(role)) {
    return <Navigate to={ROLE_HOME[role]} replace />;
  }

  return <Outlet />;
}
