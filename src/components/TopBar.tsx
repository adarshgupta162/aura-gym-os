import { useEffect, useState } from "react";
import { Search, Bell } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export function TopBar({ sidebarWidth }: { sidebarWidth: number }) {
  const { user, gym, isSuperAdmin, roles } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  const displayName = user?.user_metadata?.full_name || user?.email || "User";
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase();
  const roleLabel = isSuperAdmin ? "Super Admin" : roles[0]?.role?.replace("_", " ") || "";

  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      const { count } = await supabase
        .from("notification_recipients")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .is("read_at", null);
      setUnreadCount(count || 0);
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <header
      className="fixed top-0 right-0 z-30 h-16 border-b border-border bg-background/80 backdrop-blur-sm flex items-center px-4 md:px-6 gap-4"
      style={{ left: sidebarWidth }}
    >
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

      <div className="flex-1 max-w-xl hidden md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search members, equipment, plans..."
            className="w-full bg-surface rounded-lg pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground shadow-surface focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 ml-auto">
        <button
          onClick={() => navigate("/notifications")}
          className="relative p-2 rounded-lg hover:bg-surface transition-colors"
        >
          <Bell className="w-4 h-4 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full text-[10px] text-primary-foreground flex items-center justify-center font-bold">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
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
