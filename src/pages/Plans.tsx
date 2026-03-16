import { useEffect, useState } from "react";
import { DataTable } from "@/components/DataTable";
import { Plus, Check, Loader2, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

interface Plan {
  id: string; name: string; price: number; duration_days: number;
  features: string[] | null; is_active: boolean; gym_id: string;
}

const Plans = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<Plan | null>(null);
  const [deleteItem, setDeleteItem] = useState<Plan | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", price: "", duration_days: "", features: "", is_active: true });

  const fetchData = async () => {
    const { data } = await supabase.from("plans").select("*").order("price", { ascending: true });
    setPlans(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => { setForm({ name: "", price: "", duration_days: "", features: "", is_active: true }); setEditItem(null); };

  const openEdit = (p: Plan) => {
    setEditItem(p);
    setForm({ name: p.name, price: p.price.toString(), duration_days: p.duration_days.toString(), features: p.features?.join(", ") || "", is_active: p.is_active });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price || !form.duration_days) { toast.error("Name, price and duration required"); return; }
    setSaving(true);
    try {
      const features = form.features.split(",").map(f => f.trim()).filter(Boolean);
      if (editItem) {
        const { error } = await supabase.from("plans").update({
          name: form.name, price: parseFloat(form.price), duration_days: parseInt(form.duration_days),
          features: features.length > 0 ? features : null, is_active: form.is_active,
        }).eq("id", editItem.id);
        if (error) throw error;
        toast.success("Plan updated");
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");
        const { data: gymId } = await supabase.rpc("get_user_gym_id", { _user_id: user.id });
        if (!gymId) throw new Error("No gym assigned");
        const { error } = await supabase.from("plans").insert({
          name: form.name, price: parseFloat(form.price), duration_days: parseInt(form.duration_days),
          features: features.length > 0 ? features : null, gym_id: gymId,
        });
        if (error) throw error;
        toast.success(`Plan "${form.name}" created`);
      }
      setOpen(false); resetForm(); fetchData();
    } catch (err: any) { toast.error(err.message); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("plans").delete().eq("id", deleteItem.id);
      if (error) throw error;
      toast.success(`Plan "${deleteItem.name}" removed`); setDeleteItem(null); fetchData();
    } catch (err: any) { toast.error(err.message); } finally { setSaving(false); }
  };

  const formatDuration = (days: number) => {
    if (days >= 365) return `${Math.round(days / 365)} year${days >= 730 ? "s" : ""}`;
    if (days >= 30) return `${Math.round(days / 30)} month${days >= 60 ? "s" : ""}`;
    return `${days} days`;
  };

  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Membership Plans</h1>
          <p className="text-sm text-muted-foreground">{plans.length} plans configured</p>
        </div>
        <button onClick={() => { resetForm(); setOpen(true); }} className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" /> Create Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.filter(p => p.is_active).slice(0, 3).map((plan) => (
          <div key={plan.id} className="bg-card rounded-xl p-5 shadow-surface hover:shadow-surface-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="px-2.5 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">{plan.name}</span>
              <span className="text-xs text-muted-foreground">{formatDuration(plan.duration_days)}</span>
            </div>
            <div className="mb-4">
              <span className="text-2xl font-semibold text-foreground">₹{plan.price.toLocaleString("en-IN")}</span>
              <span className="text-sm text-muted-foreground">/{formatDuration(plan.duration_days)}</span>
            </div>
            {plan.features && plan.features.length > 0 && (
              <ul className="space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="w-3.5 h-3.5 text-primary" /> {f}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      <DataTable
        columns={[
          { key: "name", header: "Plan Name" },
          { key: "price", header: "Price", render: (r: Plan) => <span>₹{r.price.toLocaleString("en-IN")}</span> },
          { key: "duration_days", header: "Duration", render: (r: Plan) => <span>{formatDuration(r.duration_days)}</span> },
          { key: "features", header: "Features", render: (r: Plan) => <span className="text-xs text-muted-foreground">{r.features?.length || 0} features</span> },
          { key: "is_active", header: "Status", render: (r: Plan) => <span className={`text-xs font-medium ${r.is_active ? "text-primary" : "text-destructive"}`}>{r.is_active ? "Active" : "Inactive"}</span> },
          { key: "actions", header: "", render: (r: Plan) => (
            <div className="flex items-center gap-1">
              <button onClick={() => openEdit(r)} className="p-1.5 rounded hover:bg-surface-raised text-muted-foreground hover:text-foreground transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
              <button onClick={() => setDeleteItem(r)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          )},
        ]}
        data={plans}
      />

      {/* Add/Edit Modal */}
      <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); setOpen(v); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editItem ? "Edit Plan" : "Create Plan"}</DialogTitle>
            <DialogDescription>{editItem ? `Editing ${editItem.name}` : "Add a new membership plan for your gym."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-label mb-1 block">Plan Name *</label>
              <input className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Premium Monthly" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-label mb-1 block">Price (₹) *</label>
                <input type="number" className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="3500" />
              </div>
              <div>
                <label className="text-label mb-1 block">Duration (days) *</label>
                <input type="number" className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={form.duration_days} onChange={(e) => setForm({ ...form, duration_days: e.target.value })} placeholder="30" />
              </div>
            </div>
            {editItem && (
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="rounded" />
                <label className="text-sm text-foreground">Active</label>
              </div>
            )}
            <div>
              <label className="text-label mb-1 block">Features (comma separated)</label>
              <textarea className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" rows={2} value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} placeholder="All equipment, Personal trainer, Locker" />
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => { setOpen(false); resetForm(); }} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editItem ? "Save Changes" : "Create Plan"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteItem} onOpenChange={(v) => !v && setDeleteItem(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Plan</DialogTitle>
            <DialogDescription>Remove "{deleteItem?.name}"? Members on this plan won't be affected.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button onClick={() => setDeleteItem(null)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
            <button onClick={handleDelete} disabled={saving} className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium hover:bg-destructive/90 transition-colors disabled:opacity-50 flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Plans;
