import { useEffect, useState } from "react";
import { DataTable } from "@/components/DataTable";
import { MetricCard } from "@/components/MetricCard";
import { StatusDot } from "@/components/StatusDot";
import { Building2, Users, DollarSign, Plus, Loader2, CheckCircle, Copy, Pencil, Eye, EyeOff, Power } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

interface Gym {
  id: string; name: string; code: string; city: string | null; email: string | null;
  phone: string | null; primary_color: string | null; secondary_color: string | null;
  is_active: boolean; created_at: string; admin_email: string | null; admin_initial_password: string | null;
}

const Gyms = () => {
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [credentialsModal, setCredentialsModal] = useState<{ gymName: string; email: string; password: string } | null>(null);
  const [detailGym, setDetailGym] = useState<Gym | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [editGym, setEditGym] = useState<Gym | null>(null);
  const [editForm, setEditForm] = useState({ name: "", city: "", email: "", phone: "", primary_color: "#22c55e", secondary_color: "#0a0a0a" });
  const [form, setForm] = useState({
    name: "", code: "", city: "", email: "", phone: "",
    primary_color: "#22c55e", secondary_color: "#0a0a0a",
    admin_email: "", admin_password: "", admin_name: "",
  });

  const fetchGyms = async () => {
    const { data } = await supabase.from("gyms").select("*").order("created_at", { ascending: false });
    if (data) setGyms(data as Gym[]);
    setLoading(false);
  };

  useEffect(() => { fetchGyms(); }, []);

  const handleCreate = async () => {
    if (!form.name || !form.code || !form.admin_email || !form.admin_password || !form.admin_name) {
      toast.error("Please fill in all required fields"); return;
    }
    setSaving(true);
    try {
      const { data: gym, error: gymError } = await supabase.from("gyms").insert({
        name: form.name, code: form.code.toUpperCase(), city: form.city || null,
        email: form.email || null, phone: form.phone || null,
        primary_color: form.primary_color, secondary_color: form.secondary_color,
        admin_email: form.admin_email, admin_initial_password: form.admin_password,
      }).select().single();
      if (gymError) throw gymError;

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
      toast.success(`Gym "${form.name}" created`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create gym");
    } finally { setSaving(false); }
  };

  const handleToggleActive = async (gym: Gym) => {
    try {
      const { error } = await supabase.from("gyms").update({ is_active: !gym.is_active }).eq("id", gym.id);
      if (error) throw error;
      toast.success(`${gym.name} ${gym.is_active ? "suspended" : "activated"}`);
      fetchGyms();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleEditGym = async () => {
    if (!editGym) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("gyms").update({
        name: editForm.name, city: editForm.city || null,
        email: editForm.email || null, phone: editForm.phone || null,
        primary_color: editForm.primary_color, secondary_color: editForm.secondary_color,
      }).eq("id", editGym.id);
      if (error) throw error;
      toast.success("Gym updated");
      setEditGym(null);
      fetchGyms();
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const openEditGym = (g: Gym) => {
    setEditGym(g);
    setEditForm({ name: g.name, city: g.city || "", email: g.email || "", phone: g.phone || "", primary_color: g.primary_color || "#22c55e", secondary_color: g.secondary_color || "#0a0a0a" });
  };

  const copyText = (text: string) => { navigator.clipboard.writeText(text); toast.success("Copied!"); };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Gym Directory</h1>
          <p className="text-sm text-muted-foreground">{gyms.length} gyms registered</p>
        </div>
        <button onClick={() => setOpen(true)} className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors flex items-center gap-2 self-start">
          <Plus className="w-4 h-4" /> Add Gym
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <MetricCard label="Total Gyms" value={gyms.length} icon={<Building2 className="w-4 h-4" />} />
        <MetricCard label="Active Gyms" value={gyms.filter(g => g.is_active).length} changeType="positive" icon={<Users className="w-4 h-4" />} />
        <MetricCard label="Suspended" value={gyms.filter(g => !g.is_active).length} changeType="negative" icon={<Power className="w-4 h-4" />} />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="overflow-x-auto">
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
              { key: "admin_email", header: "Admin", render: (row: Gym) => <span className="text-xs">{row.admin_email || "—"}</span> },
              { key: "is_active", header: "Status", render: (row: Gym) => <StatusDot status={row.is_active ? "operational" : "critical"} label={row.is_active ? "active" : "suspended"} /> },
              { key: "actions", header: "", render: (row: Gym) => (
                <div className="flex items-center gap-1">
                  <button onClick={() => setDetailGym(row)} className="p-1.5 rounded hover:bg-surface-raised text-muted-foreground hover:text-foreground transition-colors" title="View Details">
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => openEditGym(row)} className="p-1.5 rounded hover:bg-surface-raised text-muted-foreground hover:text-foreground transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleToggleActive(row)} className={`p-1.5 rounded transition-colors ${row.is_active ? "hover:bg-destructive/10 text-muted-foreground hover:text-destructive" : "hover:bg-primary/10 text-muted-foreground hover:text-primary"}`} title={row.is_active ? "Suspend" : "Activate"}>
                    <Power className="w-3.5 h-3.5" />
                  </button>
                </div>
              )},
            ]}
            data={gyms}
          />
        </div>
      )}

      {/* Gym Detail/Credentials Viewer */}
      <Dialog open={!!detailGym} onOpenChange={() => { setDetailGym(null); setShowPassword(false); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{detailGym?.name}</DialogTitle>
            <DialogDescription>Gym Details & Admin Credentials</DialogDescription>
          </DialogHeader>
          {detailGym && (
            <div className="space-y-3 py-2">
              <div className="bg-surface rounded-lg p-4 space-y-2">
                <div><p className="text-label">Code</p><p className="text-sm text-foreground font-mono">{detailGym.code}</p></div>
                <div><p className="text-label">City</p><p className="text-sm text-foreground">{detailGym.city || "—"}</p></div>
                <div><p className="text-label">Email</p><p className="text-sm text-foreground">{detailGym.email || "—"}</p></div>
                <div><p className="text-label">Phone</p><p className="text-sm text-foreground">{detailGym.phone || "—"}</p></div>
              </div>
              <div className="bg-surface rounded-lg p-4 space-y-2">
                <p className="text-label font-semibold">Admin Credentials</p>
                <div className="flex items-center justify-between">
                  <div><p className="text-label">Admin Email</p><p className="text-sm text-foreground font-mono">{detailGym.admin_email || "—"}</p></div>
                  {detailGym.admin_email && <button onClick={() => copyText(detailGym.admin_email!)} className="p-1 hover:bg-surface-raised rounded"><Copy className="w-3.5 h-3.5 text-muted-foreground" /></button>}
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-label">Initial Password</p>
                    <p className="text-sm text-foreground font-mono">
                      {detailGym.admin_initial_password ? (showPassword ? detailGym.admin_initial_password : "••••••••") : "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {detailGym.admin_initial_password && (
                      <>
                        <button onClick={() => setShowPassword(!showPassword)} className="p-1 hover:bg-surface-raised rounded">
                          {showPassword ? <EyeOff className="w-3.5 h-3.5 text-muted-foreground" /> : <Eye className="w-3.5 h-3.5 text-muted-foreground" />}
                        </button>
                        <button onClick={() => copyText(detailGym.admin_initial_password!)} className="p-1 hover:bg-surface-raised rounded"><Copy className="w-3.5 h-3.5 text-muted-foreground" /></button>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded" style={{ backgroundColor: detailGym.primary_color || "#22c55e" }} />
                <span className="text-xs text-muted-foreground">Primary: {detailGym.primary_color}</span>
                <div className="w-6 h-6 rounded" style={{ backgroundColor: detailGym.secondary_color || "#0a0a0a" }} />
                <span className="text-xs text-muted-foreground">Secondary: {detailGym.secondary_color}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <button onClick={() => { setDetailGym(null); setShowPassword(false); }} className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">Close</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Gym Dialog */}
      <Dialog open={!!editGym} onOpenChange={(v) => !v && setEditGym(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit {editGym?.name}</DialogTitle>
            <DialogDescription>Update gym details</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-label mb-1 block">Name *</label><input className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></div>
              <div><label className="text-label mb-1 block">City</label><input className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-label mb-1 block">Email</label><input className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} /></div>
              <div><label className="text-label mb-1 block">Phone</label><input className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-label mb-1 block">Primary Color</label><div className="flex items-center gap-2"><input type="color" value={editForm.primary_color} onChange={(e) => setEditForm({ ...editForm, primary_color: e.target.value })} className="w-8 h-8 rounded cursor-pointer border-0 p-0" /><span className="text-xs text-muted-foreground">{editForm.primary_color}</span></div></div>
              <div><label className="text-label mb-1 block">Secondary Color</label><div className="flex items-center gap-2"><input type="color" value={editForm.secondary_color} onChange={(e) => setEditForm({ ...editForm, secondary_color: e.target.value })} className="w-8 h-8 rounded cursor-pointer border-0 p-0" /><span className="text-xs text-muted-foreground">{editForm.secondary_color}</span></div></div>
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setEditGym(null)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
            <button onClick={handleEditGym} disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Gym Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
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
            <div><label className="text-label mb-1 block">Email</label><input className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="info@gym.com" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-label mb-1 block">Primary Color</label><div className="flex items-center gap-2"><input type="color" value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} className="w-8 h-8 rounded cursor-pointer border-0 p-0" /><span className="text-xs text-muted-foreground">{form.primary_color}</span></div></div>
              <div><label className="text-label mb-1 block">Secondary Color</label><div className="flex items-center gap-2"><input type="color" value={form.secondary_color} onChange={(e) => setForm({ ...form, secondary_color: e.target.value })} className="w-8 h-8 rounded cursor-pointer border-0 p-0" /><span className="text-xs text-muted-foreground">{form.secondary_color}</span></div></div>
            </div>
            <div className="border-t border-border pt-4">
              <p className="text-sm font-medium text-foreground mb-3">Gym Admin Account</p>
              <div className="space-y-3">
                <div><label className="text-label mb-1 block">Admin Name *</label><input className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={form.admin_name} onChange={(e) => setForm({ ...form, admin_name: e.target.value })} placeholder="Rahul Verma" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-label mb-1 block">Admin Email *</label><input className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={form.admin_email} onChange={(e) => setForm({ ...form, admin_email: e.target.value })} placeholder="admin@gym.com" /></div>
                  <div><label className="text-label mb-1 block">Password *</label><input type="password" className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={form.admin_password} onChange={(e) => setForm({ ...form, admin_password: e.target.value })} placeholder="••••••••" /></div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
            <button onClick={handleCreate} disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2">
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
                <div className="flex items-center justify-between"><div><p className="text-label">Gym</p><p className="text-sm text-foreground font-medium">{credentialsModal.gymName}</p></div></div>
                <div className="flex items-center justify-between">
                  <div><p className="text-label">Email</p><p className="text-sm text-foreground font-mono">{credentialsModal.email}</p></div>
                  <button onClick={() => copyText(credentialsModal.email)} className="p-1 hover:bg-surface-raised rounded"><Copy className="w-3.5 h-3.5 text-muted-foreground" /></button>
                </div>
                <div className="flex items-center justify-between">
                  <div><p className="text-label">Password</p><p className="text-sm text-foreground font-mono">{credentialsModal.password}</p></div>
                  <button onClick={() => copyText(credentialsModal.password)} className="p-1 hover:bg-surface-raised rounded"><Copy className="w-3.5 h-3.5 text-muted-foreground" /></button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center">⚠️ Save these credentials.</p>
            </div>
          )}
          <DialogFooter>
            <button onClick={() => setCredentialsModal(null)} className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">Done</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Gyms;
