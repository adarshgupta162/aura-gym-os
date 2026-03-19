import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ("super_admin" | "gym_admin" | "trainer" | "member")[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading, roles, rolesLoaded, activeRole } = useAuth();
  const location = useLocation();

  if (loading || !rolesLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // Members on "/" should go to /my-portal
  if (activeRole === "member" && location.pathname === "/") {
    return <Navigate to="/my-portal" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const hasAccess = roles.some((r) => allowedRoles.includes(r.role));
    if (!hasAccess) return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
