import { useEffect, useState } from "react";
import { DataTable } from "@/components/DataTable";
import { MetricCard } from "@/components/MetricCard";
import { StatusDot } from "@/components/StatusDot";
import { Dumbbell, AlertTriangle, Wrench, Plus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

interface EquipmentItem {
  id: string;
  name: string;
  category: string | null;
  purchase_date: string | null;
  warranty_until: string | null;
  last_maintenance: string | null;
  next_maintenance: string | null;
  cost: number | null;
  status: string;
  notes: string | null;
  gym_id: string;
}

const Equipment = () => {
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", category: "", cost: "", purchase_date: "", warranty_until: "", notes: "" });

  const fetchData = async () => {
    const { data } = await supabase.from("equipment").select("*").order("created_at", { ascending: false });
    setEquipment(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async () => {
    if (!form.name) { toast.error("Equipment name is required"); return; }
    setSaving(true);
    try {
      // Get user's gym_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data: gymId } = await supabase.rpc("get_user_gym_id", { _user_id: user.id });
      if (!gymId) throw new Error("No gym assigned");

      const { error } = await supabase.from("equipment").insert({
        name: form.name,
        category: form.category || null,
        cost: form.cost ? parseFloat(form.cost) : null,
        purchase_date: form.purchase_date || null,
        warranty_until: form.warranty_until || null,
        notes: form.notes || null,
        gym_id: gymId,
      });
      if (error) throw error;
      toast.success(`Equipment "${form.name}" added`);
      setOpen(false);
      setForm({ name: "", category: "", cost: "", purchase_date: "", warranty_until: "", notes: "" });
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to add equipment");
    } finally {
      setSaving(false);
    }
  };

  const operational = equipment.filter(e => e.status === "operational").length;
  const warning = equipment.filter(e => ["warning", "maintenance_due"].includes(e.status)).length;
  const critical = equipment.filter(e => e.status === "critical").length;

  const formatCost = (c: number | null) => c ? `₹${c.toLocaleString("en-IN")}` : "—";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Equipment</h1>
          <p className="text-sm text-muted-foreground">{equipment.length} items tracked</p>
        </div>
        <button onClick={() => setOpen(true)} className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Equipment
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Equipment" value={equipment.length} icon={<Dumbbell className="w-4 h-4" />} />
        <MetricCard label="Operational" value={operational} />
        <MetricCard label="Service Due" value={warning} changeType="negative" icon={<Wrench className="w-4 h-4" />} />
        <MetricCard label="Out of Order" value={critical} changeType="negative" icon={<AlertTriangle className="w-4 h-4" />} />
      </div>

      {/* Status Grid */}
      <div className="bg-card rounded-xl p-5 shadow-surface">
        <h2 className="text-sm font-medium text-foreground mb-4">Status Grid</h2>
        <div className="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-10 gap-3">
          {equipment.map((eq) => (
            <div key={eq.id} className="group relative flex flex-col items-center gap-1.5 p-3 rounded-lg bg-surface hover:bg-surface-raised transition-colors cursor-pointer" title={`${eq.name} — ${eq.status}`}>
              <StatusDot status={eq.status === "operational" ? "operational" : eq.status === "critical" ? "critical" : "warning"} />
              <span className="text-[10px] text-muted-foreground text-center leading-tight">{eq.name.split(" ").slice(0, 2).join(" ")}</span>
            </div>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <DataTable
          columns={[
            { key: "name", header: "Equipment" },
            { key: "category", header: "Category", render: (r: EquipmentItem) => <span>{r.category || "—"}</span> },
            { key: "purchase_date", header: "Purchased", render: (r: EquipmentItem) => <span>{r.purchase_date || "—"}</span> },
            { key: "warranty_until", header: "Warranty Until", render: (r: EquipmentItem) => <span>{r.warranty_until || "—"}</span> },
            { key: "last_maintenance", header: "Last Service", render: (r: EquipmentItem) => <span>{r.last_maintenance || "—"}</span> },
            { key: "cost", header: "Cost", render: (r: EquipmentItem) => <span>{formatCost(r.cost)}</span> },
            { key: "status", header: "Status", render: (r: EquipmentItem) => <StatusDot status={r.status === "operational" ? "operational" : r.status === "critical" ? "critical" : "warning"} label={r.status} /> },
          ]}
          data={equipment}
        />
      )}

      {/* Add Equipment Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Equipment</DialogTitle>
            <DialogDescription>Add a new equipment item to your gym inventory.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-label mb-1 block">Name *</label>
              <input className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Treadmill #1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-label mb-1 block">Category</label>
                <select className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  <option value="">Select</option>
                  <option value="Cardio">Cardio</option>
                  <option value="Strength">Strength</option>
                  <option value="Free Weights">Free Weights</option>
                  <option value="Accessories">Accessories</option>
                </select>
              </div>
              <div>
                <label className="text-label mb-1 block">Cost (₹)</label>
                <input type="number" className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} placeholder="85000" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-label mb-1 block">Purchase Date</label>
                <input type="date" className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={form.purchase_date} onChange={(e) => setForm({ ...form, purchase_date: e.target.value })} />
              </div>
              <div>
                <label className="text-label mb-1 block">Warranty Until</label>
                <input type="date" className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={form.warranty_until} onChange={(e) => setForm({ ...form, warranty_until: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-label mb-1 block">Notes</label>
              <textarea className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any additional notes..." />
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
            <button onClick={handleCreate} disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Add Equipment
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Equipment;
