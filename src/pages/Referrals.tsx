import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, Gift, Users, Plus, Share2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { MetricCard } from "@/components/MetricCard";
import { DataTable } from "@/components/DataTable";
import { StatusDot } from "@/components/StatusDot";

const Referrals = () => {
  const { gym } = useAuth();
  const [referrals, setReferrals] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ referrer_member_id: "", referred_name: "", referred_phone: "", referred_email: "", reward_type: "days", reward_value: "7" });

  const fetchData = async () => {
    const [refRes, memRes] = await Promise.all([
      supabase.from("referrals").select("*, members!referrals_referrer_member_id_fkey(full_name, member_code)").order("created_at", { ascending: false }),
      supabase.from("members").select("id, full_name, member_code"),
    ]);
    setReferrals(refRes.data || []);
    setMembers(memRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = async () => {
    if (!form.referrer_member_id || !form.referred_name || !gym) { toast.error("Referrer and name required"); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from("referrals").insert({
        gym_id: gym.id, referrer_member_id: form.referrer_member_id,
        referred_name: form.referred_name, referred_phone: form.referred_phone || null,
        referred_email: form.referred_email || null,
        reward_type: form.reward_type, reward_value: parseInt(form.reward_value) || 7,
      });
      if (error) throw error;
      toast.success("Referral added");
      setOpen(false);
      setForm({ referrer_member_id: "", referred_name: "", referred_phone: "", referred_email: "", reward_type: "days", reward_value: "7" });
      fetchData();
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("referrals").update({ status }).eq("id", id);
    toast.success("Updated");
    fetchData();
  };

  const pending = referrals.filter(r => r.status === "pending").length;
  const converted = referrals.filter(r => r.status === "converted").length;

  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Referral Program</h1>
          <p className="text-sm text-muted-foreground">{referrals.length} referrals tracked</p>
        </div>
        <button onClick={() => setOpen(true)} className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:bg-accent/90 flex items-center gap-2 self-start">
          <Plus className="w-4 h-4" /> Add Referral
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard label="Total Referrals" value={referrals.length} icon={<Share2 className="w-4 h-4" />} />
        <MetricCard label="Pending" value={pending} icon={<Users className="w-4 h-4" />} />
        <MetricCard label="Converted" value={converted} changeType="positive" icon={<Gift className="w-4 h-4" />} />
      </div>

      <DataTable
        columns={[
          { key: "referrer", header: "Referrer", render: (r: any) => <span>{r.members?.full_name || "—"}</span> },
          { key: "referred_name", header: "Referred" },
          { key: "referred_phone", header: "Phone", render: (r: any) => <span>{r.referred_phone || "—"}</span> },
          { key: "reward", header: "Reward", render: (r: any) => <span className="text-xs">{r.reward_value} {r.reward_type}</span> },
          { key: "status", header: "Status", render: (r: any) => (
            <select value={r.status} onChange={e => updateStatus(r.id, e.target.value)}
              className="bg-surface rounded px-2 py-1 text-xs text-foreground">
              <option value="pending">Pending</option>
              <option value="contacted">Contacted</option>
              <option value="converted">Converted</option>
              <option value="expired">Expired</option>
            </select>
          )},
          { key: "created_at", header: "Date", render: (r: any) => <span className="text-xs">{new Date(r.created_at).toLocaleDateString()}</span> },
        ]}
        data={referrals}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Referral</DialogTitle><DialogDescription>Track a member referral.</DialogDescription></DialogHeader>
          <div className="space-y-3 py-2">
            <div><label className="text-label mb-1 block">Referrer *</label>
              <select className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={form.referrer_member_id} onChange={e => setForm({...form, referrer_member_id: e.target.value})}>
                <option value="">Select member</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.full_name} ({m.member_code})</option>)}
              </select>
            </div>
            <div><label className="text-label mb-1 block">Referred Name *</label><input className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={form.referred_name} onChange={e => setForm({...form, referred_name: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-label mb-1 block">Phone</label><input className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={form.referred_phone} onChange={e => setForm({...form, referred_phone: e.target.value})} /></div>
              <div><label className="text-label mb-1 block">Reward (days)</label><input type="number" className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={form.reward_value} onChange={e => setForm({...form, reward_value: e.target.value})} /></div>
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-muted-foreground">Cancel</button>
            <button onClick={handleAdd} disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">{saving ? "..." : "Add"}</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Referrals;
