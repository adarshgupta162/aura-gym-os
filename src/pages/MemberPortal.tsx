import { useEffect, useState, useRef, useCallback } from "react";
import { MetricCard } from "@/components/MetricCard";
import { UserCircle, Calendar, Dumbbell, Tags, Loader2, Clock, Home, CheckCircle, BarChart3, User, Flame, Hash, Lock, QrCode, ArrowRightLeft, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Html5Qrcode } from "html5-qrcode";

type Tab = "home" | "attendance" | "workout" | "progress" | "profile";

const MemberPortal = () => {
  const { user, signOut } = useAuth();
  const [tab, setTab] = useState<Tab>("home");
  const [member, setMember] = useState<any>(null);
  const [plan, setPlan] = useState<any>(null);
  const [trainer, setTrainer] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [progressLogs, setProgressLogs] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dailyCodeInput, setDailyCodeInput] = useState("");
  const [checkingIn, setCheckingIn] = useState(false);
  const [weightInput, setWeightInput] = useState("");
  const [savingWeight, setSavingWeight] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: "", new: "", confirm: "" });
  const [changingPassword, setChangingPassword] = useState(false);
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const [switchAccountOpen, setSwitchAccountOpen] = useState(false);
  const [switchEmail, setSwitchEmail] = useState("");
  const [switchPassword, setSwitchPassword] = useState("");
  const [switching, setSwitching] = useState(false);
  const qrScannerRef = useRef<Html5Qrcode | null>(null);
  const qrContainerRef = useRef<string>("qr-reader-" + Math.random().toString(36).slice(2));

  const fetchAll = useCallback(async () => {
    if (!user) return;
    const { data: memberData } = await supabase
      .from("members")
      .select("*, plans(name, price, duration_days, features), trainers(full_name, specialization, phone)")
      .eq("user_id", user.id)
      .single();

    if (memberData) {
      setMember(memberData);
      setPlan(memberData.plans);
      setTrainer(memberData.trainers);

      const [attRes, workRes, progRes, payRes, notifRes] = await Promise.all([
        supabase.from("attendance").select("*").eq("member_id", memberData.id).order("check_in", { ascending: false }).limit(50),
        supabase.from("workout_plans").select("*").eq("member_id", memberData.id).order("day_of_week"),
        supabase.from("progress_logs").select("*").eq("member_id", memberData.id).order("logged_at", { ascending: false }).limit(30),
        supabase.from("payments").select("*").eq("member_id", memberData.id).order("payment_date", { ascending: false }),
        supabase.from("notifications").select("*").eq("gym_id", memberData.gym_id).order("created_at", { ascending: false }).limit(20),
      ]);
      setAttendance(attRes.data || []);
      setWorkouts(workRes.data || []);
      setProgressLogs(progRes.data || []);
      setPayments(payRes.data || []);
      setNotifications(notifRes.data || []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // QR Scanner
  const startQrScanner = useCallback(async () => {
    try {
      const html5QrCode = new Html5Qrcode(qrContainerRef.current);
      qrScannerRef.current = html5QrCode;
      await html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          // QR scanned - check in
          await html5QrCode.stop();
          qrScannerRef.current = null;
          setQrScannerOpen(false);
          await handleQrCheckin(decodedText);
        },
        () => {} // ignore errors during scanning
      );
    } catch (err: any) {
      toast.error("Camera access denied or not available");
      setQrScannerOpen(false);
    }
  }, []);

  const stopQrScanner = useCallback(async () => {
    if (qrScannerRef.current) {
      try { await qrScannerRef.current.stop(); } catch {}
      qrScannerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (qrScannerOpen) {
      setTimeout(() => startQrScanner(), 300);
    } else {
      stopQrScanner();
    }
    return () => { stopQrScanner(); };
  }, [qrScannerOpen]);

  const handleQrCheckin = async (qrToken: string) => {
    if (!member) return;
    setCheckingIn(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const { data: existing } = await supabase.from("attendance").select("id").eq("member_id", member.id).eq("date", today).limit(1);
      if (existing && existing.length > 0) { toast.error("Already checked in today!"); setCheckingIn(false); return; }

      const { data: codeData } = await supabase.from("daily_codes").select("*").eq("gym_id", member.gym_id).eq("date", today).eq("qr_token", qrToken).single();
      if (!codeData) { toast.error("Invalid or expired QR code"); setCheckingIn(false); return; }

      await supabase.from("attendance").insert({
        member_id: member.id, gym_id: member.gym_id, method: "qr", date: today,
      });
      toast.success("Checked in via QR! 🎉");
      const { data: attRes } = await supabase.from("attendance").select("*").eq("member_id", member.id).order("check_in", { ascending: false }).limit(50);
      setAttendance(attRes || []);
    } catch (err: any) { toast.error(err.message); }
    finally { setCheckingIn(false); }
  };

  const handleDailyCodeCheckin = async () => {
    if (!dailyCodeInput.trim() || !member) return;
    setCheckingIn(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const { data: existing } = await supabase.from("attendance").select("id").eq("member_id", member.id).eq("date", today).limit(1);
      if (existing && existing.length > 0) { toast.error("Already checked in today!"); setCheckingIn(false); return; }

      const { data: codeData } = await supabase.from("daily_codes").select("*").eq("gym_id", member.gym_id).eq("date", today).eq("code", dailyCodeInput.trim()).single();
      if (!codeData) { toast.error("Invalid code for today"); setCheckingIn(false); return; }

      await supabase.from("attendance").insert({
        member_id: member.id, gym_id: member.gym_id, method: "daily_code", date: today,
      });
      toast.success("Checked in successfully! 🎉");
      setDailyCodeInput("");
      const { data: attRes } = await supabase.from("attendance").select("*").eq("member_id", member.id).order("check_in", { ascending: false }).limit(50);
      setAttendance(attRes || []);
    } catch (err: any) { toast.error(err.message); }
    finally { setCheckingIn(false); }
  };

  const handleSaveWeight = async () => {
    if (!weightInput || !member) return;
    setSavingWeight(true);
    try {
      await supabase.from("progress_logs").insert({
        member_id: member.id, gym_id: member.gym_id, log_type: "weight",
        value: parseFloat(weightInput), unit: "kg",
      });
      toast.success("Weight logged!");
      setWeightInput("");
      const { data } = await supabase.from("progress_logs").select("*").eq("member_id", member.id).order("logged_at", { ascending: false }).limit(30);
      setProgressLogs(data || []);
    } catch (err: any) { toast.error(err.message); }
    finally { setSavingWeight(false); }
  };

  const handleChangePassword = async () => {
    if (passwordForm.new !== passwordForm.confirm) { toast.error("Passwords don't match"); return; }
    if (passwordForm.new.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordForm.new });
      if (error) throw error;
      toast.success("Password updated!");
      setPasswordForm({ current: "", new: "", confirm: "" });
    } catch (err: any) { toast.error(err.message); }
    finally { setChangingPassword(false); }
  };

  const handleSwitchAccount = async () => {
    if (!switchEmail || !switchPassword) { toast.error("Enter email and password"); return; }
    setSwitching(true);
    try {
      await supabase.auth.signOut();
      const { error } = await supabase.auth.signInWithPassword({ email: switchEmail, password: switchPassword });
      if (error) throw error;
      toast.success("Switched account!");
      setSwitchAccountOpen(false);
      setSwitchEmail("");
      setSwitchPassword("");
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message);
      // Re-login to original if switch fails
    } finally { setSwitching(false); }
  };

  const toggleWorkoutDone = async (id: string, isDone: boolean) => {
    await supabase.from("workout_plans").update({ is_done: !isDone }).eq("id", id);
    setWorkouts(workouts.map(w => w.id === id ? { ...w, is_done: !isDone } : w));
  };

  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  if (!member) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <UserCircle className="w-12 h-12 text-muted-foreground" />
      <p className="text-foreground font-medium">No member profile found</p>
      <p className="text-sm text-muted-foreground">Contact your gym administrator.</p>
    </div>
  );

  const daysLeft = member.due_date ? Math.max(0, Math.ceil((new Date(member.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null;
  const statusColor = daysLeft === null ? "text-muted-foreground" : daysLeft > 30 ? "text-primary" : daysLeft > 7 ? "text-amber-400" : "text-destructive";
  const statusBg = daysLeft === null ? "bg-muted" : daysLeft > 30 ? "bg-primary/10" : daysLeft > 7 ? "bg-amber-400/10" : "bg-destructive/10";

  const thisMonthAttendance = attendance.filter(a => {
    const d = new Date(a.check_in);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const sortedDates = [...new Set(attendance.map(a => a.date))].sort().reverse();
  let streak = 0;
  for (let i = 0; i < sortedDates.length; i++) {
    const expected = new Date();
    expected.setDate(expected.getDate() - i);
    if (sortedDates[i] === expected.toISOString().split("T")[0]) streak++;
    else break;
  }

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: "home", label: "Home", icon: Home },
    { key: "attendance", label: "Attendance", icon: Calendar },
    { key: "workout", label: "Workout", icon: Dumbbell },
    { key: "progress", label: "Progress", icon: BarChart3 },
    { key: "profile", label: "Profile", icon: User },
  ];

  return (
    <div className="pb-20 md:pb-0">
      {tab === "home" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-foreground">Welcome, {member.full_name} 👋</h1>
              <p className="text-sm text-muted-foreground">Member Code: {member.member_code}</p>
            </div>
            <button onClick={() => setSwitchAccountOpen(true)} className="p-2 rounded-lg hover:bg-surface transition-colors" title="Switch Account">
              <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Frozen banner */}
          {member.status === "frozen" && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-center">
              <p className="text-sm font-medium text-destructive">⚠️ Your membership has expired and account is frozen.</p>
              <p className="text-xs text-destructive/80 mt-1">Contact your gym admin to renew.</p>
            </div>
          )}

          {/* Status Card */}
          <div className={`${statusBg} rounded-xl p-5 border border-border`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-label">Membership Status</p>
                <p className={`text-2xl font-bold ${statusColor}`}>
                  {member.status === "frozen" ? "Frozen" : daysLeft !== null ? `${daysLeft} days left` : "No plan"}
                </p>
                {member.due_date && <p className="text-xs text-muted-foreground mt-1">Expires: {new Date(member.due_date).toLocaleDateString()}</p>}
              </div>
              <div className={`w-12 h-12 rounded-full ${statusBg} flex items-center justify-center`}>
                <Tags className={`w-6 h-6 ${statusColor}`} />
              </div>
            </div>
          </div>

          {/* Check-in buttons */}
          <div className="bg-card rounded-xl p-5 shadow-surface">
            <h2 className="text-sm font-medium text-foreground mb-3">Quick Check-in</h2>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <button onClick={() => setQrScannerOpen(true)}
                className="flex items-center justify-center gap-2 py-4 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 min-h-[56px] text-sm">
                <QrCode className="w-5 h-5" /> Scan QR
              </button>
              <button onClick={() => setTab("attendance")}
                className="flex items-center justify-center gap-2 py-4 bg-accent text-accent-foreground rounded-xl font-medium hover:bg-accent/90 min-h-[56px] text-sm">
                <Hash className="w-5 h-5" /> Enter Code
              </button>
            </div>
          </div>

          {/* Notifications */}
          {notifications.length > 0 && (
            <div className="bg-card rounded-xl p-5 shadow-surface">
              <h2 className="text-sm font-medium text-foreground mb-3">📢 Announcements</h2>
              <div className="space-y-2">
                {notifications.slice(0, 5).map(n => (
                  <div key={n.id} className="p-3 rounded-lg bg-surface-raised">
                    <p className="text-sm font-medium text-foreground">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-card rounded-xl p-4 shadow-surface text-center">
              <div className="flex items-center justify-center gap-1 mb-1"><Flame className="w-4 h-4 text-amber-400" /></div>
              <p className="text-xl font-bold text-foreground">{streak}</p>
              <p className="text-xs text-muted-foreground">Day Streak</p>
            </div>
            <div className="bg-card rounded-xl p-4 shadow-surface text-center">
              <p className="text-xl font-bold text-foreground">{thisMonthAttendance}</p>
              <p className="text-xs text-muted-foreground">This Month</p>
            </div>
            <div className="bg-card rounded-xl p-4 shadow-surface text-center">
              <p className="text-xl font-bold text-foreground">{attendance.length}</p>
              <p className="text-xs text-muted-foreground">Total Visits</p>
            </div>
          </div>

          {/* Plan & Trainer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card rounded-xl p-5 shadow-surface">
              <h2 className="text-sm font-medium text-foreground mb-3">My Plan</h2>
              {plan ? (
                <div>
                  <p className="text-xl font-semibold text-foreground">₹{plan.price?.toLocaleString("en-IN")}</p>
                  <p className="text-xs text-muted-foreground mb-2">{plan.name} · {plan.duration_days} days</p>
                  {plan.features?.map((f: string) => (
                    <p key={f} className="text-xs text-muted-foreground flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary" /> {f}</p>
                  ))}
                </div>
              ) : <p className="text-sm text-muted-foreground">No plan assigned</p>}
            </div>
            <div className="bg-card rounded-xl p-5 shadow-surface">
              <h2 className="text-sm font-medium text-foreground mb-3">My Trainer</h2>
              {trainer ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Dumbbell className="w-5 h-5 text-primary" /></div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{trainer.full_name}</p>
                    <p className="text-xs text-muted-foreground">{trainer.specialization || "General"}</p>
                  </div>
                </div>
              ) : <p className="text-sm text-muted-foreground">No trainer assigned</p>}
            </div>
          </div>
        </div>
      )}

      {tab === "attendance" && (
        <div className="space-y-6">
          <h1 className="text-lg font-semibold text-foreground">Attendance</h1>
          
          {/* Scan QR Button */}
          <button onClick={() => setQrScannerOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 min-h-[56px]">
            <QrCode className="w-5 h-5" /> Scan Gym QR Code
          </button>

          {/* Daily Code */}
          <div className="bg-card rounded-xl p-5 shadow-surface">
            <h2 className="text-sm font-medium text-foreground mb-3">Or Enter Daily Code</h2>
            <div className="flex gap-2">
              <input type="text" maxLength={6} placeholder="6-digit code" value={dailyCodeInput}
                onChange={(e) => setDailyCodeInput(e.target.value.replace(/\D/g, ""))}
                onKeyDown={(e) => e.key === "Enter" && handleDailyCodeCheckin()}
                className="flex-1 bg-surface rounded-lg px-4 py-3 text-center text-lg font-mono text-foreground placeholder:text-muted-foreground tracking-[0.3em] focus:outline-none focus:ring-1 focus:ring-accent" />
              <button onClick={handleDailyCodeCheckin} disabled={checkingIn}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 min-h-[48px]">
                {checkingIn ? <Loader2 className="w-5 h-5 animate-spin" /> : "Check In"}
              </button>
            </div>
          </div>

          {/* Calendar */}
          <div className="bg-card rounded-xl p-5 shadow-surface">
            <h2 className="text-sm font-medium text-foreground mb-3">This Month</h2>
            <div className="grid grid-cols-7 gap-2">
              {dayNames.map(d => <div key={d} className="text-xs text-muted-foreground text-center font-medium">{d}</div>)}
              {(() => {
                const now = new Date();
                const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
                const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
                const attendedDates = new Set(attendance.filter(a => {
                  const d = new Date(a.check_in);
                  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                }).map(a => new Date(a.check_in).getDate()));
                const cells = [];
                for (let i = 0; i < firstDay; i++) cells.push(<div key={`e${i}`} />);
                for (let d = 1; d <= daysInMonth; d++) {
                  const attended = attendedDates.has(d);
                  const isToday = d === now.getDate();
                  cells.push(
                    <div key={d} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs mx-auto ${attended ? "bg-primary text-primary-foreground" : isToday ? "border border-accent text-foreground" : "text-muted-foreground"}`}>
                      {d}
                    </div>
                  );
                }
                return cells;
              })()}
            </div>
          </div>

          {/* History */}
          <div className="bg-card rounded-xl p-5 shadow-surface">
            <h2 className="text-sm font-medium text-foreground mb-3">History</h2>
            {attendance.length > 0 ? (
              <div className="space-y-2">
                {attendance.slice(0, 20).map(a => (
                  <div key={a.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-surface-raised">
                    <div>
                      <p className="text-sm text-foreground">{new Date(a.check_in).toLocaleDateString()}</p>
                      <p className="text-xs text-muted-foreground">{new Date(a.check_in).toLocaleTimeString()}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${a.method === "qr" ? "bg-primary/10 text-primary" : a.method === "daily_code" ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"}`}>{a.method}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground text-center py-4">No records yet</p>}
          </div>
        </div>
      )}

      {tab === "workout" && (
        <div className="space-y-6">
          <h1 className="text-lg font-semibold text-foreground">Workout Plan</h1>
          {workouts.length === 0 ? (
            <div className="bg-card rounded-xl p-8 shadow-surface text-center">
              <Dumbbell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-foreground font-medium">No workout plan assigned</p>
              <p className="text-sm text-muted-foreground">Your trainer will assign exercises soon.</p>
            </div>
          ) : (
            [0, 1, 2, 3, 4, 5, 6].map(day => {
              const dayWorkouts = workouts.filter(w => w.day_of_week === day);
              if (dayWorkouts.length === 0) return null;
              return (
                <div key={day} className="bg-card rounded-xl p-5 shadow-surface">
                  <h2 className="text-sm font-medium text-foreground mb-3">{["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][day]}</h2>
                  <div className="space-y-2">
                    {dayWorkouts.map(w => (
                      <div key={w.id} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-surface-raised">
                        <button onClick={() => toggleWorkoutDone(w.id, w.is_done)}
                          className={`w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center ${w.is_done ? "bg-primary border-primary" : "border-border"}`}>
                          {w.is_done && <CheckCircle className="w-3.5 h-3.5 text-primary-foreground" />}
                        </button>
                        <div className="flex-1">
                          <p className={`text-sm ${w.is_done ? "line-through text-muted-foreground" : "text-foreground"}`}>{w.exercise_name}</p>
                          <p className="text-xs text-muted-foreground">{w.sets} sets × {w.reps} reps</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {tab === "progress" && (
        <div className="space-y-6">
          <h1 className="text-lg font-semibold text-foreground">Progress</h1>
          <div className="bg-card rounded-xl p-5 shadow-surface">
            <h2 className="text-sm font-medium text-foreground mb-3">Log Weight</h2>
            <div className="flex gap-2">
              <input type="number" placeholder="e.g. 75" value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                className="flex-1 bg-surface rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-1 focus:ring-accent" />
              <span className="flex items-center text-sm text-muted-foreground">kg</span>
              <button onClick={handleSaveWeight} disabled={savingWeight}
                className="px-4 py-3 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 min-h-[48px]">
                {savingWeight ? <Loader2 className="w-4 h-4 animate-spin" /> : "Log"}
              </button>
            </div>
          </div>
          <div className="bg-card rounded-xl p-5 shadow-surface">
            <h2 className="text-sm font-medium text-foreground mb-3">Weight History</h2>
            {progressLogs.filter(p => p.log_type === "weight").length > 0 ? (
              <div className="space-y-2">
                {progressLogs.filter(p => p.log_type === "weight").map(p => (
                  <div key={p.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-surface-raised">
                    <span className="text-sm text-foreground">{p.value} {p.unit}</span>
                    <span className="text-xs text-muted-foreground">{new Date(p.logged_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground text-center py-4">No weight entries yet</p>}
          </div>
        </div>
      )}

      {tab === "profile" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-foreground">Profile</h1>
            <div className="flex gap-2">
              <button onClick={() => setSwitchAccountOpen(true)} className="px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-raised text-xs text-muted-foreground flex items-center gap-1.5 transition-colors">
                <ArrowRightLeft className="w-3.5 h-3.5" /> Switch
              </button>
              <button onClick={signOut} className="px-3 py-1.5 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-xs text-destructive flex items-center gap-1.5 transition-colors">
                <LogOut className="w-3.5 h-3.5" /> Logout
              </button>
            </div>
          </div>
          <div className="bg-card rounded-xl p-5 shadow-surface space-y-3">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
                {member.full_name.split(" ").map((n: string) => n[0]).join("")}
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">{member.full_name}</p>
                <p className="text-sm text-muted-foreground">{member.member_code}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div><p className="text-label">Email</p><p className="text-sm text-foreground">{member.email || "—"}</p></div>
              <div><p className="text-label">Phone</p><p className="text-sm text-foreground">{member.phone || "—"}</p></div>
              <div><p className="text-label">Status</p><p className={`text-sm font-medium capitalize ${member.status === "frozen" ? "text-destructive" : "text-foreground"}`}>{member.status}</p></div>
              <div><p className="text-label">Weight</p><p className="text-sm text-foreground">{member.weight || "—"}</p></div>
            </div>
          </div>

          <div className="bg-card rounded-xl p-5 shadow-surface">
            <h2 className="text-sm font-medium text-foreground mb-3">Current Plan</h2>
            {plan ? (
              <div>
                <p className="text-lg font-semibold text-foreground">{plan.name}</p>
                <p className="text-sm text-muted-foreground">₹{plan.price?.toLocaleString("en-IN")} · {plan.duration_days} days</p>
                {member.due_date && <p className="text-sm text-muted-foreground mt-1">Expires: {new Date(member.due_date).toLocaleDateString()}</p>}
              </div>
            ) : <p className="text-sm text-muted-foreground">No plan</p>}
          </div>

          <div className="bg-card rounded-xl p-5 shadow-surface">
            <h2 className="text-sm font-medium text-foreground mb-3">Payment History</h2>
            {payments.length > 0 ? (
              <div className="space-y-2">
                {payments.map(p => (
                  <div key={p.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-surface-raised">
                    <div>
                      <p className="text-sm text-foreground">₹{Number(p.amount).toLocaleString("en-IN")}</p>
                      <p className="text-xs text-muted-foreground">{p.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{new Date(p.payment_date).toLocaleDateString()}</p>
                      <span className="text-xs uppercase text-accent">{p.method}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground text-center py-4">No payments</p>}
          </div>

          <div className="bg-card rounded-xl p-5 shadow-surface">
            <h2 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2"><Lock className="w-4 h-4" /> Change Password</h2>
            <div className="space-y-3">
              <input type="password" placeholder="New password" value={passwordForm.new}
                onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                className="w-full bg-surface rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent" />
              <input type="password" placeholder="Confirm new password" value={passwordForm.confirm}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                className="w-full bg-surface rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent" />
              <button onClick={handleChangePassword} disabled={changingPassword}
                className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 min-h-[48px] flex items-center justify-center gap-2">
                {changingPassword && <Loader2 className="w-4 h-4 animate-spin" />} Update Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation - Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-card border-t border-border z-50">
        <div className="flex">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${tab === key ? "text-primary" : "text-muted-foreground"}`}>
              <Icon className="w-5 h-5" />
              {label}
            </button>
          ))}
        </div>
      </nav>

      {/* Desktop Tab Switcher */}
      <div className="hidden md:flex fixed top-16 right-0 left-[240px] bg-card border-b border-border z-30 px-6">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab === key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* QR Scanner Dialog */}
      <Dialog open={qrScannerOpen} onOpenChange={(open) => { if (!open) stopQrScanner(); setQrScannerOpen(open); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><QrCode className="w-5 h-5" /> Scan Gym QR</DialogTitle>
            <DialogDescription>Point your camera at the gym's daily QR code.</DialogDescription>
          </DialogHeader>
          <div className="relative">
            <div id={qrContainerRef.current} className="w-full rounded-lg overflow-hidden" style={{ minHeight: 300 }} />
            {checkingIn && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Switch Account Dialog */}
      <Dialog open={switchAccountOpen} onOpenChange={setSwitchAccountOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><ArrowRightLeft className="w-5 h-5" /> Switch Account</DialogTitle>
            <DialogDescription>Sign in to another family member's account.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-label mb-1 block">Email</label>
              <input type="email" value={switchEmail} onChange={(e) => setSwitchEmail(e.target.value)}
                className="w-full bg-surface rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent" placeholder="family@email.com" />
            </div>
            <div>
              <label className="text-label mb-1 block">Password</label>
              <input type="password" value={switchPassword} onChange={(e) => setSwitchPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSwitchAccount()}
                className="w-full bg-surface rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent" placeholder="••••••••" />
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setSwitchAccountOpen(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
            <button onClick={handleSwitchAccount} disabled={switching}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2">
              {switching && <Loader2 className="w-4 h-4 animate-spin" />} Switch
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MemberPortal;
