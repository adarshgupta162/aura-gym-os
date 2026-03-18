import { useEffect, useState, useCallback } from "react";
import { Bell, Plus, Loader2, Send, Users, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

const Notifications = () => {
  const { user, gym, isSuperAdmin } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", message: "", target_type: "all", selectedMembers: [] as string[] });

  const fetchData = useCallback(async () => {
    if (!gym && !isSuperAdmin) { setLoading(false); return; }
    const [notifRes, memRes] = await Promise.all([
      gym
        ? supabase.from("notifications").select("*").eq("gym_id", gym.id).order("created_at", { ascending: false })
        : supabase.from("notifications").select("*").order("created_at", { ascending: false }),
      gym
        ? supabase.from("members").select("id, full_name, member_code, user_id").eq("gym_id", gym.id)
        : supabase.from("members").select("id, full_name, member_code, user_id"),
    ]);
    setNotifications(notifRes.data || []);
    setMembers(memRes.data || []);
    setLoading(false);
  }, [gym, isSuperAdmin]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async () => {
    if (!form.title || !form.message) { toast.error("Title and message required"); return; }
    if (!user) return;
    setSaving(true);
    try {
      let gymId = gym?.id;
      if (!gymId && isSuperAdmin) {
        // For super admin, pick first gym or require selection
        const { data: gyms } = await supabase.from("gyms").select("id").limit(1);
        if (gyms && gyms.length > 0) gymId = gyms[0].id;
        else throw new Error("No gyms found");
      }
      if (!gymId) throw new Error("No gym context");

      const { data: notif, error } = await supabase.from("notifications").insert({
        gym_id: gymId,
        title: form.title,
        message: form.message,
        target_type: form.target_type,
        created_by: user.id,
      }).select().single();
      if (error) throw error;

      // Create recipients
      if (form.target_type === "specific" && form.selectedMembers.length > 0) {
        const recipients = form.selectedMembers
          .map(mid => {
            const m = members.find(mem => mem.id === mid);
            return m?.user_id ? { notification_id: notif.id, user_id: m.user_id } : null;
          })
          .filter(Boolean);
        if (recipients.length > 0) {
          await supabase.from("notification_recipients").insert(recipients);
        }
      } else {
        // All members
        const recipients = members
          .filter(m => m.user_id)
          .map(m => ({ notification_id: notif.id, user_id: m.user_id }));
        if (recipients.length > 0) {
          await supabase.from("notification_recipients").insert(recipients);
        }
      }

      toast.success("Notification sent!");
      setCreateOpen(false);
      setForm({ title: "", message: "", target_type: "all", selectedMembers: [] });
      fetchData();
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const toggleMember = (id: string) => {
    setForm(prev => ({
      ...prev,
      selectedMembers: prev.selectedMembers.includes(id)
        ? prev.selectedMembers.filter(m => m !== id)
        : [...prev.selectedMembers, id],
    }));
  };

  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Notifications</h1>
          <p className="text-sm text-muted-foreground">Send announcements to your members</p>
        </div>
        <button onClick={() => setCreateOpen(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Notification
        </button>
      </div>

      {notifications.length === 0 ? (
        <div className="bg-card rounded-xl p-12 shadow-surface text-center">
          <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-foreground font-medium">No notifications sent yet</p>
          <p className="text-sm text-muted-foreground">Create your first announcement for members.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map(n => (
            <div key={n.id} className="bg-card rounded-xl p-5 shadow-surface">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-medium text-foreground">{n.title}</h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${n.target_type === "all" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"}`}>
                      {n.target_type === "all" ? "All Members" : "Selected"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{n.message}</p>
                </div>
                <p className="text-xs text-muted-foreground whitespace-nowrap ml-4">{new Date(n.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Notification Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Send className="w-5 h-5" /> Send Notification</DialogTitle>
            <DialogDescription>Create an announcement for your members.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-label mb-1 block">Title *</label>
              <input className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground"
                value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Gym Closed on Sunday" />
            </div>
            <div>
              <label className="text-label mb-1 block">Message *</label>
              <textarea className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground min-h-[80px] resize-none"
                value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Write your announcement..." />
            </div>
            <div>
              <label className="text-label mb-2 block">Send To</label>
              <div className="flex gap-2">
                <button onClick={() => setForm({ ...form, target_type: "all", selectedMembers: [] })}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors ${form.target_type === "all" ? "bg-primary text-primary-foreground" : "bg-surface text-muted-foreground"}`}>
                  <Users className="w-3.5 h-3.5" /> All Members
                </button>
                <button onClick={() => setForm({ ...form, target_type: "specific" })}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors ${form.target_type === "specific" ? "bg-primary text-primary-foreground" : "bg-surface text-muted-foreground"}`}>
                  <User className="w-3.5 h-3.5" /> Select Members
                </button>
              </div>
            </div>
            {form.target_type === "specific" && (
              <div className="max-h-40 overflow-y-auto space-y-1">
                {members.map(m => (
                  <button key={m.id} onClick={() => toggleMember(m.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${form.selectedMembers.includes(m.id) ? "bg-primary/10 text-primary" : "hover:bg-surface-raised text-foreground"}`}>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${form.selectedMembers.includes(m.id) ? "bg-primary border-primary" : "border-border"}`}>
                      {form.selectedMembers.includes(m.id) && <span className="text-primary-foreground text-[10px]">✓</span>}
                    </div>
                    {m.full_name} <span className="text-xs text-muted-foreground">({m.member_code})</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <button onClick={() => setCreateOpen(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
            <button onClick={handleCreate} disabled={saving}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Send
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Notifications;
