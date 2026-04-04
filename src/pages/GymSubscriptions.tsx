import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CreditCard, Building2, Pencil } from "lucide-react";
import { DataTable } from "@/components/DataTable";
import { MetricCard } from "@/components/MetricCard";
import { StatusDot } from "@/components/StatusDot";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

const tiers = [
  { value: "free", label: "Free", maxMembers: 50, price: 0 },
  { value: "basic", label: "Basic", maxMembers: 200, price: 999 },
  { value: "pro", label: "Pro", maxMembers: 1000, price: 2499 },
  { value: "enterprise", label: "Enterprise", maxMembers: 99999, price: 4999 },
];

const GymSubscriptions = () => {
  const [subs, setSubs] = useState<any[]>([]);
  const [gyms, setGyms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editSub, setEditSub] = useState<any>(null);
  const [editForm, setEditForm] = useState({ plan_tier: "free", status: "active" });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    const [subsRes, gymsRes] = await Promise.all([
      supabase.from("gym_subscriptions").select("*, gyms(name, code, is_active)"),
      supabase.from("gyms").select("id, name, code"),
    ]);
    setSubs(subsRes.data || []);
    setGyms(gymsRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleUpdate = async () => {
    if (!editSub) return;
    setSaving(true);
    try {
      const tier = tiers.find(t => t.value === editForm.plan_tier);
      const { error } = await supabase.from("gym_subscriptions").update({
        plan_tier: editForm.plan_tier, status: editForm.status,
        max_members: tier?.maxMembers || 50, price_monthly: tier?.price || 0,
      }).eq("id", editSub.id);
      if (error) throw error;
      toast.success("Subscription updated");
      setEditSub(null);
      fetchData();
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const createSub = async (gymId: string) => {
    try {
      const { error } = await supabase.from("gym_subscriptions").insert({
        gym_id: gymId, plan_tier: "free", max_members: 50, price_monthly: 0,
      });
      if (error) throw error;
      toast.success("Subscription created");
      fetchData();
    } catch (err: any) { toast.error(err.message); }
  };

  const totalMRR = subs.filter(s => s.status === "active").reduce((s, sub) => s + Number(sub.price_monthly || 0), 0);
  const activeSubs = subs.filter(s => s.status === "active").length;
  const gymsWithoutSub = gyms.filter(g => !subs.find(s => s.gym_id === g.id));

  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Platform Subscriptions</h1>
        <p className="text-sm text-muted-foreground">Manage gym SaaS billing</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard label="Monthly MRR" value={`₹${totalMRR.toLocaleString("en-IN")}`} icon={<CreditCard className="w-4 h-4" />} />
        <MetricCard label="Active Subs" value={activeSubs} changeType="positive" icon={<Building2 className="w-4 h-4" />} />
        <MetricCard label="No Sub" value={gymsWithoutSub.length} changeType={gymsWithoutSub.length > 0 ? "negative" : "positive"} />
      </div>

      {gymsWithoutSub.length > 0 && (
        <div className="bg-card rounded-xl p-4 shadow-surface">
          <p className="text-sm font-medium text-foreground mb-2">Gyms without subscription:</p>
          <div className="flex flex-wrap gap-2">
            {gymsWithoutSub.map(g => (
              <button key={g.id} onClick={() => createSub(g.id)}
                className="px-3 py-1.5 rounded-lg bg-surface text-sm text-foreground hover:bg-surface-raised">
                {g.name} ({g.code}) — Assign Free
              </button>
            ))}
          </div>
        </div>
      )}

      <DataTable
        columns={[
          { key: "gym", header: "Gym", render: (r: any) => <span>{r.gyms?.name || "—"} ({r.gyms?.code})</span> },
          { key: "plan_tier", header: "Tier", render: (r: any) => <span className="uppercase text-xs font-medium text-accent">{r.plan_tier}</span> },
          { key: "max_members", header: "Max Members" },
          { key: "price_monthly", header: "Price/mo", render: (r: any) => <span>₹{Number(r.price_monthly).toLocaleString("en-IN")}</span> },
          { key: "status", header: "Status", render: (r: any) => <StatusDot status={r.status === "active" ? "operational" : "critical"} label={r.status} /> },
          { key: "actions", header: "", render: (r: any) => (
            <button onClick={() => { setEditSub(r); setEditForm({ plan_tier: r.plan_tier, status: r.status }); }}
              className="p-1.5 rounded hover:bg-surface-raised text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
          )},
        ]}
        data={subs}
      />

      <Dialog open={!!editSub} onOpenChange={(v) => !v && setEditSub(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Edit Subscription</DialogTitle><DialogDescription>{editSub?.gyms?.name}</DialogDescription></DialogHeader>
          <div className="space-y-3 py-2">
            <div><label className="text-label mb-1 block">Tier</label>
              <select className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={editForm.plan_tier} onChange={e => setEditForm({...editForm, plan_tier: e.target.value})}>
                {tiers.map(t => <option key={t.value} value={t.value}>{t.label} — ₹{t.price}/mo ({t.maxMembers} members)</option>)}
              </select>
            </div>
            <div><label className="text-label mb-1 block">Status</label>
              <select className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})}>
                <option value="active">Active</option><option value="suspended">Suspended</option><option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setEditSub(null)} className="px-4 py-2 text-sm text-muted-foreground">Cancel</button>
            <button onClick={handleUpdate} disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">{saving ? "..." : "Save"}</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GymSubscriptions;
