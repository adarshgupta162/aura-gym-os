import { Search, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationBell } from "@/components/NotificationBell";

export function TopBar({ sidebarWidth }: { sidebarWidth: number }) {
  const { user, gym, isSuperAdmin, roles } = useAuth();
  
  const displayName = user?.user_metadata?.full_name || user?.email || "User";
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase();
  const roleLabel = isSuperAdmin ? "Super Admin" : roles[0]?.role?.replace("_", " ") || "";

  return (
    <header
      className="fixed top-0 right-0 z-30 h-16 border-b border-border bg-background/80 backdrop-blur-sm flex items-center px-6 gap-4"
      style={{ left: sidebarWidth }}
    >
      {/* Gym / Role Badge */}
      <div className="flex items-center gap-2">
        {gym && !isSuperAdmin && (
          <span className="px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
            {gym.code}
          </span>
        )}
        {isSuperAdmin && (
          <span className="px-2.5 py-1 rounded-md bg-accent/10 text-accent text-xs font-medium">
            Platform Admin
          </span>
        )}
      </div>

      {/* Search */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search members, equipment, plans..."
            className="w-full bg-surface rounded-lg pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground shadow-surface focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <NotificationBell />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
            <span className="text-accent text-xs font-bold">{initials}</span>
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-medium text-foreground">{displayName}</p>
            <p className="text-[10px] text-muted-foreground capitalize">{roleLabel}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
