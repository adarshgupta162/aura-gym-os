import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Calendar, CreditCard, BarChart3, Pencil, Snowflake, RefreshCw, CalendarPlus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

const MemberProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [progress, setProgress] = useState<any[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ status: "", plan_id: "", trainer_id: "", due_date: "", weight: "" });
  const [activeTab, setActiveTab] = useState<"overview" | "attendance" | "payments" | "progress">("overview");
  const [extendOpen, setExtendOpen] = useState(false);
  const [extendForm, setExtendForm] = useState({ plan_id: "", start_date: new Date().toISOString().split("T")[0], discounted_price: "", payment_method: "cash" });

  useEffect(() => {
    if (!id) return;
    const fetchAll = async () => {
      const [memberRes, attRes, payRes, progRes, trainersRes, plansRes] = await Promise.all([
        supabase.from("members").select("*, plans(name, price, duration_days), trainers(full_name, specialization)").eq("id", id).single(),
        supabase.from("attendance").select("*").eq("member_id", id).order("check_in", { ascending: false }).limit(100),
        supabase.from("payments").select("*").eq("member_id", id).order("payment_date", { ascending: false }),
        supabase.from("progress_logs").select("*").eq("member_id", id).order("logged_at", { ascending: false }).limit(50),
        supabase.from("trainers").select("id, full_name"),
        supabase.from("plans").select("id, name, price, duration_days"),
      ]);
      setMember(memberRes.data);
      setAttendance(attRes.data || []);
      setPayments(payRes.data || []);
      setProgress(progRes.data || []);
      setTrainers(trainersRes.data || []);
      setPlans(plansRes.data || []);
      if (memberRes.data) {
        setForm({
          status: memberRes.data.status,
          plan_id: memberRes.data.plan_id || "",
          trainer_id: memberRes.data.trainer_id || "",
          due_date: memberRes.data.due_date || "",
          weight: memberRes.data.weight || "",
        });
      }
      setLoading(false);
    };
    fetchAll();
  }, [id]);

  const handleUpdate = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("members").update({
        status: form.status, plan_id: form.plan_id || null,
        trainer_id: form.trainer_id || null, due_date: form.due_date || null,
        weight: form.weight || null,
      }).eq("id", id);
      if (error) throw error;
      toast.success("Member updated");
      setEditOpen(false);
      // Refresh
      const { data } = await supabase.from("members").select("*, plans(name, price, duration_days), trainers(full_name, specialization)").eq("id", id).single();
      setMember(data);
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleFreeze = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await supabase.from("members").update({ status: "frozen" }).eq("id", id);
      toast.success("Member frozen");
      setMember({ ...member, status: "frozen" });
      setForm({ ...form, status: "frozen" });
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleRenew = async () => {
    if (!id || !member) return;
    setSaving(true);
    try {
      const plan = plans.find(p => p.id === member.plan_id);
      const days = plan?.duration_days || 30;
      const newDue = new Date();
      newDue.setDate(newDue.getDate() + days);
      await supabase.from("members").update({ status: "active", due_date: newDue.toISOString().split("T")[0] }).eq("id", id);
      toast.success("Membership renewed");
      setMember({ ...member, status: "active", due_date: newDue.toISOString().split("T")[0] });
      setForm({ ...form, status: "active", due_date: newDue.toISOString().split("T")[0] });
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const calcExtendedDue = (startDateStr: string, durationDays: number): string => {
    const [year, month, day] = startDateStr.split("-").map(Number);
    const d = new Date(year, month - 1, day + durationDays);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const handleExtend = async () => {
    if (!id || !member) return;
    const selectedPlan = plans.find(p => p.id === extendForm.plan_id);
    if (!selectedPlan) { toast.error("Please select a plan"); return; }
    const discounted = parseFloat(extendForm.discounted_price);
    if (isNaN(discounted) || discounted < 0) { toast.error("Enter a valid discounted price"); return; }
    setSaving(true);
    try {
      const newDue = calcExtendedDue(extendForm.start_date, selectedPlan.duration_days);
      const newStatus = member.status === "frozen" ? "active" : member.status;
      const { error: updateError } = await supabase.from("members").update({
        plan_id: selectedPlan.id,
        due_date: newDue,
        status: newStatus,
      }).eq("id", id);
      if (updateError) throw updateError;
      const { error: payError } = await supabase.from("payments").insert({
        gym_id: member.gym_id,
        member_id: id,
        amount: discounted,
        method: extendForm.payment_method,
        status: "completed",
        description: `Subscription extended – ${selectedPlan.name} (${selectedPlan.duration_days} days)`,
      });
      if (payError) throw payError;
      toast.success("Subscription extended successfully");
      setExtendOpen(false);
      // Refresh member & payments
      const [memberRes, payRes] = await Promise.all([
        supabase.from("members").select("*, plans(name, price, duration_days), trainers(full_name, specialization)").eq("id", id).single(),
        supabase.from("payments").select("*").eq("member_id", id).order("payment_date", { ascending: false }),
      ]);
      if (memberRes.data) {
        setMember(memberRes.data);
        setForm({ status: memberRes.data.status, plan_id: memberRes.data.plan_id || "", trainer_id: memberRes.data.trainer_id || "", due_date: memberRes.data.due_date || "", weight: memberRes.data.weight || "" });
      }
      setPayments(payRes.data || []);
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  if (!member) return <div className="text-center py-12 text-muted-foreground">Member not found</div>;

  const daysLeft = member.due_date ? Math.max(0, Math.ceil((new Date(member.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null;
  const statusColor = member.status === "active" ? "text-primary" : member.status === "frozen" ? "text-accent" : "text-destructive";
  const totalPaid = payments.filter(p => p.status === "completed").reduce((s: number, p: any) => s + Number(p.amount), 0);

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "attendance", label: `Attendance (${attendance.length})` },
    { key: "payments", label: `Payments (${payments.length})` },
    { key: "progress", label: "Progress" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/members")} className="p-2 rounded-lg hover:bg-surface-raised transition-colors">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
              {member.full_name.split(" ").map((n: string) => n[0]).join("")}
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">{member.full_name}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-mono">{member.member_code}</span>
                <span className={`capitalize font-medium ${statusColor}`}>{member.status}</span>
                {daysLeft !== null && <span>· {daysLeft} days left</span>}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {member.status !== "frozen" && (
            <button onClick={handleFreeze} disabled={saving} className="px-3 py-2 bg-accent/10 text-accent rounded-lg text-xs font-medium hover:bg-accent/20 flex items-center gap-1">
              <Snowflake className="w-3.5 h-3.5" /> Freeze
            </button>
          )}
          {(member.status === "frozen" || member.status === "expired") && (
            <button onClick={handleRenew} disabled={saving} className="px-3 py-2 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary/20 flex items-center gap-1">
              <RefreshCw className="w-3.5 h-3.5" /> Renew
            </button>
          )}
          <button
            onClick={() => {
              setExtendForm({ plan_id: member.plan_id || "", start_date: new Date().toISOString().split("T")[0], discounted_price: member.plans?.price?.toString() || "", payment_method: "cash" });
              setExtendOpen(true);
            }}
            className="px-3 py-2 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary/20 flex items-center gap-1"
          >
            <CalendarPlus className="w-3.5 h-3.5" /> Extend
          </button>
          <button onClick={() => setEditOpen(true)} className="px-3 py-2 bg-surface-raised rounded-lg text-xs font-medium text-foreground hover:bg-surface flex items-center gap-1">
            <Pencil className="w-3.5 h-3.5" /> Edit
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border overflow-x-auto">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key as any)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card rounded-xl p-5 shadow-surface space-y-3">
            <h3 className="text-sm font-medium text-foreground">Contact</h3>
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-label">Email</p><p className="text-sm text-foreground">{member.email || "—"}</p></div>
              <div><p className="text-label">Phone</p><p className="text-sm text-foreground">{member.phone || "—"}</p></div>
              <div><p className="text-label">Weight</p><p className="text-sm text-foreground">{member.weight || "—"}</p></div>
              <div><p className="text-label">Joined</p><p className="text-sm text-foreground">{new Date(member.joined_at).toLocaleDateString()}</p></div>
            </div>
          </div>
          <div className="bg-card rounded-xl p-5 shadow-surface space-y-3">
            <h3 className="text-sm font-medium text-foreground">Subscription</h3>
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-label">Plan</p><p className="text-sm text-foreground">{member.plans?.name || "No plan"}</p></div>
              <div><p className="text-label">Price</p><p className="text-sm text-foreground">{member.plans?.price ? `₹${member.plans.price.toLocaleString("en-IN")}` : "—"}</p></div>
              <div><p className="text-label">Due Date</p><p className="text-sm text-foreground">{member.due_date || "—"}</p></div>
              <div><p className="text-label">Trainer</p><p className="text-sm text-foreground">{member.trainers?.full_name || "None"}</p></div>
            </div>
          </div>
          <div className="bg-card rounded-xl p-5 shadow-surface">
            <h3 className="text-sm font-medium text-foreground mb-3">Stats</h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div><p className="text-2xl font-bold text-foreground">{attendance.length}</p><p className="text-xs text-muted-foreground">Visits</p></div>
              <div><p className="text-2xl font-bold text-foreground">₹{totalPaid.toLocaleString("en-IN")}</p><p className="text-xs text-muted-foreground">Paid</p></div>
              <div><p className="text-2xl font-bold text-foreground">{progress.filter(p => p.log_type === "weight").length}</p><p className="text-xs text-muted-foreground">Logs</p></div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "attendance" && (
        <div className="bg-card rounded-xl p-5 shadow-surface">
          {attendance.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No attendance records</p>
          ) : (
            <div className="space-y-2">
              {attendance.map(a => (
                <div key={a.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-surface-raised">
                  <div>
                    <p className="text-sm text-foreground">{a.date}</p>
                    <p className="text-xs text-muted-foreground">{new Date(a.check_in).toLocaleTimeString()} → {a.check_out ? new Date(a.check_out).toLocaleTimeString() : "In-Gym"}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${a.method === "qr" ? "bg-primary/10 text-primary" : a.method === "daily_code" ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"}`}>{a.method}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "payments" && (
        <div className="bg-card rounded-xl p-5 shadow-surface">
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No payments</p>
          ) : (
            <div className="space-y-2">
              {payments.map(p => (
                <div key={p.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-surface-raised">
                  <div>
                    <p className="text-sm text-foreground">₹{Number(p.amount).toLocaleString("en-IN")}</p>
                    <p className="text-xs text-muted-foreground">{p.description || "Payment"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{new Date(p.payment_date).toLocaleDateString()}</p>
                    <span className={`text-xs font-medium ${p.status === "completed" ? "text-primary" : "text-destructive"}`}>{p.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "progress" && (
        <div className="bg-card rounded-xl p-5 shadow-surface">
          {progress.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No progress logs</p>
          ) : (
            <div className="space-y-2">
              {progress.map(p => (
                <div key={p.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-surface-raised">
                  <div>
                    <p className="text-sm text-foreground capitalize">{p.log_type}: {p.value} {p.unit}</p>
                    {p.notes && <p className="text-xs text-muted-foreground">{p.notes}</p>}
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(p.logged_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Extend Subscription Dialog */}
      <Dialog open={extendOpen} onOpenChange={setExtendOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Extend Subscription</DialogTitle>
            <DialogDescription>Choose a plan and start date to extend {member.full_name}'s membership.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-label mb-1 block">Plan</label>
              <select
                className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground"
                value={extendForm.plan_id}
                onChange={(e) => {
                  const p = plans.find(pl => pl.id === e.target.value);
                  setExtendForm({ ...extendForm, plan_id: e.target.value, discounted_price: p ? p.price.toString() : extendForm.discounted_price });
                }}
              >
                <option value="">Select a plan</option>
                {plans.map(p => (
                  <option key={p.id} value={p.id}>{p.name} – {p.duration_days} days</option>
                ))}
              </select>
            </div>
            {extendForm.plan_id && (() => {
              const selectedPlan = plans.find(p => p.id === extendForm.plan_id);
              return selectedPlan ? (
                <div className="bg-surface-raised rounded-lg px-4 py-3 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plan Price</span>
                    <span className="font-semibold text-foreground">₹{selectedPlan.price.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Duration</span>
                    <span>{selectedPlan.duration_days} days</span>
                  </div>
                </div>
              ) : null;
            })()}
            <div>
              <label className="text-label mb-1 block">Start Date</label>
              <input
                type="date"
                className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground"
                value={extendForm.start_date}
                onChange={(e) => setExtendForm({ ...extendForm, start_date: e.target.value })}
              />
            </div>
            <div>
              <label className="text-label mb-1 block">Amount Collected (Discounted Price ₹)</label>
              <input
                type="number"
                min="0"
                className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground"
                placeholder="Enter actual collected amount"
                value={extendForm.discounted_price}
                onChange={(e) => setExtendForm({ ...extendForm, discounted_price: e.target.value })}
              />
              {extendForm.plan_id && (() => {
                const selectedPlan = plans.find(p => p.id === extendForm.plan_id);
                const disc = parseFloat(extendForm.discounted_price);
                if (selectedPlan && !isNaN(disc) && disc < selectedPlan.price) {
                  return (
                    <p className="text-xs text-accent mt-1">
                      Discount: ₹{(selectedPlan.price - disc).toLocaleString("en-IN")} off
                    </p>
                  );
                }
                return null;
              })()}
            </div>
            <div>
              <label className="text-label mb-2 block">Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                {["cash", "upi", "card"].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setExtendForm({ ...extendForm, payment_method: m })}
                    className={`py-2.5 rounded-lg text-sm font-medium transition-colors border ${
                      extendForm.payment_method === m
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-surface text-muted-foreground border-border hover:border-accent"
                    }`}
                  >
                    {m.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            {extendForm.plan_id && extendForm.start_date && (() => {
              const selectedPlan = plans.find(p => p.id === extendForm.plan_id);
              if (!selectedPlan) return null;
              const newDue = calcExtendedDue(extendForm.start_date, selectedPlan.duration_days);
              const [y, mo, d] = newDue.split("-").map(Number);
              const displayDate = new Date(y, mo - 1, d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
              return (
                <p className="text-xs text-muted-foreground text-center">
                  New expiry: <span className="font-medium text-foreground">{displayDate}</span>
                </p>
              );
            })()}
          </div>
          <DialogFooter>
            <button onClick={() => setExtendOpen(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
            <button
              onClick={handleExtend}
              disabled={saving || !extendForm.plan_id}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Extend & Pay
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit {member.full_name}</DialogTitle>
            <DialogDescription>{member.member_code}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-label mb-1 block">Status</label>
                <select className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="active">Active</option><option value="frozen">Frozen</option><option value="expired">Expired</option><option value="inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="text-label mb-1 block">Weight</label>
                <input className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-label mb-1 block">Plan</label>
                <select className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={form.plan_id} onChange={(e) => setForm({ ...form, plan_id: e.target.value })}>
                  <option value="">No plan</option>
                  {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-label mb-1 block">Trainer</label>
                <select className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={form.trainer_id} onChange={(e) => setForm({ ...form, trainer_id: e.target.value })}>
                  <option value="">None</option>
                  {trainers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-label mb-1 block">Due Date</label>
              <input type="date" className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setEditOpen(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
            <button onClick={handleUpdate} disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MemberProfile;
