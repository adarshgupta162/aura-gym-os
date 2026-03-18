import { useEffect, useState, useRef } from "react";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function NotificationBell() {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data, count } = await supabase
        .from("notification_recipients")
        .select("*, notifications(title, message, created_at)", { count: "exact" })
        .eq("user_id", user.id)
        .is("read_at", null)
        .order("created_at", { ascending: false })
        .limit(10);
      setNotifications(data || []);
      setUnread(count || 0);
    };
    fetch();
  }, [user]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notification_recipients").update({ read_at: new Date().toISOString() })
      .eq("user_id", user.id).is("read_at", null);
    setUnread(0);
    setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => { setOpen(!open); if (!open && unread > 0) markAllRead(); }}
        className="relative p-2 rounded-lg hover:bg-surface transition-colors">
        <Bell className="w-4 h-4 text-muted-foreground" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-primary rounded-full text-[10px] text-primary-foreground flex items-center justify-center font-bold">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-card rounded-xl shadow-lg border border-border z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-medium text-foreground">Notifications</p>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No notifications</p>
            ) : notifications.map(n => (
              <div key={n.id} className="px-4 py-3 border-b border-border last:border-0 hover:bg-surface-raised">
                <p className="text-sm font-medium text-foreground">{n.notifications?.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{n.notifications?.message}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{n.notifications?.created_at ? new Date(n.notifications.created_at).toLocaleDateString() : ""}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
