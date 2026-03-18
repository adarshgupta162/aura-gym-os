import { useEffect, useState, useCallback } from "react";
import { MetricCard } from "@/components/MetricCard";
import { DataTable } from "@/components/DataTable";
import { QrCode, Keyboard, Users, Clock, Loader2, Hash, RefreshCw, Copy, CalendarRange, ChevronDown, ChevronUp, Plus } from "lucide-react";
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
  const [dateRangeMode, setDateRangeMode] = useState(false);
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().split("T")[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split("T")[0]);
  const [rangeSummary, setRangeSummary] = useState<any[]>([]);
  const [expandedMember, setExpandedMember] = useState<string | null>(null);
  const [expandedDetails, setExpandedDetails] = useState<any[]>([]);
  // Past attendance marking
  const [pastMarkOpen, setPastMarkOpen] = useState(false);
  const [pastMarkForm, setPastMarkForm] = useState({ member_id: "", dates: [] as string[], time: "" });
  const [members, setMembers] = useState<any[]>([]);
  const [markingSaving, setMarkingSaving] = useState(false);

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

    if (dateRangeMode) {
      // Range mode: aggregate by member
      const { data: rangeData } = await supabase.from("attendance")
        .select("*, members(full_name, member_code)")
        .gte("date", dateFrom).lte("date", dateTo)
        .order("check_in", { ascending: false });

      const records = rangeData || [];
      // Aggregate by member
      const memberMap: Record<string, { name: string; code: string; member_id: string; days: Set<string>; totalHours: number; records: any[] }> = {};
      records.forEach(r => {
        const mid = r.member_id;
        if (!memberMap[mid]) {
          memberMap[mid] = { name: r.members?.full_name || "Unknown", code: r.members?.member_code || "", member_id: mid, days: new Set(), totalHours: 0, records: [] };
        }
        memberMap[mid].days.add(r.date);
        if (r.check_in && r.check_out) {
          memberMap[mid].totalHours += (new Date(r.check_out).getTime() - new Date(r.check_in).getTime()) / (1000 * 60 * 60);
        }
        memberMap[mid].records.push(r);
      });
      setRangeSummary(Object.values(memberMap).map(m => ({ ...m, dayCount: m.days.size, totalHours: Math.round(m.totalHours * 10) / 10 })));
      setRecentCheckins([]);
    } else {
      // Single date mode
      const [recentRes, todayRes] = await Promise.all([
        supabase.from("attendance").select("*, members(full_name, member_code)").eq("date", dateFilter).order("check_in", { ascending: false }).limit(50),
        supabase.from("attendance").select("*", { count: "exact", head: true }).eq("date", today),
      ]);
      setRecentCheckins(recentRes.data || []);
      const inGym = (recentRes.data || []).filter(a => !a.check_out && a.date === today).length;
      setStats({ today: todayRes.count || 0, inGym });
      setRangeSummary([]);
    }
    setLoading(false);
  }, [dateFilter, dateRangeMode, dateFrom, dateTo]);

  const fetchMembers = useCallback(async () => {
    const { data } = await supabase.from("members").select("id, full_name, member_code").eq("status", "active");
    setMembers(data || []);
  }, []);

  useEffect(() => { fetchDailyCode(); fetchData(); fetchMembers(); }, [fetchDailyCode, fetchData, fetchMembers]);

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

  const handleMarkPastAttendance = async () => {
    if (!pastMarkForm.member_id || pastMarkForm.dates.length === 0) {
      toast.error("Select member and at least one date"); return;
    }
    if (!gym || !user) return;
    setMarkingSaving(true);
    try {
      const records = pastMarkForm.dates.map(date => ({
        member_id: pastMarkForm.member_id,
        gym_id: gym.id,
        method: "manual" as const,
        marked_by: user.id,
        audit_note: "Past attendance marked by admin",
        date,
        ...(pastMarkForm.time ? { check_in: `${date}T${pastMarkForm.time}:00` } : {}),
      }));

      const { error } = await supabase.from("attendance").insert(records);
      if (error) throw error;
      toast.success(`Marked attendance for ${pastMarkForm.dates.length} date(s)`);
      setPastMarkOpen(false);
      setPastMarkForm({ member_id: "", dates: [], time: "" });
      fetchData();
    } catch (err: any) { toast.error(err.message); }
    finally { setMarkingSaving(false); }
  };

  const togglePastDate = (date: string) => {
    setPastMarkForm(prev => ({
      ...prev,
      dates: prev.dates.includes(date) ? prev.dates.filter(d => d !== date) : [...prev.dates, date],
    }));
  };

  const handleExpandMember = async (memberId: string) => {
    if (expandedMember === memberId) { setExpandedMember(null); return; }
    setExpandedMember(memberId);
    const { data } = await supabase.from("attendance").select("*")
      .eq("member_id", memberId).gte("date", dateFrom).lte("date", dateTo)
      .order("date", { ascending: false });
    setExpandedDetails(data || []);
  };

  const copyText = (text: string) => { navigator.clipboard.writeText(text); toast.success("Copied!"); };

  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  // Past 30 days for date picker in past marking
  const past30Days: string[] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    past30Days.push(d.toISOString().split("T")[0]);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Attendance</h1>
          <p className="text-sm text-muted-foreground">{stats.inGym} members currently in-gym</p>
        </div>
        <button onClick={() => setPastMarkOpen(true)}
          className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors flex items-center gap-2">
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
                <p className="text-xs text-muted-foreground text-center">Members scan this QR to check in.</p>
                <button onClick={fetchDailyCode} className="mt-2 flex items-center gap-1 text-xs text-accent hover:underline"><RefreshCw className="w-3 h-3" /> Refresh</button>
              </div>
            )}

            {mode === "code" && (
              <div className="flex flex-col items-center">
                <div className="bg-surface-raised rounded-xl px-8 py-6 mb-3">
                  <p className="text-4xl font-mono font-bold text-foreground tracking-[0.3em] text-center">{dailyCode || "------"}</p>
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
        <div className="xl:col-span-2 bg-card rounded-xl p-5 shadow-surface">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
            <h2 className="text-sm font-medium text-foreground">Attendance History</h2>
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => setDateRangeMode(!dateRangeMode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${dateRangeMode ? "bg-primary text-primary-foreground" : "bg-surface text-muted-foreground hover:text-foreground"}`}>
                <CalendarRange className="w-3.5 h-3.5" /> {dateRangeMode ? "Range" : "Single Day"}
              </button>
              {dateRangeMode ? (
                <div className="flex items-center gap-1">
                  <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                    className="bg-surface rounded-lg px-2 py-1.5 text-xs text-foreground border border-border" />
                  <span className="text-xs text-muted-foreground">to</span>
                  <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                    className="bg-surface rounded-lg px-2 py-1.5 text-xs text-foreground border border-border" />
                </div>
              ) : (
                <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}
                  className="bg-surface rounded-lg px-3 py-1.5 text-xs text-foreground border border-border" />
              )}
            </div>
          </div>

          {dateRangeMode && rangeSummary.length > 0 ? (
            <div className="space-y-2">
              {rangeSummary.map((m: any) => (
                <div key={m.member_id}>
                  <button onClick={() => handleExpandMember(m.member_id)}
                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-surface-raised transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                        {m.name.split(" ").map((n: string) => n[0]).join("")}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-foreground">{m.name}</p>
                        <p className="text-xs text-muted-foreground">{m.code}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-foreground">{m.dayCount} days</p>
                        <p className="text-xs text-muted-foreground">{m.totalHours}h total</p>
                      </div>
                      {expandedMember === m.member_id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </button>
                  {expandedMember === m.member_id && (
                    <div className="ml-11 mb-2 space-y-1">
                      {expandedDetails.map(d => (
                        <div key={d.id} className="flex items-center justify-between py-1.5 px-3 text-xs rounded bg-surface">
                          <span className="text-foreground">{new Date(d.check_in).toLocaleDateString()}</span>
                          <span className="text-muted-foreground">{new Date(d.check_in).toLocaleTimeString()} — {d.check_out ? new Date(d.check_out).toLocaleTimeString() : "In-Gym"}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${d.method === "qr" ? "bg-primary/10 text-primary" : d.method === "daily_code" ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"}`}>{d.method}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : dateRangeMode && rangeSummary.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No records for this range</p>
          ) : recentCheckins.length === 0 ? (
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

      {/* Mark Past Attendance Dialog */}
      <Dialog open={pastMarkOpen} onOpenChange={setPastMarkOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mark Past Attendance</DialogTitle>
            <DialogDescription>Select a member and choose dates to mark.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-label mb-1 block">Member *</label>
              <select className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground"
                value={pastMarkForm.member_id} onChange={(e) => setPastMarkForm({ ...pastMarkForm, member_id: e.target.value })}>
                <option value="">Select member</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.full_name} ({m.member_code})</option>)}
              </select>
            </div>
            <div>
              <label className="text-label mb-1 block">Check-in Time (optional)</label>
              <input type="time" value={pastMarkForm.time} onChange={(e) => setPastMarkForm({ ...pastMarkForm, time: e.target.value })}
                className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" />
            </div>
            <div>
              <label className="text-label mb-2 block">Select Dates ({pastMarkForm.dates.length} selected)</label>
              <div className="grid grid-cols-7 gap-1 max-h-48 overflow-y-auto">
                {past30Days.map(d => {
                  const isSelected = pastMarkForm.dates.includes(d);
                  const dayNum = new Date(d).getDate();
                  const month = new Date(d).toLocaleString("default", { month: "short" });
                  return (
                    <button key={d} onClick={() => togglePastDate(d)}
                      className={`w-full aspect-square rounded-lg text-xs flex flex-col items-center justify-center transition-colors ${isSelected ? "bg-primary text-primary-foreground" : "bg-surface hover:bg-surface-raised text-muted-foreground"}`}>
                      <span className="font-medium">{dayNum}</span>
                      <span className="text-[9px]">{month}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setPastMarkOpen(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
            <button onClick={handleMarkPastAttendance} disabled={markingSaving}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2">
              {markingSaving && <Loader2 className="w-4 h-4 animate-spin" />} Mark Attendance
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Attendance;
