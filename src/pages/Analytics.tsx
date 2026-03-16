import { useEffect, useState } from "react";
import { MetricCard } from "@/components/MetricCard";
import { BarChart3, Users, TrendingUp, Clock, Loader2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { supabase } from "@/integrations/supabase/client";

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [totalMembers, setTotalMembers] = useState(0);
  const [activeMembers, setActiveMembers] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [peakHours, setPeakHours] = useState<{ hour: string; members: number }[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<{ month: string; revenue: number }[]>([]);
  const [trainerPerformance, setTrainerPerformance] = useState<{ name: string; members: number }[]>([]);
  const [planBreakdown, setPlanBreakdown] = useState<{ plan: string; members: number; revenue: number }[]>([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      const [membersRes, activeRes, paymentsRes, attendanceRes, trainersRes, plansRes, memberPlansRes] = await Promise.all([
        supabase.from("members").select("*", { count: "exact", head: true }),
        supabase.from("members").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("payments").select("amount, payment_date, status").eq("status", "completed"),
        supabase.from("attendance").select("check_in"),
        supabase.from("trainers").select("id, full_name"),
        supabase.from("plans").select("id, name, price"),
        supabase.from("members").select("plan_id, trainer_id"),
      ]);

      setTotalMembers(membersRes.count || 0);
      setActiveMembers(activeRes.count || 0);

      const payments = paymentsRes.data || [];
      const rev = payments.reduce((s, p) => s + Number(p.amount), 0);
      setTotalRevenue(rev);

      // Monthly revenue (last 6 months)
      const monthMap: Record<string, number> = {};
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        monthMap[key] = 0;
      }
      payments.forEach(p => {
        const key = p.payment_date.substring(0, 7);
        if (key in monthMap) monthMap[key] += Number(p.amount);
      });
      setMonthlyRevenue(Object.entries(monthMap).map(([k, v]) => ({
        month: monthNames[parseInt(k.split("-")[1]) - 1],
        revenue: v,
      })));

      // Peak hours from attendance
      const hourMap: Record<number, number> = {};
      (attendanceRes.data || []).forEach(a => {
        const h = new Date(a.check_in).getHours();
        hourMap[h] = (hourMap[h] || 0) + 1;
      });
      const hours = [];
      for (let h = 6; h <= 22; h++) {
        const label = h < 12 ? `${h}AM` : h === 12 ? "12PM" : `${h - 12}PM`;
        hours.push({ hour: label, members: hourMap[h] || 0 });
      }
      setPeakHours(hours);

      // Trainer performance (member count per trainer)
      const trainerMap: Record<string, number> = {};
      (memberPlansRes.data || []).forEach(m => {
        if (m.trainer_id) trainerMap[m.trainer_id] = (trainerMap[m.trainer_id] || 0) + 1;
      });
      const trainers = (trainersRes.data || []).map(t => ({
        name: t.full_name, members: trainerMap[t.id] || 0,
      })).sort((a, b) => b.members - a.members).slice(0, 5);
      setTrainerPerformance(trainers);

      // Plan breakdown
      const planMap: Record<string, number> = {};
      (memberPlansRes.data || []).forEach(m => {
        if (m.plan_id) planMap[m.plan_id] = (planMap[m.plan_id] || 0) + 1;
      });
      const plansList = (plansRes.data || []).map(p => ({
        plan: p.name, members: planMap[p.id] || 0, revenue: (planMap[p.id] || 0) * Number(p.price),
      })).sort((a, b) => b.revenue - a.revenue);
      setPlanBreakdown(plansList);

      setLoading(false);
    };
    fetchAnalytics();
  }, []);

  const retentionRate = totalMembers > 0 ? ((activeMembers / totalMembers) * 100).toFixed(1) : "0";
  const churnRate = totalMembers > 0 ? (100 - (activeMembers / totalMembers) * 100).toFixed(1) : "0";
  const peakHour = peakHours.length > 0 ? peakHours.reduce((a, b) => a.members > b.members ? a : b).hour : "—";

  const formatCurrency = (n: number) => {
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
    if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
    return `₹${n}`;
  };

  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Business Analytics</h1>
        <p className="text-sm text-muted-foreground">Performance insights from real data</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Churn Rate" value={`${churnRate}%`} icon={<TrendingUp className="w-4 h-4" />} />
        <MetricCard label="Retention Rate" value={`${retentionRate}%`} icon={<Users className="w-4 h-4" />} />
        <MetricCard label="Peak Hour" value={peakHour} icon={<Clock className="w-4 h-4" />} />
        <MetricCard label="Total Revenue" value={formatCurrency(totalRevenue)} icon={<BarChart3 className="w-4 h-4" />} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Monthly Revenue */}
        <div className="bg-card rounded-xl p-5 shadow-surface">
          <h2 className="text-sm font-medium text-foreground mb-4">Monthly Revenue Trend</h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthlyRevenue}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 12%)" />
              <XAxis dataKey="month" tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v >= 1000 ? `${(v/1000).toFixed(0)}K` : v}`} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(222, 47%, 7%)", border: "1px solid hsl(222, 30%, 12%)", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, "Revenue"]} />
              <Area type="monotone" dataKey="revenue" stroke="hsl(142, 71%, 45%)" fill="url(#revGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Peak Hours */}
        <div className="bg-card rounded-xl p-5 shadow-surface">
          <h2 className="text-sm font-medium text-foreground mb-4">Peak Hours Analysis</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={peakHours}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 12%)" />
              <XAxis dataKey="hour" tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 10 }} axisLine={false} tickLine={false} interval={1} />
              <YAxis tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(222, 47%, 7%)", border: "1px solid hsl(222, 30%, 12%)", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="members" fill="hsl(217, 91%, 60%)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Trainer Performance */}
        <div className="bg-card rounded-xl p-5 shadow-surface">
          <h2 className="text-sm font-medium text-foreground mb-4">Trainer Performance</h2>
          <div className="space-y-3">
            {trainerPerformance.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No trainers with assigned members yet</p>}
            {trainerPerformance.map((t) => (
              <div key={t.name} className="flex items-center justify-between py-3 px-3 rounded-lg bg-surface">
                <div>
                  <p className="text-sm text-foreground font-medium">{t.name}</p>
                </div>
                <div className="text-center">
                  <p className="text-foreground font-medium text-sm">{t.members}</p>
                  <p className="text-xs text-muted-foreground">Members</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Plan Profitability */}
        <div className="bg-card rounded-xl p-5 shadow-surface">
          <h2 className="text-sm font-medium text-foreground mb-4">Plan Revenue Breakdown</h2>
          <div className="space-y-3">
            {planBreakdown.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No plans with subscribers yet</p>}
            {planBreakdown.map((p, i) => (
              <div key={p.plan} className="flex items-center justify-between py-3 px-3 rounded-lg bg-surface">
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-primary/20 text-primary" : "bg-accent/20 text-accent"}`}>{i + 1}</span>
                  <div>
                    <p className="text-sm text-foreground font-medium">{p.plan}</p>
                    <p className="text-xs text-muted-foreground">{p.members} members</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-foreground font-medium">{formatCurrency(p.revenue)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
