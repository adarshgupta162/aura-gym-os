import { useEffect, useState } from "react";
import { DataTable } from "@/components/DataTable";
import { MetricCard } from "@/components/MetricCard";
import { StatusDot } from "@/components/StatusDot";
import { Users, UserPlus, DollarSign, Plus, Dumbbell, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

interface Trainer {
  id: string;
  trainer_code: string;
  full_name: string;
  phone: string | null;
  specialization: string | null;
  salary: number | null;
  status: string;
  gym_id: string;
  created_at: string;
}

interface GymInfo { id: string; code: string; name: string; }

const Trainers = () => {
  const { isSuperAdmin } = useAuth();
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [gyms, setGyms] = useState<GymInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [nextCode, setNextCode] = useState("");
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    specialization: "",
    salary: "",
    gym_id: "",
  });

  const fetchData = async () => {
    const [trainersRes, gymsRes] = await Promise.all([
      supabase.from("trainers").select("*").order("created_at", { ascending: false }),
      supabase.from("gyms").select("id, code, name"),
    ]);
    if (trainersRes.data) setTrainers(trainersRes.data);
    if (gymsRes.data) setGyms(gymsRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const generateTrainerCode = async (gymId: string) => {
    const gym = gyms.find((g) => g.id === gymId);
    if (!gym) return "";
    const { count } = await supabase.from("trainers").select("*", { count: "exact", head: true }).eq("gym_id", gymId);
    const num = (count || 0) + 1;
    return `${gym.code}T${String(num).padStart(4, "0")}`;
  };

  const handleGymChange = async (gymId: string) => {
    setForm({ ...form, gym_id: gymId });
    const code = await generateTrainerCode(gymId);
    setNextCode(code);
  };

  const handleCreate = async () => {
    if (!form.full_name || !form.gym_id) {
      toast.error("Name and gym are required");
      return;
    }
    setSaving(true);
    try {
      const code = nextCode || await generateTrainerCode(form.gym_id);
      const { error } = await supabase.from("trainers").insert({
        trainer_code: code,
        full_name: form.full_name,
        phone: form.phone || null,
        specialization: form.specialization || null,
        salary: form.salary ? parseFloat(form.salary) : null,
        gym_id: form.gym_id,
      });
      if (error) throw error;
      toast.success(`Trainer ${code} created`);
      setOpen(false);
      setForm({ full_name: "", phone: "", specialization: "", salary: "", gym_id: "" });
      setNextCode("");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to create trainer");
    } finally {
      setSaving(false);
    }
  };

  const activeTrainers = trainers.filter((t) => t.status === "active").length;
  const totalSalary = trainers.reduce((sum, t) => sum + (t.salary || 0), 0);

  const formatCurrency = (n: number) => {
    if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
    if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
    return `₹${n}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Trainers</h1>
          <p className="text-sm text-muted-foreground">{trainers.length} trainers registered</p>
        </div>
        <button onClick={() => setOpen(true)} className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Trainer
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Trainers" value={trainers.length} icon={<Dumbbell className="w-4 h-4" />} />
        <MetricCard label="Active" value={activeTrainers} changeType="positive" icon={<Users className="w-4 h-4" />} />
        <MetricCard label="Total Salary" value={formatCurrency(totalSalary)} icon={<DollarSign className="w-4 h-4" />} />
        <MetricCard label="Avg Salary" value={trainers.length ? formatCurrency(totalSalary / trainers.length) : "—"} icon={<UserPlus className="w-4 h-4" />} />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <DataTable
          columns={[
            { key: "trainer_code", header: "Code", className: "w-24" },
            {
              key: "full_name",
              header: "Trainer",
              render: (row: Trainer) => (
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                    {row.full_name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <p className="text-foreground font-medium">{row.full_name}</p>
                    <p className="text-xs text-muted-foreground">{row.phone || "—"}</p>
                  </div>
                </div>
              ),
            },
            { key: "specialization", header: "Specialization", render: (row: Trainer) => <span>{row.specialization || "—"}</span> },
            { key: "salary", header: "Salary", render: (row: Trainer) => <span>{row.salary ? formatCurrency(row.salary) : "—"}</span> },
            {
              key: "status",
              header: "Status",
              render: (row: Trainer) => (
                <StatusDot status={row.status === "active" ? "operational" : "critical"} label={row.status} />
              ),
            },
            {
              key: "actions",
              header: "",
              render: () => <button className="text-xs text-accent hover:underline">Manage →</button>,
            },
          ]}
          data={trainers}
        />
      )}

      {/* Add Trainer Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Trainer</DialogTitle>
            <DialogDescription>
              {nextCode ? `Code: ${nextCode}` : "Select a gym to generate trainer code"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-label mb-1 block">Gym *</label>
              <select className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={form.gym_id} onChange={(e) => handleGymChange(e.target.value)}>
                <option value="">Select gym</option>
                {gyms.map((g) => <option key={g.id} value={g.id}>{g.name} ({g.code})</option>)}
              </select>
            </div>
            <div>
              <label className="text-label mb-1 block">Full Name *</label>
              <input className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Coach Raj" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-label mb-1 block">Phone</label>
                <input className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="9876543210" />
              </div>
              <div>
                <label className="text-label mb-1 block">Salary (₹)</label>
                <input type="number" className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} placeholder="35000" />
              </div>
            </div>
            <div>
              <label className="text-label mb-1 block">Specialization</label>
              <input className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} placeholder="Strength & Conditioning" />
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
            <button onClick={handleCreate} disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Add Trainer
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Trainers;
