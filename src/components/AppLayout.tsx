import { useState } from "react";
import type { CSSProperties } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { TopBar } from "./TopBar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard, Users, QrCode, CreditCard, Bell,
  Building2, UserCircle, Home, BarChart3, Settings,
} from "lucide-react";

const mobileNavItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard", roles: ["super_admin", "gym_admin"] },
  { to: "/members", icon: Users, label: "Members", roles: ["gym_admin"] },
  { to: "/attendance", icon: QrCode, label: "Attendance", roles: ["gym_admin"] },
  { to: "/finance", icon: CreditCard, label: "Finance", roles: ["gym_admin"] },
  { to: "/settings", icon: Settings, label: "Settings", roles: ["gym_admin", "super_admin"] },
  { to: "/gyms", icon: Building2, label: "Gyms", roles: ["super_admin"] },
  { to: "/notifications", icon: Bell, label: "Alerts", roles: ["super_admin"] },
  { to: "/my-portal", icon: Home, label: "Home", roles: ["member"] },
];

export function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isMobile = useIsMobile();
  const { roles } = useAuth();
  const location = useLocation();

  const activeRole = roles.length > 0 ? roles[0].role : null;
  const sidebarWidth = isMobile ? 0 : (sidebarCollapsed ? 64 : 240);

  const visibleMobileNav = mobileNavItems
    .filter(item => !activeRole || item.roles.includes(activeRole))
    .slice(0, 5);

  return (
    <div
      className="min-h-screen bg-background"
      style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}
    >
      {!isMobile && (
        <AppSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      )}
      <TopBar sidebarWidth={sidebarWidth} />
      <main
        className="pt-16 transition-all duration-200 pb-20 md:pb-0"
        style={{ marginLeft: sidebarWidth }}
      >
        <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
          <Outlet />
        </div>
      </main>
      {isMobile && activeRole !== "member" && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border flex items-center justify-around px-1 py-1">
          {visibleMobileNav.map(item => {
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center gap-0.5 px-2 py-2 rounded-lg min-h-[48px] min-w-[48px] justify-center transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      )}
    </div>
  );
}
