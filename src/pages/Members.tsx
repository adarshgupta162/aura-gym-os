import { useEffect, useState } from "react";
import { DataTable } from "@/components/DataTable";
import { MetricCard } from "@/components/MetricCard";
import { StatusDot } from "@/components/StatusDot";
import { Users, UserPlus, UserMinus, Search, Filter, Plus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

interface Member {
  id: string;
  member_code: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  status: string;
  weight: string | null;
  due_date: string | null;
  gym_id: string;
  plan_id: string | null;
  trainer_id: string | null;
  created_at: string;
}

interface GymInfo { id: string; code: string; name: string; }
interface TrainerInfo { id: string; full_name: string; }
interface PlanInfo { id: string; name: string; }

const Members = () => {
  const { isSuperAdmin } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [gyms, setGyms] = useState<GymInfo[]>([]);
  const [trainers, setTrainers] = useState<TrainerInfo[]>([]);
  const [plans, setPlans] = useState<PlanInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [nextCode, setNextCode] = useState("");
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    weight: "",
    gym_id: "",
    plan_id: "",
    trainer_id: "",
    due_date: "",
  });

  const fetchData = async () => {
    const [membersRes, gymsRes, trainersRes, plansRes] = await Promise.all([
      supabase.from("members").select("*").order("created_at", { ascending: false }),
      supabase.from("gyms").select("id, code, name"),
      supabase.from("trainers").select("id, full_name"),
      supabase.from("plans").select("id, name"),
    ]);
    if (membersRes.data) setMembers(membersRes.data);
    if (gymsRes.data) setGyms(gymsRes.data);
    if (trainersRes.data) setTrainers(trainersRes.data);
    if (plansRes.data) setPlans(plansRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const generateMemberCode = async (gymId: string) => {
    const gym = gyms.find((g) => g.id === gymId);
    if (!gym) return "";
    const { count } = await supabase.from("members").select("*", { count: "exact", head: true }).eq("gym_id", gymId);
    const num = (count || 0) + 1;
    return `${gym.code}M${String(num).padStart(4, "0")}`;
  };

  const handleGymChange = async (gymId: string) => {
    setForm({ ...form, gym_id: gymId });
    const code = await generateMemberCode(gymId);
    setNextCode(code);
  };

  const handleCreate = async () => {
    if (!form.full_name || !form.gym_id) {
      toast.error("Name and gym are required");
      return;
    }
    setSaving(true);
    try {
      const code = nextCode || await generateMemberCode(form.gym_id);
      const { error } = await supabase.from("members").insert({
        member_code: code,
        full_name: form.full_name,
        phone: form.phone || null,
        email: form.email || null,
        weight: form.weight || null,
        gym_id: form.gym_id,
        plan_id: form.plan_id || null,
        trainer_id: form.trainer_id || null,
        due_date: form.due_date || null,
      });
      if (error) throw error;
      toast.success(`Member ${code} created`);
      setOpen(false);
      setForm({ full_name: "", phone: "", email: "", weight: "", gym_id: "", plan_id: "", trainer_id: "", due_date: "" });
      setNextCode("");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to create member");
    } finally {
      setSaving(false);
    }
  };

  const filtered = members.filter((m) =>
    m.full_name.toLowerCase().includes(search.toLowerCase()) || m.member_code.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = members.filter((m) => m.status === "active").length;
  const expiringCount = members.filter((m) => m.status === "expiring").length;
  const overdueCount = members.filter((m) => m.status === "overdue").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Members</h1>
          <p className="text-sm text-muted-foreground">{members.length} total members</p>
        </div>
        <button onClick={() => setOpen(true)} className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Member
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Members" value={members.length} icon={<Users className="w-4 h-4" />} />
        <MetricCard label="Active" value={activeCount} changeType="positive" icon={<UserPlus className="w-4 h-4" />} />
        <MetricCard label="Expiring Soon" value={expiringCount} changeType="negative" icon={<UserMinus className="w-4 h-4" />} />
        <MetricCard label="Overdue" value={overdueCount} changeType="negative" />
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface rounded-lg pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground shadow-surface focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <DataTable
          columns={[
            { key: "member_code", header: "ID", className: "w-24" },
            {
              key: "full_name",
              header: "Member",
              render: (row: Member) => (
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-surface-raised flex items-center justify-center text-xs font-medium text-muted-foreground">
                    {row.full_name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <p className="text-foreground font-medium">{row.full_name}</p>
                    <p className="text-xs text-muted-foreground">{row.phone || "—"}</p>
                  </div>
                </div>
              ),
            },
            { key: "weight", header: "Weight", render: (row: Member) => <span>{row.weight || "—"}</span> },
            {
              key: "status",
              header: "Status",
              render: (row: Member) => (
                <StatusDot
                  status={row.status === "active" ? "operational" : row.status === "expiring" ? "warning" : "critical"}
                  label={row.status}
                />
              ),
            },
            { key: "due_date", header: "Due Date", render: (row: Member) => <span>{row.due_date || "—"}</span> },
          ]}
          data={filtered}
        />
      )}

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Showing {filtered.length} of {members.length} members</span>
      </div>

      {/* Add Member Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Member</DialogTitle>
            <DialogDescription>
              {nextCode ? `Code: ${nextCode}` : "Select a gym to generate member code"}
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-label mb-1 block">Full Name *</label>
                <input className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Arjun Patel" />
              </div>
              <div>
                <label className="text-label mb-1 block">Phone</label>
                <input className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="9876543210" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-label mb-1 block">Email</label>
                <input className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="text-label mb-1 block">Weight</label>
                <input className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} placeholder="78kg" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-label mb-1 block">Plan</label>
                <select className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={form.plan_id} onChange={(e) => setForm({ ...form, plan_id: e.target.value })}>
                  <option value="">No plan</option>
                  {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-label mb-1 block">Trainer</label>
                <select className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={form.trainer_id} onChange={(e) => setForm({ ...form, trainer_id: e.target.value })}>
                  <option value="">No trainer</option>
                  {trainers.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-label mb-1 block">Due Date</label>
              <input type="date" className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
            <button onClick={handleCreate} disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Add Member
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Members;
