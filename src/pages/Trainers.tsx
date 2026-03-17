import { useEffect, useState } from "react";
import { DataTable } from "@/components/DataTable";
import { MetricCard } from "@/components/MetricCard";
import { StatusDot } from "@/components/StatusDot";
import { Users, UserPlus, DollarSign, Plus, Dumbbell, Loader2, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

interface Trainer {
  id: string; trainer_code: string; full_name: string; phone: string | null;
  specialization: string | null; salary: number | null; status: string; gym_id: string; created_at: string;
}

const Trainers = () => {
  const { gym } = useAuth();
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<Trainer | null>(null);
  const [deleteItem, setDeleteItem] = useState<Trainer | null>(null);
  const [saving, setSaving] = useState(false);
  const [nextCode, setNextCode] = useState("");
  const [form, setForm] = useState({ full_name: "", phone: "", specialization: "", salary: "", status: "active" });

  const fetchData = async () => {
    const { data } = await supabase.from("trainers").select("*").order("created_at", { ascending: false });
    if (data) setTrainers(data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const generateCode = async () => {
    if (!gym) return "";
    const { count } = await supabase.from("trainers").select("*", { count: "exact", head: true }).eq("gym_id", gym.id);
    return `${gym.code}T${String((count || 0) + 1).padStart(4, "0")}`;
  };

  const resetForm = () => { setForm({ full_name: "", phone: "", specialization: "", salary: "", status: "active" }); setNextCode(""); setEditItem(null); };

  const openAdd = async () => { resetForm(); setNextCode(await generateCode()); setOpen(true); };

  const openEdit = (t: Trainer) => {
    setEditItem(t);
    setForm({ full_name: t.full_name, phone: t.phone || "", specialization: t.specialization || "", salary: t.salary?.toString() || "", status: t.status });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.full_name) { toast.error("Name required"); return; }
    if (!gym) { toast.error("No gym context"); return; }
    setSaving(true);
    try {
      if (editItem) {
        const { error } = await supabase.from("trainers").update({
          full_name: form.full_name, phone: form.phone || null,
          specialization: form.specialization || null, salary: form.salary ? parseFloat(form.salary) : null, status: form.status,
        }).eq("id", editItem.id);
        if (error) throw error;
        toast.success("Trainer updated");
      } else {
        const code = nextCode || await generateCode();
        const { error } = await supabase.from("trainers").insert({
          trainer_code: code, full_name: form.full_name, phone: form.phone || null,
          specialization: form.specialization || null, salary: form.salary ? parseFloat(form.salary) : null, gym_id: gym.id,
        });
        if (error) throw error;
        toast.success(`Trainer ${code} created`);
      }
      setOpen(false); resetForm(); fetchData();
    } catch (err: any) { toast.error(err.message); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("trainers").delete().eq("id", deleteItem.id);
      if (error) throw error;
      toast.success(`${deleteItem.full_name} removed`); setDeleteItem(null); fetchData();
    } catch (err: any) { toast.error(err.message); } finally { setSaving(false); }
  };

  const totalSalary = trainers.reduce((sum, t) => sum + (t.salary || 0), 0);
  const formatCurrency = (n: number) => n >= 100000 ? `₹${(n / 100000).toFixed(2)}L` : n >= 1000 ? `₹${(n / 1000).toFixed(1)}K` : `₹${n}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-lg font-semibold text-foreground">Trainers</h1><p className="text-sm text-muted-foreground">{trainers.length} trainers</p></div>
        <button onClick={openAdd} className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors flex items-center gap-2"><Plus className="w-4 h-4" /> Add Trainer</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Trainers" value={trainers.length} icon={<Dumbbell className="w-4 h-4" />} />
        <MetricCard label="Active" value={trainers.filter(t => t.status === "active").length} changeType="positive" icon={<Users className="w-4 h-4" />} />
        <MetricCard label="Total Salary" value={formatCurrency(totalSalary)} icon={<DollarSign className="w-4 h-4" />} />
        <MetricCard label="Avg Salary" value={trainers.length ? formatCurrency(totalSalary / trainers.length) : "—"} icon={<UserPlus className="w-4 h-4" />} />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <DataTable
          columns={[
            { key: "trainer_code", header: "Code", className: "w-24" },
            { key: "full_name", header: "Trainer", render: (row: Trainer) => (
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">{row.full_name.split(" ").map((n) => n[0]).join("")}</div>
                <div><p className="text-foreground font-medium">{row.full_name}</p><p className="text-xs text-muted-foreground">{row.phone || "—"}</p></div>
              </div>
            )},
            { key: "specialization", header: "Specialization", render: (row: Trainer) => <span>{row.specialization || "—"}</span> },
            { key: "salary", header: "Salary", render: (row: Trainer) => <span>{row.salary ? formatCurrency(row.salary) : "—"}</span> },
            { key: "status", header: "Status", render: (row: Trainer) => <StatusDot status={row.status === "active" ? "operational" : "critical"} label={row.status} /> },
            { key: "actions", header: "", render: (row: Trainer) => (
              <div className="flex items-center gap-1">
                <button onClick={() => openEdit(row)} className="p-1.5 rounded hover:bg-surface-raised text-muted-foreground hover:text-foreground transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => setDeleteItem(row)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            )},
          ]}
          data={trainers}
        />
      )}

      <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); setOpen(v); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editItem ? "Edit Trainer" : "Add New Trainer"}</DialogTitle>
            <DialogDescription>{editItem ? `Editing ${editItem.trainer_code}` : nextCode ? `Code: ${nextCode} · Gym: ${gym?.name || ""}` : "Loading..."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div><label className="text-label mb-1 block">Full Name *</label><input className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Coach Raj" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-label mb-1 block">Phone</label><input className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="9876543210" /></div>
              <div><label className="text-label mb-1 block">Salary (₹)</label><input type="number" className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} placeholder="35000" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-label mb-1 block">Specialization</label><input className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} placeholder="Strength" /></div>
              {editItem && (<div><label className="text-label mb-1 block">Status</label><select className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="active">Active</option><option value="inactive">Inactive</option></select></div>)}
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => { setOpen(false); resetForm(); }} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2">{saving && <Loader2 className="w-4 h-4 animate-spin" />} {editItem ? "Save" : "Add Trainer"}</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteItem} onOpenChange={(v) => !v && setDeleteItem(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Trainer</DialogTitle><DialogDescription>Remove {deleteItem?.full_name}?</DialogDescription></DialogHeader>
          <DialogFooter>
            <button onClick={() => setDeleteItem(null)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
            <button onClick={handleDelete} disabled={saving} className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium hover:bg-destructive/90 transition-colors disabled:opacity-50 flex items-center gap-2">{saving && <Loader2 className="w-4 h-4 animate-spin" />} Delete</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Trainers;
