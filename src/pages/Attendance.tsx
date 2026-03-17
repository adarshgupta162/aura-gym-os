import { useEffect, useState, useCallback } from "react";
import { MetricCard } from "@/components/MetricCard";
import { DataTable } from "@/components/DataTable";
import { QrCode, Keyboard, Users, Clock, Loader2, Hash, RefreshCw, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const Attendance = () => {
  const { user, gym } = useAuth();
  const [mode, setMode] = useState<"qr" | "code" | "manual">("manual");
  const [memberCode, setMemberCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [recentCheckins, setRecentCheckins] = useState<any[]>([]);
  const [stats, setStats] = useState({ today: 0, inGym: 0 });
  const [loading, setLoading] = useState(true);
  const [dailyCode, setDailyCode] = useState<string | null>(null);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split("T")[0]);

  const fetchDailyCode = useCallback(async () => {
    if (!gym) return;
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase.from("daily_codes").select("*").eq("gym_id", gym.id).eq("date", today).single();
    if (data) {
      setDailyCode(data.code);
      setQrToken(data.qr_token);
    } else {
      // Generate new daily code
      const code = String(Math.floor(100000 + Math.random() * 900000));
      const { data: newCode } = await supabase.from("daily_codes").insert({
        gym_id: gym.id, code, date: today,
      }).select().single();
      if (newCode) { setDailyCode(newCode.code); setQrToken(newCode.qr_token); }
    }
  }, [gym]);

  const fetchData = useCallback(async () => {
    const today = new Date().toISOString().split("T")[0];
    const [recentRes, todayRes] = await Promise.all([
      supabase.from("attendance").select("*, members(full_name, member_code)").eq("date", dateFilter).order("check_in", { ascending: false }).limit(50),
      supabase.from("attendance").select("*", { count: "exact", head: true }).eq("date", today),
    ]);
    setRecentCheckins(recentRes.data || []);
    const inGym = (recentRes.data || []).filter(a => !a.check_out && a.date === today).length;
    setStats({ today: todayRes.count || 0, inGym });
    setLoading(false);
  }, [dateFilter]);

  useEffect(() => { fetchDailyCode(); fetchData(); }, [fetchDailyCode, fetchData]);

  const handleManualCheckin = async () => {
    if (!memberCode.trim()) { toast.error("Enter member code"); return; }
    if (!gym || !user) return;
    setChecking(true);
    try {
      const { data: member, error: mErr } = await supabase.from("members").select("id, full_name").eq("member_code", memberCode.toUpperCase()).eq("gym_id", gym.id).single();
      if (mErr || !member) throw new Error("Member not found");

      const today = new Date().toISOString().split("T")[0];
      const { data: existing } = await supabase.from("attendance").select("id").eq("member_id", member.id).eq("date", today).is("check_out", null).limit(1);

      if (existing && existing.length > 0) {
        await supabase.from("attendance").update({ check_out: new Date().toISOString() }).eq("id", existing[0].id);
        toast.success(`${member.full_name} checked out`);
      } else {
        await supabase.from("attendance").insert({
          member_id: member.id, gym_id: gym.id, method: "manual",
          marked_by: user.id, audit_note: "Manual entry by admin", date: today,
        });
        toast.success(`${member.full_name} checked in`);
      }
      setMemberCode("");
      fetchData();
    } catch (err: any) { toast.error(err.message); }
    finally { setChecking(false); }
  };

  const copyText = (text: string) => { navigator.clipboard.writeText(text); toast.success("Copied!"); };

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
        <div className="xl:col-span-1 space-y-4">
          {/* Mode Switcher */}
          <div className="bg-card rounded-xl p-4 shadow-surface">
            <div className="flex bg-surface rounded-lg p-0.5 mb-4">
              {[
                { key: "qr", label: "Daily QR", icon: QrCode },
                { key: "code", label: "Daily Code", icon: Hash },
                { key: "manual", label: "Manual", icon: Keyboard },
              ].map(({ key, label, icon: Icon }) => (
                <button key={key} onClick={() => setMode(key as any)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-md text-xs font-medium transition-colors ${mode === key ? "bg-surface-raised text-foreground" : "text-muted-foreground"}`}>
                  <Icon className="w-3.5 h-3.5" /> {label}
                </button>
              ))}
            </div>

            {mode === "qr" && (
              <div className="flex flex-col items-center">
                <div className="w-48 h-48 bg-white rounded-xl flex items-center justify-center mb-3">
                  {qrToken ? (
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrToken)}`} alt="Daily QR" className="w-44 h-44" />
                  ) : (
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground text-center">Members scan this QR to check in. Changes daily at midnight.</p>
                <button onClick={fetchDailyCode} className="mt-2 flex items-center gap-1 text-xs text-accent hover:underline"><RefreshCw className="w-3 h-3" /> Refresh</button>
              </div>
            )}

            {mode === "code" && (
              <div className="flex flex-col items-center">
                <div className="bg-surface-raised rounded-xl px-8 py-6 mb-3">
                  <p className="text-4xl font-mono font-bold text-foreground tracking-[0.3em] text-center">{dailyCode || "------"}</p>
                </div>
                <p className="text-xs text-muted-foreground text-center mb-2">Today's check-in code. Members enter this in their portal.</p>
                {dailyCode && (
                  <button onClick={() => copyText(dailyCode)} className="flex items-center gap-1 text-xs text-accent hover:underline"><Copy className="w-3 h-3" /> Copy Code</button>
                )}
              </div>
            )}

            {mode === "manual" && (
              <div>
                <label className="text-label mb-2 block">Enter Member Code</label>
                <input type="text" placeholder="e.g. KSMM0001" value={memberCode}
                  onChange={(e) => setMemberCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleManualCheckin()}
                  className="w-full bg-surface rounded-lg px-4 py-3 text-lg text-center text-foreground font-mono placeholder:text-muted-foreground shadow-surface focus:outline-none focus:ring-1 focus:ring-accent tracking-[0.2em]" />
                <button onClick={handleManualCheckin} disabled={checking}
                  className="w-full mt-3 py-3 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {checking && <Loader2 className="w-4 h-4 animate-spin" />} Check-in / Check-out
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Attendance History */}
        <div className="xl:col-span-2 bg-card rounded-xl p-5 shadow-surface">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-foreground">Attendance History</h2>
            <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}
              className="bg-surface rounded-lg px-3 py-1.5 text-xs text-foreground border border-border" />
          </div>
          {recentCheckins.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No records for this date</p>
          ) : (
            <DataTable
              columns={[
                { key: "member", header: "Member", render: (c: any) => (
                  <div><p className="text-sm text-foreground font-medium">{c.members?.full_name || "Unknown"}</p><p className="text-xs text-muted-foreground">{c.members?.member_code}</p></div>
                )},
                { key: "check_in", header: "In", render: (c: any) => <span className="text-xs">{new Date(c.check_in).toLocaleTimeString()}</span> },
                { key: "check_out", header: "Out", render: (c: any) => <span className="text-xs">{c.check_out ? new Date(c.check_out).toLocaleTimeString() : <span className="text-primary font-medium">In-Gym</span>}</span> },
                { key: "method", header: "Method", render: (c: any) => (
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${c.method === "qr" ? "bg-primary/10 text-primary" : c.method === "daily_code" ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"}`}>{c.method}</span>
                )},
              ]}
              data={recentCheckins}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Attendance;
