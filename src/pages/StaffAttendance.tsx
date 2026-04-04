import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, Clock, UserCheck, Plus } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { DataTable } from "@/components/DataTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

const StaffAttendance = () => {
  const { gym } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ trainer_id: "", date: new Date().toISOString().split("T")[0] });

  const fetchData = async () => {
    const [recRes, trRes] = await Promise.all([
      supabase.from("staff_attendance").select("*, trainers(full_name, trainer_code)").order("check_in", { ascending: false }).limit(100),
      supabase.from("trainers").select("id, full_name, trainer_code"),
    ]);
    setRecords(recRes.data || []);
    setTrainers(trRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleCheckIn = async () => {
    if (!form.trainer_id || !gym) { toast.error("Select a trainer"); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from("staff_attendance").insert({
        gym_id: gym.id, trainer_id: form.trainer_id, date: form.date,
      });
      if (error) throw error;
      toast.success("Check-in recorded");
      setOpen(false);
      fetchData();
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleCheckOut = async (id: string) => {
    await supabase.from("staff_attendance").update({ check_out: new Date().toISOString() }).eq("id", id);
    toast.success("Checked out");
    fetchData();
  };

  const today = new Date().toISOString().split("T")[0];
  const todayRecords = records.filter(r => r.date === today);
  const presentToday = new Set(todayRecords.map(r => r.trainer_id)).size;

  const calcHours = (checkIn: string, checkOut: string | null) => {
    if (!checkOut) return "—";
    const diff = (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60);
    return `${diff.toFixed(1)}h`;
  };

  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Staff Attendance</h1>
          <p className="text-sm text-muted-foreground">Track trainer check-in/out</p>
        </div>
        <button onClick={() => setOpen(true)} className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:bg-accent/90 flex items-center gap-2 self-start">
          <Plus className="w-4 h-4" /> Mark Check-in
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <MetricCard label="Present Today" value={presentToday} icon={<UserCheck className="w-4 h-4" />} />
        <MetricCard label="Total Trainers" value={trainers.length} icon={<Clock className="w-4 h-4" />} />
      </div>

      <DataTable
        columns={[
          { key: "date", header: "Date" },
          { key: "trainer", header: "Trainer", render: (r: any) => <span>{r.trainers?.full_name || "—"}</span> },
          { key: "check_in", header: "Check In", render: (r: any) => <span className="text-xs">{new Date(r.check_in).toLocaleTimeString()}</span> },
          { key: "check_out", header: "Check Out", render: (r: any) => r.check_out ? <span className="text-xs">{new Date(r.check_out).toLocaleTimeString()}</span> : (
            <button onClick={() => handleCheckOut(r.id)} className="text-xs text-accent hover:underline">Check Out</button>
          )},
          { key: "hours", header: "Hours", render: (r: any) => <span className="text-xs">{calcHours(r.check_in, r.check_out)}</span> },
        ]}
        data={records}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Mark Check-in</DialogTitle><DialogDescription>Record staff attendance.</DialogDescription></DialogHeader>
          <div className="space-y-3 py-2">
            <div><label className="text-label mb-1 block">Trainer *</label>
              <select className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={form.trainer_id} onChange={e => setForm({...form, trainer_id: e.target.value})}>
                <option value="">Select</option>
                {trainers.map(t => <option key={t.id} value={t.id}>{t.full_name} ({t.trainer_code})</option>)}
              </select>
            </div>
            <div><label className="text-label mb-1 block">Date</label><input type="date" className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={form.date} onChange={e => setForm({...form, date: e.target.value})} /></div>
          </div>
          <DialogFooter>
            <button onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-muted-foreground">Cancel</button>
            <button onClick={handleCheckIn} disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">{saving ? "..." : "Check In"}</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffAttendance;
