import { useEffect, useState, useCallback } from "react";
import { MetricCard } from "@/components/MetricCard";
import { DataTable } from "@/components/DataTable";
import { QrCode, Keyboard, Users, Clock, Loader2, Hash, RefreshCw, Copy, CalendarDays, ChevronDown, ChevronUp, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

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
  const [dateEndFilter, setDateEndFilter] = useState("");
  const [rangeMode, setRangeMode] = useState(false);
  const [rangeData, setRangeData] = useState<any[]>([]);
  const [expandedMember, setExpandedMember] = useState<string | null>(null);

  // Manual past attendance
  const [pastOpen, setPastOpen] = useState(false);
  const [pastMembers, setPastMembers] = useState<any[]>([]);
  const [pastForm, setPastForm] = useState({ member_id: "", dates: "", time: "" });
  const [pastSaving, setPastSaving] = useState(false);

  const fetchDailyCode = useCallback(async () => {
    if (!gym) return;
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase.from("daily_codes").select("*").eq("gym_id", gym.id).eq("date", today).single();
    if (data) {
      setDailyCode(data.code);
      setQrToken(data.qr_token);
    } else {
      const code = String(Math.floor(100000 + Math.random() * 900000));
      const { data: newCode } = await supabase.from("daily_codes").insert({
        gym_id: gym.id, code, date: today,
      }).select().single();
      if (newCode) { setDailyCode(newCode.code); setQrToken(newCode.qr_token); }
    }
  }, [gym]);

  const fetchData = useCallback(async () => {
    const today = new Date().toISOString().split("T")[0];

    if (rangeMode && dateEndFilter) {
      // Fetch range data
      const { data } = await supabase
        .from("attendance")
        .select("*, members(full_name, member_code)")
        .gte("date", dateFilter)
        .lte("date", dateEndFilter)
        .order("check_in", { ascending: false });

      const records = data || [];
      setRecentCheckins(records);

      // Aggregate by member
      const memberMap: Record<string, { name: string; code: string; totalDays: number; totalHours: number; records: any[] }> = {};
      records.forEach(r => {
        const mid = r.member_id;
        if (!memberMap[mid]) {
          memberMap[mid] = { name: r.members?.full_name || "Unknown", code: r.members?.member_code || "", totalDays: 0, totalHours: 0, records: [] };
        }
        memberMap[mid].records.push(r);
        if (r.check_out) {
          const hours = (new Date(r.check_out).getTime() - new Date(r.check_in).getTime()) / (1000 * 60 * 60);
          memberMap[mid].totalHours += hours;
        }
      });
      // Count unique days
      Object.values(memberMap).forEach(m => {
        const uniqueDays = new Set(m.records.map(r => r.date));
        m.totalDays = uniqueDays.size;
      });
      setRangeData(Object.entries(memberMap).map(([id, data]) => ({ id, ...data })));
    } else {
      const [recentRes, todayRes] = await Promise.all([
        supabase.from("attendance").select("*, members(full_name, member_code)").eq("date", dateFilter).order("check_in", { ascending: false }).limit(100),
        supabase.from("attendance").select("*", { count: "exact", head: true }).eq("date", today),
      ]);
      setRecentCheckins(recentRes.data || []);
      const inGym = (recentRes.data || []).filter(a => !a.check_out && a.date === today).length;
      setStats({ today: todayRes.count || 0, inGym });
    }
    setLoading(false);
  }, [dateFilter, dateEndFilter, rangeMode]);

  useEffect(() => { fetchDailyCode(); }, [fetchDailyCode]);
  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const fetchMembers = async () => {
      const { data } = await supabase.from("members").select("id, full_name, member_code").order("full_name");
      setPastMembers(data || []);
    };
    fetchMembers();
  }, []);

  const handleManualCheckin = async () => {
    if (!memberCode.trim()) { toast.error("Enter member code"); return; }
    if (!gym || !user) return;
    setChecking(true);
    try {
      const { data: member, error: mErr } = await supabase.from("members").select("id, full_name").eq("member_code", memberCode.toUpperCase()).eq("gym_id", gym.id).single();
      if (mErr || !member) throw new Error("Member not found");

      const today = new Date().toISOString().split("T")[0];
      // Check for open session (no check_out)
      const { data: existing } = await supabase.from("attendance").select("id").eq("member_id", member.id).eq("date", today).is("check_out", null).limit(1);

      if (existing && existing.length > 0) {
        await supabase.from("attendance").update({ check_out: new Date().toISOString() }).eq("id", existing[0].id);
        toast.success(`${member.full_name} checked out`);
      } else {
        // Allow multiple check-ins per day
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

  const handlePastAttendance = async () => {
    if (!pastForm.member_id || !pastForm.dates) { toast.error("Select member and dates"); return; }
    if (!gym || !user) return;
    setPastSaving(true);
    try {
      const dates = pastForm.dates.split(",").map(d => d.trim()).filter(Boolean);
      const checkInTime = pastForm.time || "09:00";

      for (const date of dates) {
        const checkIn = new Date(`${date}T${checkInTime}:00`).toISOString();
        await supabase.from("attendance").insert({
          member_id: pastForm.member_id, gym_id: gym.id, method: "manual",
          marked_by: user.id, audit_note: "Past attendance marked by admin",
          date, check_in: checkIn,
        });
      }
      toast.success(`Marked attendance for ${dates.length} date(s)`);
      setPastOpen(false);
      setPastForm({ member_id: "", dates: "", time: "" });
      fetchData();
    } catch (err: any) { toast.error(err.message); }
    finally { setPastSaving(false); }
  };

  const copyText = (text: string) => { navigator.clipboard.writeText(text); toast.success("Copied!"); };

  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Attendance</h1>
          <p className="text-sm text-muted-foreground">{stats.inGym} members currently in-gym</p>
        </div>
        <button onClick={() => setPastOpen(true)} className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors flex items-center gap-2 self-start">
          <Plus className="w-4 h-4" /> Mark Past Attendance
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Today's Check-ins" value={stats.today} icon={<Users className="w-4 h-4" />} />
        <MetricCard label="Currently In-Gym" value={stats.inGym} icon={<Clock className="w-4 h-4" />} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Check-in Panel */}
        <div className="xl:col-span-1 space-y-4">
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
                <p className="text-xs text-muted-foreground text-center">Members scan this QR to check in. Changes daily.</p>
                <button onClick={fetchDailyCode} className="mt-2 flex items-center gap-1 text-xs text-accent hover:underline"><RefreshCw className="w-3 h-3" /> Refresh</button>
              </div>
            )}

            {mode === "code" && (
              <div className="flex flex-col items-center">
                <div className="bg-surface-raised rounded-xl px-8 py-6 mb-3">
                  <p className="text-3xl md:text-4xl font-mono font-bold text-foreground tracking-[0.3em] text-center">{dailyCode || "------"}</p>
                </div>
                <p className="text-xs text-muted-foreground text-center mb-2">Today's check-in code.</p>
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
        <div className="xl:col-span-2 bg-card rounded-xl p-4 md:p-5 shadow-surface">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <h2 className="text-sm font-medium text-foreground">Attendance History</h2>
            <div className="flex items-center gap-2 flex-wrap">
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <input type="checkbox" checked={rangeMode} onChange={(e) => { setRangeMode(e.target.checked); if (!e.target.checked) setDateEndFilter(""); }}
                  className="rounded" />
                Range
              </label>
              <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}
                className="bg-surface rounded-lg px-3 py-1.5 text-xs text-foreground border border-border" />
              {rangeMode && (
                <>
                  <span className="text-xs text-muted-foreground">to</span>
                  <input type="date" value={dateEndFilter} onChange={(e) => setDateEndFilter(e.target.value)}
                    className="bg-surface rounded-lg px-3 py-1.5 text-xs text-foreground border border-border" />
                </>
              )}
            </div>
          </div>

          {rangeMode && dateEndFilter ? (
            // Range view - aggregated by member
            rangeData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No records for this range</p>
            ) : (
              <div className="space-y-2">
                {rangeData.map((m: any) => (
                  <div key={m.id} className="border border-border rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpandedMember(expandedMember === m.id ? null : m.id)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-raised transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-surface-raised flex items-center justify-center text-xs font-medium text-muted-foreground">
                          {m.name.split(" ").map((n: string) => n[0]).join("")}
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-foreground">{m.name}</p>
                          <p className="text-xs text-muted-foreground">{m.code}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium text-foreground">{m.totalDays} days</p>
                          <p className="text-xs text-muted-foreground">{m.totalHours.toFixed(1)} hrs</p>
                        </div>
                        {expandedMember === m.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </button>
                    {expandedMember === m.id && (
                      <div className="border-t border-border px-4 py-2 bg-surface space-y-1">
                        {m.records.map((r: any) => (
                          <div key={r.id} className="flex items-center justify-between py-1.5 text-xs">
                            <span className="text-foreground">{r.date}</span>
                            <span className="text-muted-foreground">
                              {new Date(r.check_in).toLocaleTimeString()} → {r.check_out ? new Date(r.check_out).toLocaleTimeString() : <span className="text-primary font-medium">In-Gym</span>}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-xs ${r.method === "qr" ? "bg-primary/10 text-primary" : r.method === "daily_code" ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"}`}>{r.method}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          ) : (
            // Single date view
            recentCheckins.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No records for this date</p>
            ) : (
              <div className="overflow-x-auto">
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
              </div>
            )
          )}
        </div>
      </div>

      {/* Mark Past Attendance Dialog */}
      <Dialog open={pastOpen} onOpenChange={setPastOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mark Past Attendance</DialogTitle>
            <DialogDescription>Select a member and enter dates to mark attendance retroactively.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-label mb-1 block">Member *</label>
              <select className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={pastForm.member_id} onChange={(e) => setPastForm({ ...pastForm, member_id: e.target.value })}>
                <option value="">Select member</option>
                {pastMembers.map(m => <option key={m.id} value={m.id}>{m.full_name} ({m.member_code})</option>)}
              </select>
            </div>
            <div>
              <label className="text-label mb-1 block">Dates * (comma-separated YYYY-MM-DD)</label>
              <input className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={pastForm.dates} onChange={(e) => setPastForm({ ...pastForm, dates: e.target.value })}
                placeholder="2025-03-15, 2025-03-16" />
              <p className="text-xs text-muted-foreground mt-1">Or use the date picker below:</p>
              <input type="date" className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground mt-1"
                onChange={(e) => {
                  const val = e.target.value;
                  if (val) setPastForm({ ...pastForm, dates: pastForm.dates ? `${pastForm.dates}, ${val}` : val });
                }} />
            </div>
            <div>
              <label className="text-label mb-1 block">Check-in Time (optional)</label>
              <input type="time" className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={pastForm.time} onChange={(e) => setPastForm({ ...pastForm, time: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setPastOpen(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
            <button onClick={handlePastAttendance} disabled={pastSaving} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2">
              {pastSaving && <Loader2 className="w-4 h-4 animate-spin" />} Mark Attendance
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Attendance;
