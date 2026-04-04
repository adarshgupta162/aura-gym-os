import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard, Users, Dumbbell, CreditCard, BarChart3,
  Tags, Building2, ChevronLeft, ChevronRight, QrCode,
  Settings, LogOut, PersonStanding, UserCircle, Bell,
  UtensilsCrossed, UserPlus, Star, Package, Share2,
  Clock, FileText, Download, Shield, Wallet,
} from "lucide-react";

const allNavItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard", roles: ["super_admin", "gym_admin"] },
  { to: "/gyms", icon: Building2, label: "Gyms", roles: ["super_admin"] },
  { to: "/gym-subscriptions", icon: Wallet, label: "Subscriptions", roles: ["super_admin"] },
  { to: "/members", icon: Users, label: "Members", roles: ["gym_admin"] },
  { to: "/trainers", icon: PersonStanding, label: "Trainers", roles: ["gym_admin"] },
  { to: "/attendance", icon: QrCode, label: "Attendance", roles: ["gym_admin"] },
  { to: "/staff-attendance", icon: Clock, label: "Staff Attendance", roles: ["gym_admin"] },
  { to: "/equipment", icon: Dumbbell, label: "Equipment", roles: ["gym_admin"] },
  { to: "/finance", icon: CreditCard, label: "Finance", roles: ["gym_admin"] },
  { to: "/analytics", icon: BarChart3, label: "Analytics", roles: ["gym_admin"] },
  { to: "/plans", icon: Tags, label: "Plans", roles: ["gym_admin"] },
  { to: "/diet-plans", icon: UtensilsCrossed, label: "Diet Plans", roles: ["gym_admin"] },
  { to: "/enquiries", icon: UserPlus, label: "Enquiries", roles: ["gym_admin"] },
  { to: "/inventory", icon: Package, label: "Inventory", roles: ["gym_admin"] },
  { to: "/referrals", icon: Share2, label: "Referrals", roles: ["gym_admin"] },
  { to: "/feedback", icon: Star, label: "Feedback", roles: ["gym_admin"] },
  { to: "/reports", icon: FileText, label: "Reports", roles: ["gym_admin"] },
  { to: "/data-export", icon: Download, label: "Data Export", roles: ["gym_admin"] },
  { to: "/audit-log", icon: Shield, label: "Audit Log", roles: ["gym_admin"] },
  { to: "/notifications", icon: Bell, label: "Notifications", roles: ["gym_admin", "super_admin"] },
  { to: "/my-portal", icon: UserCircle, label: "My Portal", roles: ["member"] },
];

export function AppSidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const location = useLocation();
  const { roles, gym, isSuperAdmin, signOut } = useAuth();

  const activeRole = roles.length > 0 ? roles[0].role : null;
  const navItems = allNavItems.filter(
    (item) => !activeRole || item.roles.includes(activeRole)
  );

  const brandName = isSuperAdmin ? "AuraFarming" : (gym?.name || "AuraFarming");
  const brandInitials = isSuperAdmin ? "AF" : (gym?.code?.substring(0, 2) || "AF");

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className="fixed left-0 top-0 bottom-0 z-40 flex flex-col bg-sidebar border-r border-border"
    >
      <div className="h-16 flex items-center px-4 border-b border-border">
        <div className="flex items-center gap-3 overflow-hidden">
          {gym?.logo_url && !isSuperAdmin ? (
            <img src={gym.logo_url} alt={brandName} className="w-8 h-8 rounded-lg flex-shrink-0 object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
              <span className="text-primary-foreground font-bold text-sm">{brandInitials}</span>
            </div>
          )}
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="whitespace-nowrap overflow-hidden"
              >
                <span className="font-semibold text-sm text-foreground">{brandName}</span>
                {!isSuperAdmin && (
                  <p className="text-[10px] text-muted-foreground">Powered by AuraFarming</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors duration-150 group
                ${isActive
                  ? "bg-sidebar-accent text-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
            >
              <item.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-primary" : ""}`} />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          );
        })}
      </nav>

      <div className="py-3 px-2 border-t border-border space-y-0.5">
        <NavLink
          to="/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          <Settings className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span className="whitespace-nowrap">Settings</span>}
        </NavLink>
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive w-full transition-colors"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
        <button
          onClick={onToggle}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent w-full transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </motion.aside>
  );
}
