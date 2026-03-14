import { MetricCard } from "@/components/MetricCard";
import { BarChart3, Users, TrendingUp, Clock } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, Radar } from "recharts";

const churnData = [
  { month: "Sep", rate: 6.2 },
  { month: "Oct", rate: 5.8 },
  { month: "Nov", rate: 5.1 },
  { month: "Dec", rate: 5.5 },
  { month: "Jan", rate: 4.8 },
  { month: "Feb", rate: 4.5 },
  { month: "Mar", rate: 4.2 },
];

const peakHours = [
  { hour: "6AM", members: 12 },
  { hour: "7AM", members: 28 },
  { hour: "8AM", members: 35 },
  { hour: "9AM", members: 42 },
  { hour: "10AM", members: 30 },
  { hour: "11AM", members: 18 },
  { hour: "12PM", members: 15 },
  { hour: "1PM", members: 10 },
  { hour: "2PM", members: 8 },
  { hour: "3PM", members: 12 },
  { hour: "4PM", members: 22 },
  { hour: "5PM", members: 38 },
  { hour: "6PM", members: 55 },
  { hour: "7PM", members: 48 },
  { hour: "8PM", members: 35 },
  { hour: "9PM", members: 20 },
  { hour: "10PM", members: 8 },
];

const trainerPerformance = [
  { name: "Coach Raj", members: 45, retention: 92, satisfaction: 4.8, sessions: 120 },
  { name: "Coach Neha", members: 38, retention: 88, satisfaction: 4.6, sessions: 105 },
  { name: "Coach Arjun", members: 30, retention: 85, satisfaction: 4.4, sessions: 90 },
];

const planProfitability = [
  { plan: "Premium", revenue: 280000, members: 80, perMember: 3500 },
  { plan: "Basic", revenue: 120000, members: 80, perMember: 1500 },
  { plan: "Student", revenue: 48000, members: 60, perMember: 800 },
];

const Analytics = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Business Analytics</h1>
        <p className="text-sm text-muted-foreground">Performance insights & trends</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Churn Rate" value="4.2%" change="-0.3%" changeType="positive" icon={<TrendingUp className="w-4 h-4" />} />
        <MetricCard label="Retention Rate" value="95.8%" icon={<Users className="w-4 h-4" />} />
        <MetricCard label="Peak Hour" value="6–7 PM" icon={<Clock className="w-4 h-4" />} />
        <MetricCard label="Revenue Growth" value="+8.2%" changeType="positive" icon={<BarChart3 className="w-4 h-4" />} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Churn Rate Trend */}
        <div className="bg-card rounded-xl p-5 shadow-surface">
          <h2 className="text-sm font-medium text-foreground mb-4">Member Churn Rate Trend</h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={churnData}>
              <defs>
                <linearGradient id="churnGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 12%)" />
              <XAxis dataKey="month" tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} domain={[0, 8]} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(222, 47%, 7%)", border: "1px solid hsl(222, 30%, 12%)", borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="rate" stroke="hsl(0, 72%, 51%)" fill="url(#churnGrad)" strokeWidth={2} />
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

      {/* Trainer Performance & Plan Profitability */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl p-5 shadow-surface">
          <h2 className="text-sm font-medium text-foreground mb-4">Trainer Performance</h2>
          <div className="space-y-3">
            {trainerPerformance.map((t) => (
              <div key={t.name} className="flex items-center justify-between py-3 px-3 rounded-lg bg-surface">
                <div>
                  <p className="text-sm text-foreground font-medium">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.members} members · {t.sessions} sessions/mo</p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="text-center">
                    <p className="text-foreground font-medium">{t.retention}%</p>
                    <p className="text-muted-foreground">Retention</p>
                  </div>
                  <div className="text-center">
                    <p className="text-foreground font-medium">{t.satisfaction}</p>
                    <p className="text-muted-foreground">Rating</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-xl p-5 shadow-surface">
          <h2 className="text-sm font-medium text-foreground mb-4">Most Profitable Plans</h2>
          <div className="space-y-3">
            {planProfitability.map((p, i) => (
              <div key={p.plan} className="flex items-center justify-between py-3 px-3 rounded-lg bg-surface">
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                    i === 0 ? "bg-primary/20 text-primary" : i === 1 ? "bg-accent/20 text-accent" : "bg-amber/20 text-amber"
                  }`}>
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm text-foreground font-medium">{p.plan}</p>
                    <p className="text-xs text-muted-foreground">{p.members} members</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-foreground font-medium">₹{(p.revenue / 1000).toFixed(0)}k</p>
                  <p className="text-xs text-muted-foreground">₹{p.perMember}/member</p>
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
