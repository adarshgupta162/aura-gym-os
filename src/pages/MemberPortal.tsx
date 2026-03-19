import { useEffect, useState, useRef } from "react";
import { MetricCard } from "@/components/MetricCard";
import { UserCircle, Calendar, Dumbbell, Tags, Loader2, Clock, Home, CheckCircle, BarChart3, User, Flame, Hash, Lock, QrCode, ArrowRightLeft, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

type Tab = "home" | "attendance" | "workout" | "progress" | "profile";

const MemberPortal = () => {
  const { user, gym } = useAuth();
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
  const [passwordForm, setPasswordForm] = useState({ new: "", confirm: "" });
  const [changingPassword, setChangingPassword] = useState(false);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [switchOpen, setSwitchOpen] = useState(false);
  const [switchEmail, setSwitchEmail] = useState("");
  const [switchPassword, setSwitchPassword] = useState("");
  const [switching, setSwitching] = useState(false);

  const SAVED_SESSIONS_KEY = "saved_sessions";

  useEffect(() => {
    if (!user) return;
    const fetchAll = async () => {
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
          supabase.from("attendance").select("*").eq("member_id", memberData.id).order("check_in", { ascending: false }).limit(100),
          supabase.from("workout_plans").select("*").eq("member_id", memberData.id).order("day_of_week"),
          supabase.from("progress_logs").select("*").eq("member_id", memberData.id).order("logged_at", { ascending: false }).limit(30),
          supabase.from("payments").select("*").eq("member_id", memberData.id).order("payment_date", { ascending: false }),
          supabase.from("notification_recipients").select("*, notifications(title, message, created_at)").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
        ]);
        setAttendance(attRes.data || []);
        setWorkouts(workRes.data || []);
        setProgressLogs(progRes.data || []);
        setPayments(payRes.data || []);
        setNotifications(notifRes.data || []);
      }
      setLoading(false);
    };
    fetchAll();
  }, [user]);

  const toggleAttendance = async (method: "daily_code" | "qr") => {
    if (!member) return;
    const today = new Date().toISOString().split("T")[0];
    const { data: openSession } = await supabase
      .from("attendance")
      .select("id")
      .eq("member_id", member.id)
      .eq("date", today)
      .is("check_out", null)
      .limit(1);

    if (openSession && openSession.length > 0) {
      await supabase.from("attendance").update({ check_out: new Date().toISOString() }).eq("id", openSession[0].id);
      toast.success(method === "qr" ? "QR Check-out successful! 👋" : "Checked out! 👋");
    } else {
      await supabase.from("attendance").insert({
        member_id: member.id, gym_id: member.gym_id, method, date: today,
      });
      toast.success(method === "qr" ? "QR Check-in successful! 🎉" : "Checked in! 🎉");
    }
    const { data: attRes } = await supabase.from("attendance").select("*").eq("member_id", member.id).order("check_in", { ascending: false }).limit(100);
    setAttendance(attRes || []);
  };

  const handleDailyCodeCheckin = async () => {
    if (!dailyCodeInput.trim() || !member) return;
    setCheckingIn(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      // Verify daily code
      const { data: codeData } = await supabase.from("daily_codes").select("*").eq("gym_id", member.gym_id).eq("date", today).eq("code", dailyCodeInput.trim()).single();
      if (!codeData) { toast.error("Invalid code for today"); return; }

      await toggleAttendance("daily_code");
      setDailyCodeInput("");
    } catch (err: any) { toast.error(err.message); }
    finally { setCheckingIn(false); }
  };

  const handleQrScan = async () => {
    if (!member) return;
    setScanning(true);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("qr-reader");
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          await scanner.stop();
          setScanning(false);
          // Verify QR token
          const today = new Date().toISOString().split("T")[0];
          const { data: codeData } = await supabase.from("daily_codes").select("*").eq("gym_id", member.gym_id).eq("date", today).eq("qr_token", decodedText).single();
          if (!codeData) { toast.error("Invalid or expired QR code"); return; }

          await toggleAttendance("qr");
        },
        () => {}
      );
    } catch (err: any) {
      setScanning(false);
      toast.error("Camera access denied or QR scan failed");
    }
  };

  const stopScanning = async () => {
    setScanning(false);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      // The scanner instance is local, so we just set scanning to false
    } catch {}
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
    if (passwordForm.new.length < 6) { toast.error("Min 6 characters"); return; }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordForm.new });
      if (error) throw error;
      toast.success("Password updated!");
      setPasswordForm({ new: "", confirm: "" });
    } catch (err: any) { toast.error(err.message); }
    finally { setChangingPassword(false); }
  };

  const toggleWorkoutDone = async (id: string, isDone: boolean) => {
    await supabase.from("workout_plans").update({ is_done: !isDone }).eq("id", id);
    setWorkouts(workouts.map(w => w.id === id ? { ...w, is_done: !isDone } : w));
  };

  // Save the current user's session tokens so they can switch back without a password
  const saveCurrentSession = async () => {
    if (!user?.email) return;
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (currentSession) {
      const savedSessions = JSON.parse(localStorage.getItem(SAVED_SESSIONS_KEY) || "{}");
      savedSessions[user.email] = {
        access_token: currentSession.access_token,
        refresh_token: currentSession.refresh_token,
      };
      localStorage.setItem(SAVED_SESSIONS_KEY, JSON.stringify(savedSessions));

      const existingAccounts = JSON.parse(localStorage.getItem("saved_accounts") || "[]");
      if (!existingAccounts.includes(user.email)) {
        existingAccounts.push(user.email);
        localStorage.setItem("saved_accounts", JSON.stringify(existingAccounts));
      }
    }
  };

  // Switch directly to a previously saved account without asking for a password
  const handleQuickSwitch = async (email: string) => {
    setSwitching(true);
    try {
      await saveCurrentSession();

      const savedSessions = JSON.parse(localStorage.getItem(SAVED_SESSIONS_KEY) || "{}");
      const savedSession = savedSessions[email];

      if (savedSession) {
        // Restore the target account's session (replaces the current session without invalidating it)
        const { error } = await supabase.auth.setSession({
          access_token: savedSession.access_token,
          refresh_token: savedSession.refresh_token,
        });
        if (!error) {
          toast.success("Switched account!");
          window.location.reload();
          return;
        }
        // Stored session expired — remove it and fall through to password dialog
        const updatedSessions = JSON.parse(localStorage.getItem(SAVED_SESSIONS_KEY) || "{}");
        delete updatedSessions[email];
        localStorage.setItem(SAVED_SESSIONS_KEY, JSON.stringify(updatedSessions));
      }

      // Fallback: pre-fill email and prompt for password
      setSwitchEmail(email);
      setSwitchOpen(true);
    } catch (err: any) { toast.error("Failed to switch accounts. Please try again."); }
    finally { setSwitching(false); }
  };

  const handleSwitchAccount = async () => {
    if (!switchEmail || !switchPassword) { toast.error("Enter credentials"); return; }
    setSwitching(true);
    try {
      // Save current session so the user can switch back later without a password
      await saveCurrentSession();

      // Attempt password sign-in; Supabase will replace the current session if successful
      const { data, error } = await supabase.auth.signInWithPassword({
        email: switchEmail,
        password: switchPassword,
      });
      if (error) throw error;

      // Persist the new account's session for future quick switching
      if (data.session) {
        const savedSessions = JSON.parse(localStorage.getItem(SAVED_SESSIONS_KEY) || "{}");
        savedSessions[switchEmail] = {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        };
        localStorage.setItem(SAVED_SESSIONS_KEY, JSON.stringify(savedSessions));
      }

      const existingAccounts = JSON.parse(localStorage.getItem("saved_accounts") || "[]");
      if (!existingAccounts.includes(switchEmail)) {
        existingAccounts.push(switchEmail);
        localStorage.setItem("saved_accounts", JSON.stringify(existingAccounts));
      }

      toast.success("Switched account!");
      setSwitchOpen(false);
      window.location.reload();
    } catch (err: any) { toast.error(err.message || "Failed to sign in. Please check your credentials."); }
    finally { setSwitching(false); }
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
    { key: "attendance", label: "Attend", icon: Calendar },
    { key: "workout", label: "Workout", icon: Dumbbell },
    { key: "progress", label: "Progress", icon: BarChart3 },
    { key: "profile", label: "Profile", icon: User },
  ];

  const savedAccounts = JSON.parse(localStorage.getItem("saved_accounts") || "[]").filter((e: string) => e !== user?.email);

  return (
    <div className="pb-20 md:pb-0 md:pt-12">
      {tab === "home" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-foreground">Welcome, {member.full_name.split(" ")[0]} 👋</h1>
              <p className="text-sm text-muted-foreground">{gym?.name || "Gym"} · {member.member_code}</p>
            </div>
            <button onClick={() => setSwitchOpen(true)} className="p-2 rounded-lg hover:bg-surface transition-colors" title="Switch Account">
              <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <div className={`${statusBg} rounded-xl p-5 border border-border`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-label">Membership</p>
                <p className={`text-2xl font-bold ${statusColor}`}>
                  {daysLeft !== null ? `${daysLeft} days left` : "No plan"}
                </p>
                {member.due_date && <p className="text-xs text-muted-foreground mt-1">Expires: {new Date(member.due_date).toLocaleDateString()}</p>}
              </div>
              <div className={`w-12 h-12 rounded-full ${statusBg} flex items-center justify-center`}>
                <Tags className={`w-6 h-6 ${statusColor}`} />
              </div>
            </div>
          </div>

          {/* Quick Check-in */}
          <div className="bg-card rounded-xl p-5 shadow-surface">
            <h2 className="text-sm font-medium text-foreground mb-3">Quick Check-in</h2>
            <div className="flex gap-2 mb-3">
              <input type="text" maxLength={6} placeholder="6-digit code" value={dailyCodeInput}
                onChange={(e) => setDailyCodeInput(e.target.value.replace(/\D/g, ""))}
                onKeyDown={(e) => e.key === "Enter" && handleDailyCodeCheckin()}
                className="flex-1 bg-surface rounded-lg px-4 py-3 text-center text-lg font-mono text-foreground placeholder:text-muted-foreground tracking-[0.3em] focus:outline-none focus:ring-1 focus:ring-accent" />
              <button onClick={handleDailyCodeCheckin} disabled={checkingIn}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 min-h-[48px]">
                {checkingIn ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
              </button>
            </div>
            <button onClick={handleQrScan} disabled={scanning}
              className="w-full py-3 bg-accent/10 text-accent rounded-lg text-sm font-medium hover:bg-accent/20 flex items-center justify-center gap-2 min-h-[48px]">
              <QrCode className="w-5 h-5" /> {scanning ? "Scanning..." : "Scan QR Code"}
            </button>
            {scanning && <div id="qr-reader" className="mt-3 rounded-lg overflow-hidden" />}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-card rounded-xl p-4 shadow-surface text-center">
              <Flame className="w-4 h-4 text-amber-400 mx-auto mb-1" />
              <p className="text-xl font-bold text-foreground">{streak}</p>
              <p className="text-xs text-muted-foreground">Streak</p>
            </div>
            <div className="bg-card rounded-xl p-4 shadow-surface text-center">
              <p className="text-xl font-bold text-foreground">{thisMonthAttendance}</p>
              <p className="text-xs text-muted-foreground">This Month</p>
            </div>
            <div className="bg-card rounded-xl p-4 shadow-surface text-center">
              <p className="text-xl font-bold text-foreground">{attendance.length}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </div>

          {/* Notifications */}
          {notifications.length > 0 && (
            <div className="bg-card rounded-xl p-5 shadow-surface">
              <h2 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2"><Bell className="w-4 h-4" /> Notifications</h2>
              <div className="space-y-2">
                {notifications.slice(0, 5).map(n => (
                  <div key={n.id} className="py-2 px-3 rounded-lg bg-surface">
                    <p className="text-sm font-medium text-foreground">{n.notifications?.title}</p>
                    <p className="text-xs text-muted-foreground">{n.notifications?.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(n.notifications?.created_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

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
          <div className="bg-card rounded-xl p-5 shadow-surface">
            <h2 className="text-sm font-medium text-foreground mb-3">Check In</h2>
            <div className="flex gap-2 mb-3">
              <input type="text" maxLength={6} placeholder="6-digit code" value={dailyCodeInput}
                onChange={(e) => setDailyCodeInput(e.target.value.replace(/\D/g, ""))}
                onKeyDown={(e) => e.key === "Enter" && handleDailyCodeCheckin()}
                className="flex-1 bg-surface rounded-lg px-4 py-3 text-center text-lg font-mono text-foreground placeholder:text-muted-foreground tracking-[0.3em] focus:outline-none focus:ring-1 focus:ring-accent" />
              <button onClick={handleDailyCodeCheckin} disabled={checkingIn}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 min-h-[48px]">
                {checkingIn ? <Loader2 className="w-5 h-5 animate-spin" /> : "Go"}
              </button>
            </div>
            <button onClick={handleQrScan} disabled={scanning}
              className="w-full py-3 bg-accent/10 text-accent rounded-lg text-sm font-medium hover:bg-accent/20 flex items-center justify-center gap-2 min-h-[48px]">
              <QrCode className="w-5 h-5" /> {scanning ? "Scanning..." : "Scan QR Code"}
            </button>
            {scanning && <div id="qr-reader" className="mt-3 rounded-lg overflow-hidden" />}
          </div>

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

          <div className="bg-card rounded-xl p-5 shadow-surface">
            <h2 className="text-sm font-medium text-foreground mb-3">History</h2>
            {attendance.length > 0 ? (
              <div className="space-y-2">
                {attendance.slice(0, 30).map(a => (
                  <div key={a.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-surface-raised">
                    <div>
                      <p className="text-sm text-foreground">{new Date(a.check_in).toLocaleDateString()}</p>
                      <p className="text-xs text-muted-foreground">{new Date(a.check_in).toLocaleTimeString()}{a.check_out ? ` → ${new Date(a.check_out).toLocaleTimeString()}` : ""}</p>
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
          <h1 className="text-lg font-semibold text-foreground">Profile</h1>
          <div className="bg-card rounded-xl p-5 shadow-surface space-y-3">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
                {member.full_name.split(" ").map((n: string) => n[0]).join("")}
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">{member.full_name}</p>
                <p className="text-sm text-muted-foreground">{member.member_code} · {gym?.name}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div><p className="text-label">Email</p><p className="text-sm text-foreground">{member.email || "—"}</p></div>
              <div><p className="text-label">Phone</p><p className="text-sm text-foreground">{member.phone || "—"}</p></div>
              <div><p className="text-label">Status</p><p className="text-sm text-foreground capitalize">{member.status}</p></div>
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

          {/* Switch Account */}
          <div className="bg-card rounded-xl p-5 shadow-surface">
            <h2 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2"><ArrowRightLeft className="w-4 h-4" /> Switch Account</h2>
            <p className="text-xs text-muted-foreground mb-3">For family members sharing a device.</p>
            {savedAccounts.length > 0 && (
              <div className="space-y-1 mb-3">
                {savedAccounts.map((email: string) => (
                  <button key={email} onClick={() => handleQuickSwitch(email)} disabled={switching}
                    className="w-full text-left px-3 py-2 rounded-lg bg-surface hover:bg-surface-raised text-sm text-foreground transition-colors flex items-center justify-between disabled:opacity-50">
                    <span>{email}</span>
                    {switching ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowRightLeft className="w-3 h-3 text-muted-foreground" />}
                  </button>
                ))}
              </div>
            )}
            <button onClick={() => { setSwitchEmail(""); setSwitchPassword(""); setSwitchOpen(true); }} className="w-full py-2.5 bg-accent/10 text-accent rounded-lg text-sm font-medium hover:bg-accent/20 min-h-[48px]">
              Switch to Another Account
            </button>
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
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors min-h-[48px] ${tab === key ? "text-primary" : "text-muted-foreground"}`}>
              <Icon className="w-5 h-5" />
              {label}
            </button>
          ))}
        </div>
      </nav>

      {/* Desktop Tab Switcher */}
      <div className="hidden md:flex fixed top-16 right-0 bg-card border-b border-border z-30 px-6" style={{ left: "var(--sidebar-width, 240px)" }}>
        {tabs.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab === key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* Switch Account Dialog */}
      <Dialog open={switchOpen} onOpenChange={setSwitchOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Switch Account</DialogTitle>
            <DialogDescription>Enter credentials to switch to this account.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-label mb-1 block">Email</label>
              <input type="email" className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={switchEmail} onChange={(e) => setSwitchEmail(e.target.value)} placeholder="family@email.com" />
            </div>
            <div>
              <label className="text-label mb-1 block">Password</label>
              <input type="password" className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={switchPassword} onChange={(e) => setSwitchPassword(e.target.value)} placeholder="••••••••" />
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setSwitchOpen(false)} className="px-4 py-2 text-sm text-muted-foreground">Cancel</button>
            <button onClick={handleSwitchAccount} disabled={switching} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2">
              {switching && <Loader2 className="w-4 h-4 animate-spin" />} Switch
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MemberPortal;
