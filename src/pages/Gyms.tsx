import { useEffect, useState } from "react";
import { DataTable } from "@/components/DataTable";
import { MetricCard } from "@/components/MetricCard";
import { StatusDot } from "@/components/StatusDot";
import { Building2, Users, DollarSign, Plus, Loader2, CheckCircle, Copy, Power, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

interface Gym {
  id: string; name: string; code: string; city: string | null; email: string | null;
  phone: string | null; primary_color: string | null; secondary_color: string | null;
  is_active: boolean; created_at: string;
}

const Gyms = () => {
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [credentialsModal, setCredentialsModal] = useState<{ gymName: string; email: string; password: string } | null>(null);
  const [viewGym, setViewGym] = useState<any>(null);
  const [viewGymMembers, setViewGymMembers] = useState<any[]>([]);
  const [viewGymPayments, setViewGymPayments] = useState<any[]>([]);
  const [viewLoading, setViewLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", code: "", city: "", email: "", phone: "",
    primary_color: "#22c55e", secondary_color: "#0a0a0a",
    admin_email: "", admin_password: "", admin_name: "",
  });

  const fetchGyms = async () => {
    const { data } = await supabase.from("gyms").select("*").order("created_at", { ascending: false });
    if (data) setGyms(data);
    setLoading(false);
  };

  useEffect(() => { fetchGyms(); }, []);

  const handleToggleActive = async (gym: Gym) => {
    try {
      const { error } = await supabase.from("gyms").update({ is_active: !gym.is_active }).eq("id", gym.id);
      if (error) throw error;
      toast.success(gym.is_active ? `${gym.name} suspended` : `${gym.name} activated`);
      fetchGyms();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleViewGym = async (gym: Gym) => {
    setViewGym(gym);
    setViewLoading(true);
    const [memRes, payRes] = await Promise.all([
      supabase.from("members").select("id, full_name, member_code, status, email").eq("gym_id", gym.id).limit(50),
      supabase.from("payments").select("amount, status").eq("gym_id", gym.id),
    ]);
    setViewGymMembers(memRes.data || []);
    setViewGymPayments(payRes.data || []);
    setViewLoading(false);
  };


    if (!form.name || !form.code || !form.admin_email || !form.admin_password || !form.admin_name) {
      toast.error("Please fill in all required fields"); return;
    }
    setSaving(true);
    try {
      // 1. Create the gym
      const { data: gym, error: gymError } = await supabase.from("gyms").insert({
        name: form.name, code: form.code.toUpperCase(), city: form.city || null,
        email: form.email || null, phone: form.phone || null,
        primary_color: form.primary_color, secondary_color: form.secondary_color,
      }).select().single();
      if (gymError) throw gymError;

      // 2. Create gym admin via edge function (uses service role)
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("create-user", {
        body: {
          email: form.admin_email, password: form.admin_password,
          full_name: form.admin_name, role: "gym_admin", gym_id: gym.id,
        },
      });
      if (res.error) throw new Error(res.error.message || "Failed to create admin account");
      if (res.data?.error) throw new Error(res.data.error);

      setOpen(false);
      setCredentialsModal({ gymName: form.name, email: form.admin_email, password: form.admin_password });
      setForm({ name: "", code: "", city: "", email: "", phone: "", primary_color: "#22c55e", secondary_color: "#0a0a0a", admin_email: "", admin_password: "", admin_name: "" });
      fetchGyms();
      toast.success(`Gym "${form.name}" created successfully`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create gym");
    } finally { setSaving(false); }
  };

  const copyText = (text: string) => { navigator.clipboard.writeText(text); toast.success("Copied!"); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Gym Directory</h1>
          <p className="text-sm text-muted-foreground">{gyms.length} gyms registered</p>
        </div>
        <button onClick={() => setOpen(true)} className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Gym
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <MetricCard label="Total Gyms" value={gyms.length} icon={<Building2 className="w-4 h-4" />} />
        <MetricCard label="Active Gyms" value={gyms.filter(g => g.is_active).length} changeType="positive" icon={<Users className="w-4 h-4" />} />
        <MetricCard label="Platform Revenue" value="—" icon={<DollarSign className="w-4 h-4" />} />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <DataTable
          columns={[
            { key: "name", header: "Gym", render: (row: Gym) => (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${row.primary_color}20` }}>
                  <Building2 className="w-4 h-4" style={{ color: row.primary_color || undefined }} />
                </div>
                <div><p className="text-foreground font-medium">{row.name}</p><p className="text-xs text-muted-foreground">{row.city || "—"}</p></div>
              </div>
            )},
            { key: "code", header: "Code" },
            { key: "email", header: "Email", render: (row: Gym) => <span>{row.email || "—"}</span> },
            { key: "is_active", header: "Status", render: (row: Gym) => <StatusDot status={row.is_active ? "operational" : "critical"} label={row.is_active ? "active" : "inactive"} /> },
            { key: "actions", header: "Actions", render: (row: Gym) => (
              <div className="flex items-center gap-2">
                <button onClick={() => handleViewGym(row)} className="p-1.5 rounded-lg hover:bg-surface-raised transition-colors" title="View Details">
                  <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
                <button onClick={() => handleToggleActive(row)} className="p-1.5 rounded-lg hover:bg-surface-raised transition-colors" title={row.is_active ? "Suspend" : "Activate"}>
                  <Power className={`w-3.5 h-3.5 ${row.is_active ? "text-destructive" : "text-primary"}`} />
                </button>
              </div>
            )},
          ]}
          data={gyms}
        />
      )}

      {/* Add Gym Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Gym</DialogTitle>
            <DialogDescription>Create a new gym and assign an admin user.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-label mb-1 block">Gym Name *</label><input className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Kashimaya Gym" /></div>
              <div><label className="text-label mb-1 block">Gym Code *</label><input className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground uppercase" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="KSM" maxLength={5} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-label mb-1 block">City</label><input className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Mumbai" /></div>
              <div><label className="text-label mb-1 block">Phone</label><input className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="9876543210" /></div>
            </div>
            <div><label className="text-label mb-1 block">Email</label><input className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="info@kashimaya.com" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-label mb-1 block">Primary Color</label><div className="flex items-center gap-2"><input type="color" value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} className="w-8 h-8 rounded cursor-pointer border-0 p-0" /><span className="text-xs text-muted-foreground">{form.primary_color}</span></div></div>
              <div><label className="text-label mb-1 block">Secondary Color</label><div className="flex items-center gap-2"><input type="color" value={form.secondary_color} onChange={(e) => setForm({ ...form, secondary_color: e.target.value })} className="w-8 h-8 rounded cursor-pointer border-0 p-0" /><span className="text-xs text-muted-foreground">{form.secondary_color}</span></div></div>
            </div>
            <div className="border-t border-border pt-4">
              <p className="text-sm font-medium text-foreground mb-3">Gym Admin Account</p>
              <div className="space-y-3">
                <div><label className="text-label mb-1 block">Admin Name *</label><input className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={form.admin_name} onChange={(e) => setForm({ ...form, admin_name: e.target.value })} placeholder="Rahul Verma" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-label mb-1 block">Admin Email *</label><input className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={form.admin_email} onChange={(e) => setForm({ ...form, admin_email: e.target.value })} placeholder="admin@kashimaya.com" /></div>
                  <div><label className="text-label mb-1 block">Password *</label><input type="password" className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={form.admin_password} onChange={(e) => setForm({ ...form, admin_password: e.target.value })} placeholder="••••••••" /></div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
            <button onClick={handleCreate} disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Create Gym
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Credentials Modal */}
      <Dialog open={!!credentialsModal} onOpenChange={() => setCredentialsModal(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-primary" /> Gym Created!</DialogTitle>
            <DialogDescription>Share these credentials with the gym admin.</DialogDescription>
          </DialogHeader>
          {credentialsModal && (
            <div className="space-y-3 py-2">
              <div className="bg-surface rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div><p className="text-label">Gym</p><p className="text-sm text-foreground font-medium">{credentialsModal.gymName}</p></div>
                </div>
                <div className="flex items-center justify-between">
                  <div><p className="text-label">Login Email</p><p className="text-sm text-foreground font-mono">{credentialsModal.email}</p></div>
                  <button onClick={() => copyText(credentialsModal.email)} className="p-1 hover:bg-surface-raised rounded"><Copy className="w-3.5 h-3.5 text-muted-foreground" /></button>
                </div>
                <div className="flex items-center justify-between">
                  <div><p className="text-label">Password</p><p className="text-sm text-foreground font-mono">{credentialsModal.password}</p></div>
                  <button onClick={() => copyText(credentialsModal.password)} className="p-1 hover:bg-surface-raised rounded"><Copy className="w-3.5 h-3.5 text-muted-foreground" /></button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center">⚠️ Save these credentials — the password won't be shown again.</p>
            </div>
          )}
          <DialogFooter>
            <button onClick={() => setCredentialsModal(null)} className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">Done</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Gym Dialog */}
      <Dialog open={!!viewGym} onOpenChange={() => setViewGym(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{viewGym?.name}</DialogTitle>
            <DialogDescription>Gym details and member overview</DialogDescription>
          </DialogHeader>
          {viewLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-surface rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-foreground">{viewGymMembers.length}</p>
                  <p className="text-xs text-muted-foreground">Members</p>
                </div>
                <div className="bg-surface rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-foreground">{viewGymMembers.filter(m => m.status === "active").length}</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
                <div className="bg-surface rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-foreground">₹{viewGymPayments.filter(p => p.status === "completed").reduce((s: number, p: any) => s + Number(p.amount), 0).toLocaleString("en-IN")}</p>
                  <p className="text-xs text-muted-foreground">Revenue</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground mb-2">Members</p>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {viewGymMembers.map((m: any) => (
                    <div key={m.id} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-surface-raised text-sm">
                      <span className="text-foreground">{m.full_name} <span className="text-xs text-muted-foreground">({m.member_code})</span></span>
                      <span className={`text-xs font-medium capitalize ${m.status === "active" ? "text-primary" : m.status === "frozen" ? "text-destructive" : "text-muted-foreground"}`}>{m.status}</span>
                    </div>
                  ))}
                  {viewGymMembers.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No members</p>}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <button onClick={() => setViewGym(null)} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">Close</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Gyms;
