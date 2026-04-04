import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Plus, Loader2, UserPlus, Phone, Calendar, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { MetricCard } from "@/components/MetricCard";
import { DataTable } from "@/components/DataTable";
import { StatusDot } from "@/components/StatusDot";

const Enquiries = () => {
  const { gym } = useAuth();
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", interest: "", follow_up_date: "", notes: "" });

  const fetchData = async () => {
    const { data } = await supabase.from("enquiries").select("*").order("created_at", { ascending: false });
    setEnquiries(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = async () => {
    if (!form.name || !gym) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from("enquiries").insert({
        gym_id: gym.id, name: form.name, phone: form.phone || null, email: form.email || null,
        interest: form.interest || null, follow_up_date: form.follow_up_date || null, notes: form.notes || null,
      });
      if (error) throw error;
      toast.success("Enquiry added");
      setOpen(false);
      setForm({ name: "", phone: "", email: "", interest: "", follow_up_date: "", notes: "" });
      fetchData();
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("enquiries").update({ status }).eq("id", id);
    toast.success("Status updated");
    fetchData();
  };

  const newCount = enquiries.filter(e => e.status === "new").length;
  const contactedCount = enquiries.filter(e => e.status === "contacted").length;
  const convertedCount = enquiries.filter(e => e.status === "converted").length;
  const conversionRate = enquiries.length > 0 ? ((convertedCount / enquiries.length) * 100).toFixed(1) : "0";

  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Enquiries & Leads</h1>
          <p className="text-sm text-muted-foreground">{enquiries.length} total leads</p>
        </div>
        <button onClick={() => setOpen(true)} className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors flex items-center gap-2 self-start">
          <Plus className="w-4 h-4" /> Add Enquiry
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="New Leads" value={newCount} icon={<UserPlus className="w-4 h-4" />} />
        <MetricCard label="Contacted" value={contactedCount} icon={<Phone className="w-4 h-4" />} />
        <MetricCard label="Converted" value={convertedCount} changeType="positive" icon={<ArrowRight className="w-4 h-4" />} />
        <MetricCard label="Conversion Rate" value={`${conversionRate}%`} icon={<Calendar className="w-4 h-4" />} />
      </div>

      <DataTable
        columns={[
          { key: "name", header: "Name" },
          { key: "phone", header: "Phone", render: (r: any) => <span>{r.phone || "—"}</span> },
          { key: "interest", header: "Interest", render: (r: any) => <span>{r.interest || "—"}</span> },
          { key: "follow_up_date", header: "Follow-up", render: (r: any) => <span className="text-xs">{r.follow_up_date || "—"}</span> },
          { key: "status", header: "Status", render: (r: any) => (
            <select value={r.status} onChange={e => updateStatus(r.id, e.target.value)}
              className="bg-surface rounded px-2 py-1 text-xs text-foreground">
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="follow_up">Follow Up</option>
              <option value="converted">Converted</option>
              <option value="lost">Lost</option>
            </select>
          )},
          { key: "created_at", header: "Date", render: (r: any) => <span className="text-xs">{new Date(r.created_at).toLocaleDateString()}</span> },
        ]}
        data={enquiries}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Enquiry</DialogTitle><DialogDescription>Track a new walk-in or phone enquiry.</DialogDescription></DialogHeader>
          <div className="space-y-3 py-2">
            <div><label className="text-label mb-1 block">Name *</label><input className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Raj Kumar" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-label mb-1 block">Phone</label><input className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="9876543210" /></div>
              <div><label className="text-label mb-1 block">Email</label><input className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="raj@email.com" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-label mb-1 block">Interest</label><input className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={form.interest} onChange={e => setForm({...form, interest: e.target.value})} placeholder="Weight loss, muscle gain" /></div>
              <div><label className="text-label mb-1 block">Follow-up Date</label><input type="date" className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={form.follow_up_date} onChange={e => setForm({...form, follow_up_date: e.target.value})} /></div>
            </div>
            <div><label className="text-label mb-1 block">Notes</label><textarea className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground min-h-[60px]" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
          </div>
          <DialogFooter>
            <button onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-muted-foreground">Cancel</button>
            <button onClick={handleAdd} disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Add Lead
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Enquiries;
