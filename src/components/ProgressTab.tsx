import { useState, useEffect, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Target, TrendingUp, Award, Flame, ChevronDown, ChevronUp,
  Dumbbell, BarChart3, Ruler, Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProgressLog {
  id: string;
  log_type: string;
  value: number;
  unit: string;
  logged_at: string;
  notes?: string;
}

interface ProgressTabProps {
  memberId: string;
  gymId: string;
  initialLogs: ProgressLog[];
  totalWorkouts: number;
}

// ─── Colour tokens (matching design spec) ────────────────────────────────────

const GREEN = "#00ff88";
const NAVY_BG = "#0a0f1e";
const CARD_BG = "#1a2235";
const MUTED = "#4a5568";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function bmi(weight: number, heightCm: number) {
  if (!heightCm) return 0;
  return weight / Math.pow(heightCm / 100, 2);
}

function last30Days(): string[] {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().split("T")[0];
  });
}

function buildChartData(logs: ProgressLog[], days: string[]) {
  const map = new Map<string, number>();
  logs.forEach(l => {
    const day = l.logged_at.split("T")[0];
    if (!map.has(day)) map.set(day, l.value);
  });
  return days
    .filter(d => map.has(d))
    .map(d => ({ date: d.slice(5), weight: map.get(d)! }));
}

function calcStreak(logs: ProgressLog[]): number {
  const days = [...new Set(logs.map(l => l.logged_at.split("T")[0]))].sort().reverse();
  let streak = 0;
  for (let i = 0; i < days.length; i++) {
    const expected = new Date();
    expected.setDate(expected.getDate() - i);
    if (days[i] === expected.toISOString().split("T")[0]) streak++;
    else break;
  }
  return streak;
}

function consistencyScore(logs: ProgressLog[], workouts: number): number {
  const uniqueDays = new Set(logs.map(l => l.logged_at.split("T")[0])).size;
  return Math.min(100, Math.round(((uniqueDays + workouts) / 60) * 100));
}

function bmiCategory(b: number): string {
  if (b < 18.5) return "Underweight";
  if (b < 25) return "Normal";
  if (b < 30) return "Overweight";
  return "Obese";
}

