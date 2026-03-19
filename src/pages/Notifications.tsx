import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Bell, Plus, Loader2, Send, Users, User } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

const Notifications = () => {
  const { user, gym } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", message: "", target_type: "all", selected_members: [] as string[] });

  const fetchData = async () => {
    const [notifRes, memRes] = await Promise.all([
      supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("members").select("id, full_name, member_code, user_id").order("full_name"),
    ]);
    setNotifications(notifRes.data || []);
    setMembers(memRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSend = async () => {
    if (!form.title || !form.message) { toast.error("Title and message required"); return; }
    if (!gym || !user) return;
    setSaving(true);
    try {
      // Create notification
      const { data: notif, error: nErr } = await supabase.from("notifications").insert({
        title: form.title,
        message: form.message,
        target_type: form.target_type,
        gym_id: gym.id,
        created_by: user.id,
      }).select().single();
      if (nErr) throw nErr;

      // Create recipients
      let targetMembers: any[] = [];
      if (form.target_type === "all") {
        targetMembers = members.filter(m => m.user_id);
      } else {
        targetMembers = members.filter(m => form.selected_members.includes(m.id) && m.user_id);
      }

      if (targetMembers.length > 0) {
        const recipients = targetMembers.map(m => ({
          notification_id: notif.id,
          user_id: m.user_id,
        }));
        await supabase.from("notification_recipients").insert(recipients);
      }

      toast.success(`Notification sent to ${targetMembers.length} member(s)`);
      setOpen(false);
      setForm({ title: "", message: "", target_type: "all", selected_members: [] });
      fetchData();
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const toggleMember = (id: string) => {
    setForm(prev => ({
      ...prev,
      selected_members: prev.selected_members.includes(id)
        ? prev.selected_members.filter(m => m !== id)
        : [...prev.selected_members, id],
    }));
  };

  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Notifications</h1>
          <p className="text-sm text-muted-foreground">{notifications.length} notifications sent</p>
        </div>
        <button onClick={() => setOpen(true)} className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors flex items-center gap-2 self-start">
          <Plus className="w-4 h-4" /> Create Notification
        </button>
      </div>

      {notifications.length === 0 ? (
        <div className="bg-card rounded-xl p-12 shadow-surface text-center">
          <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-foreground font-medium">No notifications yet</p>
          <p className="text-sm text-muted-foreground">Send your first notification to members.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map(n => (
            <div key={n.id} className="bg-card rounded-xl p-4 shadow-surface">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {n.target_type === "all" ? <Users className="w-4 h-4 text-accent" /> : <User className="w-4 h-4 text-accent" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{n.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleDateString()}</p>
                  <span className={`text-xs font-medium ${n.target_type === "all" ? "text-accent" : "text-primary"}`}>
                    {n.target_type === "all" ? "All Members" : "Selected"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Notification Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Notification</DialogTitle>
            <DialogDescription>Send a notification to your gym members.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-label mb-1 block">Title *</label>
              <input className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Holiday Announcement" />
            </div>
            <div>
              <label className="text-label mb-1 block">Message *</label>
              <textarea className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground min-h-[80px]" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="The gym will be closed on..." />
            </div>
            <div>
              <label className="text-label mb-1 block">Target</label>
              <div className="flex gap-2">
                <button onClick={() => setForm({ ...form, target_type: "all", selected_members: [] })}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${form.target_type === "all" ? "bg-primary text-primary-foreground" : "bg-surface text-muted-foreground"}`}>
                  All Members
                </button>
                <button onClick={() => setForm({ ...form, target_type: "specific" })}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${form.target_type === "specific" ? "bg-primary text-primary-foreground" : "bg-surface text-muted-foreground"}`}>
                  Specific
                </button>
              </div>
            </div>
            {form.target_type === "specific" && (
              <div>
                <label className="text-label mb-1 block">Select Members ({form.selected_members.length})</label>
                <div className="max-h-40 overflow-y-auto space-y-1 bg-surface rounded-lg p-2">
                  {members.map(m => (
                    <label key={m.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-surface-raised cursor-pointer">
                      <input type="checkbox" checked={form.selected_members.includes(m.id)} onChange={() => toggleMember(m.id)} className="rounded" />
                      <span className="text-sm text-foreground">{m.full_name}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{m.member_code}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <button onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
            <button onClick={handleSend} disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Notifications;
