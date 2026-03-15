import { useEffect, useState } from "react";
import { MetricCard } from "@/components/MetricCard";
import { QrCode, Keyboard, Users, Clock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Attendance = () => {
  const [mode, setMode] = useState<"qr" | "otp">("otp");
  const [memberCode, setMemberCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [recentCheckins, setRecentCheckins] = useState<any[]>([]);
  const [stats, setStats] = useState({ today: 0, inGym: 0 });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const today = new Date().toISOString().split("T")[0];
    const [recentRes, todayRes] = await Promise.all([
      supabase.from("attendance").select("*, members(full_name, member_code)").order("check_in", { ascending: false }).limit(15),
      supabase.from("attendance").select("*", { count: "exact", head: true }).gte("check_in", today),
    ]);
    setRecentCheckins(recentRes.data || []);
    const inGym = (recentRes.data || []).filter(a => !a.check_out).length;
    setStats({ today: todayRes.count || 0, inGym });
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleCheckin = async () => {
    if (!memberCode.trim()) { toast.error("Enter member code"); return; }
    setChecking(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data: gymId } = await supabase.rpc("get_user_gym_id", { _user_id: user.id });
      if (!gymId) throw new Error("No gym assigned");

      // Find member by code
      const { data: member, error: mErr } = await supabase.from("members").select("id, full_name").eq("member_code", memberCode.toUpperCase()).eq("gym_id", gymId).single();
      if (mErr || !member) throw new Error("Member not found with this code");

      // Check if already checked in (no checkout)
      const { data: existing } = await supabase.from("attendance").select("id").eq("member_id", member.id).is("check_out", null).limit(1);
      if (existing && existing.length > 0) {
        // Check out
        await supabase.from("attendance").update({ check_out: new Date().toISOString() }).eq("id", existing[0].id);
        toast.success(`${member.full_name} checked out`);
      } else {
        // Check in
        const { error } = await supabase.from("attendance").insert({
          member_id: member.id,
          gym_id: gymId,
          method: mode === "qr" ? "QR" : "manual",
        });
        if (error) throw error;
        toast.success(`${member.full_name} checked in`);
      }
      setMemberCode("");
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setChecking(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Attendance</h1>
        <p className="text-sm text-muted-foreground">{stats.inGym} members currently in-gym</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Today's Check-ins" value={stats.today} icon={<Users className="w-4 h-4" />} />
        <MetricCard label="Currently In-Gym" value={stats.inGym} icon={<Clock className="w-4 h-4" />} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Check-in Panel */}
        <div className="xl:col-span-1 bg-card rounded-xl p-6 shadow-surface flex flex-col items-center">
          <div className="flex bg-surface rounded-lg p-0.5 mb-6 w-full">
            <button onClick={() => setMode("qr")} className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${mode === "qr" ? "bg-surface-raised text-foreground" : "text-muted-foreground"}`}>
              <QrCode className="w-4 h-4" /> QR Scan
            </button>
            <button onClick={() => setMode("otp")} className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${mode === "otp" ? "bg-surface-raised text-foreground" : "text-muted-foreground"}`}>
              <Keyboard className="w-4 h-4" /> Member Code
            </button>
          </div>

          {mode === "qr" ? (
            <div className="w-48 h-48 bg-surface-raised rounded-xl flex items-center justify-center border-2 border-dashed border-border mb-4">
              <div className="text-center">
                <QrCode className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Camera feed here</p>
              </div>
            </div>
          ) : (
            <div className="w-full mb-4">
              <label className="text-label mb-2 block">Enter Member Code</label>
              <input
                type="text"
                placeholder="e.g. KSMM0001"
                value={memberCode}
                onChange={(e) => setMemberCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleCheckin()}
                className="w-full bg-surface rounded-lg px-4 py-3 text-lg text-center text-foreground font-mono placeholder:text-muted-foreground shadow-surface focus:outline-none focus:ring-1 focus:ring-accent tracking-[0.2em]"
              />
            </div>
          )}

          <button onClick={handleCheckin} disabled={checking} className="w-full py-3 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {checking && <Loader2 className="w-4 h-4 animate-spin" />}
            Check-in / Check-out
          </button>
        </div>

        {/* Recent Check-ins */}
        <div className="xl:col-span-2 bg-card rounded-xl p-5 shadow-surface">
          <h2 className="text-sm font-medium text-foreground mb-4">Recent Check-ins</h2>
          <div className="space-y-2">
            {recentCheckins.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No attendance records yet</p>}
            {recentCheckins.map((c) => (
              <div key={c.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-surface-raised transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                    {c.members?.full_name?.split(" ").map((n: string) => n[0]).join("") || "?"}
                  </div>
                  <div>
                    <p className="text-sm text-foreground font-medium">{c.members?.full_name || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">{new Date(c.check_in).toLocaleTimeString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${c.method === "QR" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"}`}>{c.method}</span>
                  {c.check_out ? (
                    <span className="text-xs text-muted-foreground">Out: {new Date(c.check_out).toLocaleTimeString()}</span>
                  ) : (
                    <span className="text-xs text-primary font-medium">In-Gym</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
