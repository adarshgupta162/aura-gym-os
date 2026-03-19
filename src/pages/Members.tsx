import { useEffect, useState } from "react";
import { DataTable } from "@/components/DataTable";
import { MetricCard } from "@/components/MetricCard";
import { StatusDot } from "@/components/StatusDot";
import { AddMemberModal } from "@/components/AddMemberModal";
import { Users, UserPlus, UserMinus, Search, Plus, Loader2, Pencil, Trash2, CheckCircle, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

interface Member {
  id: string; member_code: string; full_name: string; phone: string | null;
  email: string | null; status: string; weight: string | null; due_date: string | null;
  gym_id: string; plan_id: string | null; trainer_id: string | null; created_at: string;
}

interface TrainerInfo { id: string; full_name: string; }
interface PlanInfo { id: string; name: string; price: number; duration_days: number; }

const Members = () => {
  const { gym } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [trainers, setTrainers] = useState<TrainerInfo[]>([]);
  const [plans, setPlans] = useState<PlanInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  // Add modal (multi-step)
  const [addOpen, setAddOpen] = useState(false);
  const [nextCode, setNextCode] = useState("");
  // Edit modal (simple)
  const [editItem, setEditItem] = useState<Member | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: "", phone: "", email: "", weight: "",
    plan_id: "", trainer_id: "", due_date: "", status: "active",
  });
  const [deleteItem, setDeleteItem] = useState<Member | null>(null);
  const [saving, setSaving] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [pendingMember, setPendingMember] = useState<{ name: string; planId: string } | null>(null);
  const [credentialsModal, setCredentialsModal] = useState<{ code: string; email: string; password: string } | null>(null);

  const fetchData = async () => {
    const [membersRes, trainersRes, plansRes] = await Promise.all([
      supabase.from("members").select("*").order("created_at", { ascending: false }),
      supabase.from("trainers").select("id, full_name"),
      supabase.from("plans").select("id, name, price, duration_days"),
    ]);
    if (membersRes.data) setMembers(membersRes.data);
    if (trainersRes.data) setTrainers(trainersRes.data);
    if (plansRes.data) setPlans(plansRes.data as PlanInfo[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const generateMemberCode = async () => {
    if (!gym) return "";
    const { count } = await supabase.from("members").select("*", { count: "exact", head: true }).eq("gym_id", gym.id);
    return `${gym.code}M${String((count || 0) + 1).padStart(4, "0")}`;
  };

  const resetEditForm = () => {
    setEditForm({ full_name: "", phone: "", email: "", weight: "", plan_id: "", trainer_id: "", due_date: "", status: "active" });
    setEditItem(null);
  };

  const openAdd = async () => {
    const code = await generateMemberCode();
    setNextCode(code);
    setAddOpen(true);
  };

  const openEdit = (m: Member) => {
    setEditItem(m);
    setEditForm({
      full_name: m.full_name, phone: m.phone || "", email: m.email || "",
      weight: m.weight || "", plan_id: m.plan_id || "",
      trainer_id: m.trainer_id || "", due_date: m.due_date || "", status: m.status,
    });
    setEditOpen(true);
  };

  const handleAddSuccess = (credentials: { code: string; email: string; password: string }, planId: string, memberName: string) => {
    setCredentialsModal(credentials);
    // Store pending payment info; payment modal opens after credentials modal is dismissed
    const selectedPlan = plans.find((p) => p.id === planId);
    if (selectedPlan) {
      setPendingMember({ name: memberName, planId: selectedPlan.id });
    }
    fetchData();
  };

  const handleEditSave = async () => {
    if (!editItem || !editForm.full_name) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from("members").update({
        full_name: editForm.full_name, phone: editForm.phone || null, email: editForm.email || null,
        weight: editForm.weight || null, plan_id: editForm.plan_id || null,
        trainer_id: editForm.trainer_id || null, due_date: editForm.due_date || null, status: editForm.status,
      }).eq("id", editItem.id);
      if (error) throw error;
      toast.success("Member updated");
      setEditOpen(false);
      resetEditForm();
      fetchData();
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally { setSaving(false); }
  };

  const handleRecordPayment = async () => {
    if (!pendingMember || !gym) return;
    setSaving(true);
    try {
      const plan = plans.find(p => p.id === pendingMember.planId);
      if (!plan) throw new Error("Plan not found");
      const { data: member } = await supabase.from("members").select("id").eq("full_name", pendingMember.name).eq("gym_id", gym.id).order("created_at", { ascending: false }).limit(1).single();
      const { error } = await supabase.from("payments").insert({
        gym_id: gym.id, member_id: member?.id || null,
        amount: plan.price, method: paymentMethod,
        description: `${plan.name} subscription - ${pendingMember.name}`, status: "completed",
      });
      if (error) throw error;
      toast.success(`Payment of ₹${plan.price.toLocaleString("en-IN")} recorded`);
    } catch (err: unknown) { toast.error((err as Error).message); }
    finally { setPaymentOpen(false); setPendingMember(null); setPaymentMethod("cash"); setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("members").delete().eq("id", deleteItem.id);
      if (error) throw error;
      toast.success(`${deleteItem.full_name} removed`);
      setDeleteItem(null);
      fetchData();
    } catch (err: unknown) { toast.error((err as Error).message); } finally { setSaving(false); }
  };

  const copyText = (text: string) => { navigator.clipboard.writeText(text); toast.success("Copied!"); };

  const filtered = members.filter((m) =>
    m.full_name.toLowerCase().includes(search.toLowerCase()) || m.member_code.toLowerCase().includes(search.toLowerCase())
  );
  const activeCount = members.filter((m) => m.status === "active").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Members</h1>
          <p className="text-sm text-muted-foreground">{members.length} total members</p>
        </div>
        <button onClick={openAdd} className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Member
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Members" value={members.length} icon={<Users className="w-4 h-4" />} />
        <MetricCard label="Active" value={activeCount} changeType="positive" icon={<UserPlus className="w-4 h-4" />} />
        <MetricCard label="Expiring" value={members.filter(m => m.status === "expiring").length} changeType="negative" icon={<UserMinus className="w-4 h-4" />} />
        <MetricCard label="Overdue" value={members.filter(m => m.status === "overdue").length} changeType="negative" />
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input type="text" placeholder="Search members..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-surface rounded-lg pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground shadow-surface focus:outline-none focus:ring-1 focus:ring-accent" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <DataTable
          columns={[
            { key: "member_code", header: "ID", className: "w-24" },
            { key: "full_name", header: "Member", render: (row: Member) => (
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-surface-raised flex items-center justify-center text-xs font-medium text-muted-foreground">
                  {row.full_name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div><p className="text-foreground font-medium">{row.full_name}</p><p className="text-xs text-muted-foreground">{row.phone || "—"}</p></div>
              </div>
            )},
            { key: "email", header: "Email", render: (row: Member) => <span className="text-sm">{row.email || "—"}</span> },
            { key: "status", header: "Status", render: (row: Member) => <StatusDot status={row.status === "active" ? "operational" : row.status === "expiring" ? "warning" : "critical"} label={row.status} /> },
            { key: "due_date", header: "Due Date", render: (row: Member) => <span>{row.due_date || "—"}</span> },
            { key: "actions", header: "", render: (row: Member) => (
              <div className="flex items-center gap-1">
                <button onClick={() => openEdit(row)} className="p-1.5 rounded hover:bg-surface-raised text-muted-foreground hover:text-foreground transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => setDeleteItem(row)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            )},
          ]}
          data={filtered}
        />
      )}

      {/* Add Member - Multi-step Modal */}
      <AddMemberModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSuccess={handleAddSuccess}
        trainers={trainers}
        plans={plans}
        gym={gym}
        nextCode={nextCode}
      />

      {/* Edit Member Modal */}
      <Dialog open={editOpen} onOpenChange={(v) => { if (!v) { setEditOpen(false); resetEditForm(); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Member</DialogTitle>
            <DialogDescription>{editItem ? `Editing ${editItem.member_code}` : ""}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-label mb-1 block">Full Name *</label><input className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} placeholder="Arjun Patel" /></div>
              <div><label className="text-label mb-1 block">Phone</label><input className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} placeholder="9876543210" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-label mb-1 block">Email</label><input type="email" className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} placeholder="arjun@email.com" /></div>
              <div><label className="text-label mb-1 block">Weight (kg)</label><input className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={editForm.weight} onChange={(e) => setEditForm({ ...editForm, weight: e.target.value })} placeholder="78" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-label mb-1 block">Plan</label>
                <select className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={editForm.plan_id} onChange={(e) => setEditForm({ ...editForm, plan_id: e.target.value })}>
                  <option value="">No plan</option>
                  {plans.map((p) => <option key={p.id} value={p.id}>{p.name} (₹{p.price})</option>)}
                </select>
              </div>
              <div><label className="text-label mb-1 block">Trainer</label>
                <select className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={editForm.trainer_id} onChange={(e) => setEditForm({ ...editForm, trainer_id: e.target.value })}>
                  <option value="">No trainer</option>
                  {trainers.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-label mb-1 block">Due Date</label><input type="date" className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={editForm.due_date} onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })} /></div>
              <div><label className="text-label mb-1 block">Status</label>
                <select className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                  <option value="active">Active</option><option value="expiring">Expiring</option><option value="overdue">Overdue</option><option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => { setEditOpen(false); resetEditForm(); }} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
            <button onClick={handleEditSave} disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save Changes
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Credentials Modal */}
      <Dialog open={!!credentialsModal} onOpenChange={() => setCredentialsModal(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-primary" /> Member Created!</DialogTitle>
            <DialogDescription>Share these credentials with the member.</DialogDescription>
          </DialogHeader>
          {credentialsModal && (
            <div className="space-y-3 py-2">
              <div className="bg-surface rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div><p className="text-label">Member Code</p><p className="text-sm text-foreground font-mono font-semibold">{credentialsModal.code}</p></div>
                  <button onClick={() => copyText(credentialsModal.code)} className="p-1 hover:bg-surface-raised rounded"><Copy className="w-3.5 h-3.5 text-muted-foreground" /></button>
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
              <p className="text-xs text-muted-foreground text-center">⚠️ Share these credentials with the member for login access.</p>
            </div>
          )}
          <DialogFooter>
            <button onClick={() => { setCredentialsModal(null); if (pendingMember) setPaymentOpen(true); }} className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">Done</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>{pendingMember && `Record payment for ${pendingMember.name}`}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="text-center">
              <p className="text-2xl font-semibold text-foreground">₹{plans.find(p => p.id === pendingMember?.planId)?.price.toLocaleString("en-IN") || 0}</p>
              <p className="text-sm text-muted-foreground mt-1">{plans.find(p => p.id === pendingMember?.planId)?.name}</p>
            </div>
            <div>
              <label className="text-label mb-2 block">Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                {["cash", "upi", "card"].map((m) => (
                  <button key={m} onClick={() => setPaymentMethod(m)}
                    className={`py-2.5 rounded-lg text-sm font-medium transition-colors border ${paymentMethod === m ? "bg-primary text-primary-foreground border-primary" : "bg-surface text-muted-foreground border-border hover:border-accent"}`}>
                    {m.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => { setPaymentOpen(false); setPendingMember(null); }} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">Skip</button>
            <button onClick={handleRecordPayment} disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Record Payment
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteItem} onOpenChange={(v) => !v && setDeleteItem(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Member</DialogTitle>
            <DialogDescription>Remove {deleteItem?.full_name}? This cannot be undone.</DialogDescription>
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

export default Members;