function handleError(e: unknown, fallback = "Failed to save") {
  toast.error(e instanceof Error ? e.message : fallback);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface GoalRingProps { pct: number }
function GoalRing({ pct }: GoalRingProps) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const dash = circ * Math.min(pct, 1);
  return (
    <svg width={128} height={128} viewBox="0 0 128 128">
      <circle cx={64} cy={64} r={r} fill="none" stroke={MUTED} strokeWidth={10} />
      <circle
        cx={64} cy={64} r={r} fill="none"
        stroke={GREEN} strokeWidth={10}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 64 64)"
        style={{ transition: "stroke-dasharray 0.8s ease" }}
      />
      <text x={64} y={60} textAnchor="middle" fill={GREEN} fontSize={22} fontWeight={700}>
        {Math.round(pct * 100)}%
      </text>
      <text x={64} y={78} textAnchor="middle" fill="#94a3b8" fontSize={11}>
        achieved
      </text>
    </svg>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ProgressTab({ memberId, gymId, initialLogs, totalWorkouts }: ProgressTabProps) {
  // All logs (weight + measurements + PRs)
  const [logs, setLogs] = useState<ProgressLog[]>(initialLogs);

  // ── Body Metrics state ──
  const [weight, setWeight] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [muscleMass, setMuscleMass] = useState("");
  const [savingMetrics, setSavingMetrics] = useState(false);

  // ── Chart toggle ──
  type ChartView = "weekly" | "monthly" | "yearly";
  const [chartView, setChartView] = useState<ChartView>("monthly");

  // ── Personal Records state ──
  const [prBench, setPrBench] = useState("");
  const [prSquat, setPrSquat] = useState("");
  const [prDeadlift, setPrDeadlift] = useState("");
  const [savingPR, setSavingPR] = useState(false);

  // ── Goal Tracker state ──
  const [targetWeight, setTargetWeight] = useState("");

  // ── Body Measurements state ──
  const [measOpen, setMeasOpen] = useState(false);
  const [chest, setChest] = useState("");
  const [waist, setWaist] = useState("");
  const [hips, setHips] = useState("");
  const [arms, setArms] = useState("");
  const [savingMeas, setSavingMeas] = useState(false);

  // Re-sync when parent refreshes
  useEffect(() => { setLogs(initialLogs); }, [initialLogs]);

  // Derived data
  const weightLogs = logs.filter(l => l.log_type === "weight").sort(
    (a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime()
  );
  const latestWeight = weightLogs[weightLogs.length - 1]?.value ?? null;
  const latestBodyFat = logs.filter(l => l.log_type === "body_fat").sort(
    (a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime()
  )[0]?.value ?? null;
  const latestMuscleMass = logs.filter(l => l.log_type === "muscle_mass").sort(
    (a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime()
  )[0]?.value ?? null;

  const latestPRs = {
    bench: logs.filter(l => l.log_type === "pr_bench").sort(
      (a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime()
    )[0],
    squat: logs.filter(l => l.log_type === "pr_squat").sort(
      (a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime()
    )[0],
    deadlift: logs.filter(l => l.log_type === "pr_deadlift").sort(
      (a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime()
    )[0],
  };

  const latestMeas = {
    chest: logs.filter(l => l.log_type === "meas_chest").sort(
      (a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime()
    )[0],
    waist: logs.filter(l => l.log_type === "meas_waist").sort(
      (a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime()
    )[0],
    hips: logs.filter(l => l.log_type === "meas_hips").sort(
      (a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime()
    )[0],
    arms: logs.filter(l => l.log_type === "meas_arms").sort(
      (a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime()
    )[0],
  };

  // Chart data
  const days30 = last30Days();
  const chartDataMonthly = buildChartData(weightLogs, days30);

  const chartDataWeekly = buildChartData(
    weightLogs,
    Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split("T")[0];
    })
  );

  const chartDataYearly = (() => {
    const months: Record<string, number[]> = {};
    weightLogs.forEach(l => {
      const m = l.logged_at.slice(0, 7);
      if (!months[m]) months[m] = [];
      months[m].push(l.value);
    });
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([m, vals]) => ({
        date: m.slice(5),
        weight: Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10,
      }));
  })();

  const chartData =
    chartView === "weekly" ? chartDataWeekly
      : chartView === "yearly" ? chartDataYearly
        : chartDataMonthly;

  // Streak / badges
  const streak = calcStreak(weightLogs);
  const firstWeight = weightLogs[0]?.value ?? null;
  const kgLost = firstWeight && latestWeight ? Math.max(0, Math.round((firstWeight - latestWeight) * 10) / 10) : 0;
  const badges = [
    { label: "First Log", earned: weightLogs.length > 0, emoji: "🌱" },
    { label: "5kg Lost", earned: kgLost >= 5, emoji: "🔥" },
    { label: "10 Workouts", earned: totalWorkouts >= 10, emoji: "💪" },
    { label: "30 Day Streak", earned: streak >= 30, emoji: "🏆" },
    { label: "7 Day Streak", earned: streak >= 7, emoji: "⚡" },
    { label: "PR Setter", earned: !!(latestPRs.bench || latestPRs.squat || latestPRs.deadlift), emoji: "🎯" },
  ];

  // Goal tracker
  const targetW = parseFloat(targetWeight);
  const startW = firstWeight ?? latestWeight ?? null;
  const currentW = latestWeight;
  const goalPct = targetW && startW !== null && currentW !== null && startW !== targetW
    ? Math.abs(startW - currentW) / Math.abs(startW - targetW)
    : 0;
  const kgRemaining = targetW && currentW !== null ? Math.abs(targetW - currentW) : null;

  // Avg weekly weight change
  const avgWeeklyChange = (() => {
    if (weightLogs.length < 2) return null;
    const first = weightLogs[0];
    const last = weightLogs[weightLogs.length - 1];
    const weeks = Math.max(1, (new Date(last.logged_at).getTime() - new Date(first.logged_at).getTime()) / (7 * 86400000));
    return Math.round(((last.value - first.value) / weeks) * 100) / 100;
  })();

  const consistency = consistencyScore(weightLogs, totalWorkouts);

  // ── Actions ──────────────────────────────────────────────────────────────────

  const refreshLogs = useCallback(async () => {
    const { data } = await supabase
      .from("progress_logs")
      .select("*")
      .eq("member_id", memberId)
      .order("logged_at", { ascending: false })
      .limit(200);
    setLogs(data || []);
  }, [memberId]);

  const insertLog = async (type: string, value: number, unit: string) => {
    await supabase.from("progress_logs").insert({
      member_id: memberId, gym_id: gymId,
      log_type: type, value, unit,
    });
  };

  const handleLogMetrics = async () => {
    if (!weight && !bodyFat && !muscleMass) {
      toast.error("Enter at least one metric"); return;
    }
    setSavingMetrics(true);
    try {
      const inserts: Promise<void>[] = [];
      if (weight) inserts.push(insertLog("weight", parseFloat(weight), "kg"));
      if (bodyFat) inserts.push(insertLog("body_fat", parseFloat(bodyFat), "%"));
      if (muscleMass) inserts.push(insertLog("muscle_mass", parseFloat(muscleMass), "kg"));
      await Promise.all(inserts);
      toast.success("Metrics logged!");
      setWeight(""); setBodyFat(""); setMuscleMass("");
      await refreshLogs();
    } catch (e) { handleError(e); }
    finally { setSavingMetrics(false); }
  };

  const handleLogPR = async () => {
    if (!prBench && !prSquat && !prDeadlift) {
      toast.error("Enter at least one PR"); return;
    }
    setSavingPR(true);
    try {
      const inserts: Promise<void>[] = [];
      if (prBench) inserts.push(insertLog("pr_bench", parseFloat(prBench), "kg"));
      if (prSquat) inserts.push(insertLog("pr_squat", parseFloat(prSquat), "kg"));
      if (prDeadlift) inserts.push(insertLog("pr_deadlift", parseFloat(prDeadlift), "kg"));
      await Promise.all(inserts);
      toast.success("Personal records saved!");
      setPrBench(""); setPrSquat(""); setPrDeadlift("");
      await refreshLogs();
    } catch (e) { handleError(e); }
    finally { setSavingPR(false); }
  };

  const handleLogMeasurements = async () => {
    if (!chest && !waist && !hips && !arms) {
      toast.error("Enter at least one measurement"); return;
    }
    setSavingMeas(true);
    try {
      const inserts: Promise<void>[] = [];
      if (chest) inserts.push(insertLog("meas_chest", parseFloat(chest), "cm"));
      if (waist) inserts.push(insertLog("meas_waist", parseFloat(waist), "cm"));
      if (hips) inserts.push(insertLog("meas_hips", parseFloat(hips), "cm"));
      if (arms) inserts.push(insertLog("meas_arms", parseFloat(arms), "cm"));
      await Promise.all(inserts);
      toast.success("Measurements saved!");
      setChest(""); setWaist(""); setHips(""); setArms("");
      await refreshLogs();
    } catch (e) { handleError(e); }
    finally { setSavingMeas(false); }
  };

  // ── BMI display ──
  const bmiVal = latestWeight && heightCm ? bmi(latestWeight, parseFloat(heightCm)) : null;
  const inputBmiVal = weight && heightCm ? bmi(parseFloat(weight), parseFloat(heightCm)) : null;
  const displayBmi = inputBmiVal ?? bmiVal;

  // ── Styles ────────────────────────────────────────────────────────────────────

  const card = "rounded-2xl p-4 shadow-surface-md";
  const input = "w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00ff88]/50";
  const label = "block text-xs font-medium mb-1 uppercase tracking-wide";

  return (
    <div
      className="space-y-4 pb-6 animate-fadeIn"
      style={{ color: "#e2e8f0" }}
    >
      {/* ── 1. Body Metrics Panel ────────────────────────────────────────────── */}
      <section className={card} style={{ background: CARD_BG }}>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={18} style={{ color: GREEN }} />
          <h2 className="text-sm font-semibold">Body Metrics</h2>
        </div>

        {/* Current snapshot */}
        {(latestWeight || latestBodyFat || latestMuscleMass) && (
          <div className="grid grid-cols-2 gap-2 mb-4">
            {latestWeight !== null && (
              <div className="rounded-xl p-3 text-center" style={{ background: NAVY_BG }}>
                <p className="text-2xl font-bold" style={{ color: GREEN }}>{latestWeight}</p>
                <p className="text-xs" style={{ color: MUTED }}>kg</p>
              </div>
            )}
            {latestBodyFat !== null && (
              <div className="rounded-xl p-3 text-center" style={{ background: NAVY_BG }}>
                <p className="text-2xl font-bold" style={{ color: GREEN }}>{latestBodyFat}%</p>
                <p className="text-xs" style={{ color: MUTED }}>Body Fat</p>
              </div>
            )}
            {latestMuscleMass !== null && (
              <div className="rounded-xl p-3 text-center" style={{ background: NAVY_BG }}>
                <p className="text-2xl font-bold" style={{ color: GREEN }}>{latestMuscleMass}</p>
                <p className="text-xs" style={{ color: MUTED }}>Muscle kg</p>
              </div>
            )}
            {displayBmi !== null && (
              <div className="rounded-xl p-3 text-center" style={{ background: NAVY_BG }}>
                <p className="text-2xl font-bold" style={{ color: GREEN }}>{displayBmi.toFixed(1)}</p>
                <p className="text-xs" style={{ color: MUTED }}>BMI</p>
              </div>
            )}
          </div>
        )}

        {/* Input fields */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <label className={label} style={{ color: MUTED }}>Weight (kg)</label>
            <input
              type="number" placeholder="75" value={weight}
              onChange={e => setWeight(e.target.value)}
              className={input}
              style={{ background: NAVY_BG, color: "#e2e8f0", borderColor: "transparent" }}
            />
          </div>
          <div>
            <label className={label} style={{ color: MUTED }}>Body Fat (%)</label>
            <input
              type="number" placeholder="18" value={bodyFat}
              onChange={e => setBodyFat(e.target.value)}
              className={input}
              style={{ background: NAVY_BG, color: "#e2e8f0", borderColor: "transparent" }}
            />
          </div>
          <div>
            <label className={label} style={{ color: MUTED }}>Height (cm) — for BMI</label>
            <input
              type="number" placeholder="175" value={heightCm}
              onChange={e => setHeightCm(e.target.value)}
              className={input}
              style={{ background: NAVY_BG, color: "#e2e8f0", borderColor: "transparent" }}
            />
          </div>
          <div>
            <label className={label} style={{ color: MUTED }}>Muscle Mass (kg)</label>
            <input
              type="number" placeholder="60" value={muscleMass}
              onChange={e => setMuscleMass(e.target.value)}
              className={input}
              style={{ background: NAVY_BG, color: "#e2e8f0", borderColor: "transparent" }}
            />
          </div>
        </div>

        {/* BMI live calc hint */}
        {inputBmiVal !== null && (
          <p className="text-xs mb-3" style={{ color: GREEN }}>
            BMI: {inputBmiVal.toFixed(1)} — {bmiCategory(inputBmiVal)}
          </p>
        )}

        <button
          onClick={handleLogMetrics}
          disabled={savingMetrics}
          className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
          style={{ background: GREEN, color: NAVY_BG }}
        >
          {savingMetrics ? <Loader2 size={16} className="animate-spin" /> : null}
          Log Metrics
        </button>
      </section>

      {/* ── 2. Progress Charts ───────────────────────────────────────────────── */}
      <section className={card} style={{ background: CARD_BG }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BarChart3 size={18} style={{ color: GREEN }} />
            <h2 className="text-sm font-semibold">Weight Progress</h2>
          </div>
          {/* Toggle */}
          <div className="flex gap-1 rounded-lg p-0.5" style={{ background: NAVY_BG }}>
            {(["weekly", "monthly", "yearly"] as ChartView[]).map(v => (
              <button
                key={v}
                onClick={() => setChartView(v)}
                className="px-2 py-1 rounded-md text-xs font-medium capitalize transition-colors"
                style={{
                  background: chartView === v ? GREEN : "transparent",
                  color: chartView === v ? NAVY_BG : "#94a3b8",
                }}
              >
                {v === "weekly" ? "7D" : v === "monthly" ? "30D" : "1Y"}
              </button>
            ))}
          </div>
        </div>

        {chartData.length > 1 ? (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="#1e2d45" strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fill: "#4a5568", fontSize: 10 }} />
              <YAxis tick={{ fill: "#4a5568", fontSize: 10 }} domain={["auto", "auto"]} />
              <Tooltip
                contentStyle={{ background: CARD_BG, border: "none", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "#94a3b8" }}
                itemStyle={{ color: GREEN }}
              />
              <Line
                type="monotone" dataKey="weight"
                stroke={GREEN} strokeWidth={2}
                dot={{ fill: GREEN, r: 3 }}
                activeDot={{ r: 5, fill: GREEN }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-40 flex items-center justify-center text-sm" style={{ color: MUTED }}>
            Log at least 2 entries to see the chart
          </div>
        )}
      </section>

      {/* ── 3. Personal Records ──────────────────────────────────────────────── */}
      <section className={card} style={{ background: CARD_BG }}>
        <div className="flex items-center gap-2 mb-4">
          <Dumbbell size={18} style={{ color: GREEN }} />
          <h2 className="text-sm font-semibold">Personal Records</h2>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {([
            { key: "bench", pr: latestPRs.bench, label: "Bench" },
            { key: "squat", pr: latestPRs.squat, label: "Squat" },
            { key: "deadlift", pr: latestPRs.deadlift, label: "Deadlift" },
          ] as const).map(({ label: lbl, pr }) => (
            <div key={lbl} className="rounded-xl p-3 text-center" style={{ background: NAVY_BG }}>
              <p className="text-lg font-bold" style={{ color: GREEN }}>
                {pr ? `${pr.value}kg` : "—"}
              </p>
              <p className="text-xs font-medium" style={{ color: "#94a3b8" }}>{lbl}</p>
              {pr && (
                <p className="text-[10px] mt-0.5" style={{ color: MUTED }}>
                  {new Date(pr.logged_at).toLocaleDateString()}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Input new PRs */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div>
            <label className={label} style={{ color: MUTED }}>Bench</label>
            <input type="number" placeholder="100" value={prBench}
              onChange={e => setPrBench(e.target.value)}
              className={input}
              style={{ background: NAVY_BG, color: "#e2e8f0" }}
            />
          </div>
          <div>
            <label className={label} style={{ color: MUTED }}>Squat</label>
            <input type="number" placeholder="120" value={prSquat}
              onChange={e => setPrSquat(e.target.value)}
              className={input}
              style={{ background: NAVY_BG, color: "#e2e8f0" }}
            />
          </div>
          <div>
            <label className={label} style={{ color: MUTED }}>Deadlift</label>
            <input type="number" placeholder="150" value={prDeadlift}
              onChange={e => setPrDeadlift(e.target.value)}
              className={input}
              style={{ background: NAVY_BG, color: "#e2e8f0" }}
            />
          </div>
        </div>
        <button
          onClick={handleLogPR}
          disabled={savingPR}
          className="w-full py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
          style={{ background: GREEN, color: NAVY_BG }}
        >
          {savingPR ? <Loader2 size={14} className="animate-spin" /> : null}
          Save PRs
        </button>
      </section>

      {/* ── 4. Goal Tracker ─────────────────────────────────────────────────── */}
      <section className={card} style={{ background: CARD_BG }}>
        <div className="flex items-center gap-2 mb-4">
          <Target size={18} style={{ color: GREEN }} />
          <h2 className="text-sm font-semibold">Goal Tracker</h2>
        </div>

        <div className="flex items-center gap-4">
          <GoalRing pct={goalPct} />
          <div className="flex-1 space-y-3">
            <div>
              <label className={label} style={{ color: MUTED }}>Target Weight (kg)</label>
              <input
                type="number" placeholder="70" value={targetWeight}
                onChange={e => setTargetWeight(e.target.value)}
                className={input}
                style={{ background: NAVY_BG, color: "#e2e8f0" }}
              />
            </div>
            {latestWeight && targetWeight && (
              <div className="space-y-1">
                <p className="text-xs" style={{ color: MUTED }}>
                  Current: <span style={{ color: "#e2e8f0" }}>{latestWeight} kg</span>
                </p>
                {kgRemaining !== null && (
                  <p className="text-xs" style={{ color: MUTED }}>
                    Remaining: <span style={{ color: GREEN }}>{kgRemaining.toFixed(1)} kg</span>
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── 5. Streak & Badges ──────────────────────────────────────────────── */}
      <section className={card} style={{ background: CARD_BG }}>
        <div className="flex items-center gap-2 mb-4">
          <Flame size={18} style={{ color: GREEN }} />
          <h2 className="text-sm font-semibold">Streak & Badges</h2>
        </div>

        {/* Streak counter */}
        <div className="flex items-center gap-3 mb-4 p-3 rounded-xl" style={{ background: NAVY_BG }}>
          <span className="text-3xl">🔥</span>
          <div>
            <p className="text-2xl font-bold" style={{ color: GREEN }}>{streak}</p>
            <p className="text-xs" style={{ color: MUTED }}>day logging streak</p>
          </div>
        </div>

        {/* Badges */}
        <div className="grid grid-cols-3 gap-2">
          {badges.map(b => (
            <div
              key={b.label}
              className="rounded-xl p-2 text-center transition-opacity"
              style={{
                background: NAVY_BG,
                opacity: b.earned ? 1 : 0.35,
                border: b.earned ? `1px solid ${GREEN}30` : "1px solid transparent",
              }}
            >
              <div className="text-2xl mb-1">{b.emoji}</div>
              <p className="text-[10px] font-medium leading-tight" style={{ color: b.earned ? "#e2e8f0" : MUTED }}>
                {b.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 6. Body Measurements ────────────────────────────────────────────── */}
      <section className={card} style={{ background: CARD_BG }}>
        <button
          className="w-full flex items-center justify-between"
          onClick={() => setMeasOpen(o => !o)}
        >
          <div className="flex items-center gap-2">
            <Ruler size={18} style={{ color: GREEN }} />
            <h2 className="text-sm font-semibold">Body Measurements</h2>
          </div>
          {measOpen ? <ChevronUp size={16} style={{ color: MUTED }} /> : <ChevronDown size={16} style={{ color: MUTED }} />}
        </button>

        {measOpen && (
          <div className="mt-4 space-y-3">
            {/* Latest values */}
            {(latestMeas.chest || latestMeas.waist || latestMeas.hips || latestMeas.arms) && (
              <div className="grid grid-cols-4 gap-2 mb-3">
                {([
                  { key: "chest", m: latestMeas.chest },
                  { key: "waist", m: latestMeas.waist },
                  { key: "hips", m: latestMeas.hips },
                  { key: "arms", m: latestMeas.arms },
                ] as const).map(({ key, m }) => (
                  <div key={key} className="rounded-xl p-2 text-center" style={{ background: NAVY_BG }}>
                    <p className="text-sm font-bold" style={{ color: GREEN }}>{m ? m.value : "—"}</p>
                    <p className="text-[10px] capitalize" style={{ color: MUTED }}>{key}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              {(["chest", "waist", "hips", "arms"] as const).map(key => (
                <div key={key}>
                  <label className={label} style={{ color: MUTED }}>{key.charAt(0).toUpperCase() + key.slice(1)} (cm)</label>
                  <input
                    type="number" placeholder="—"
                    value={{ chest, waist, hips, arms }[key]}
                    onChange={e => {
                      const val = e.target.value;
                      if (key === "chest") setChest(val);
                      else if (key === "waist") setWaist(val);
                      else if (key === "hips") setHips(val);
                      else setArms(val);
                    }}
                    className={input}
                    style={{ background: NAVY_BG, color: "#e2e8f0" }}
                  />
                </div>
              ))}
            </div>
            <button
              onClick={handleLogMeasurements}
              disabled={savingMeas}
              className="w-full py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
              style={{ background: GREEN, color: NAVY_BG }}
            >
              {savingMeas ? <Loader2 size={14} className="animate-spin" /> : null}
              Save Measurements
            </button>
          </div>
        )}
      </section>

      {/* ── 7. Stats Summary ────────────────────────────────────────────────── */}
      <section className={card} style={{ background: CARD_BG }}>
        <div className="flex items-center gap-2 mb-4">
          <Award size={18} style={{ color: GREEN }} />
          <h2 className="text-sm font-semibold">Stats Summary</h2>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl p-3 text-center" style={{ background: NAVY_BG }}>
            <p className="text-xl font-bold" style={{ color: GREEN }}>{totalWorkouts}</p>
            <p className="text-[10px] mt-0.5" style={{ color: MUTED }}>Total<br />Workouts</p>
          </div>
          <div className="rounded-xl p-3 text-center" style={{ background: NAVY_BG }}>
            <p className="text-xl font-bold" style={{ color: GREEN }}>
              {avgWeeklyChange !== null
                ? `${avgWeeklyChange > 0 ? "+" : ""}${avgWeeklyChange}kg`
                : "—"}
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: MUTED }}>Avg / Week</p>
          </div>
          <div className="rounded-xl p-3 text-center" style={{ background: NAVY_BG }}>
            <p className="text-xl font-bold" style={{ color: GREEN }}>{consistency}%</p>
            <p className="text-[10px] mt-0.5" style={{ color: MUTED }}>Consistency</p>
          </div>
        </div>
      </section>
    </div>
  );
}
