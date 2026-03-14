import { MetricCard } from "@/components/MetricCard";
import { DataTable } from "@/components/DataTable";
import { StatusDot } from "@/components/StatusDot";
import { Users, DollarSign, Dumbbell, TrendingUp, AlertTriangle, Clock } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const revenueData = [
  { month: "Aug", revenue: 42000, expenses: 28000 },
  { month: "Sep", revenue: 45000, expenses: 29000 },
  { month: "Oct", revenue: 48000, expenses: 27000 },
  { month: "Nov", revenue: 51000, expenses: 31000 },
  { month: "Dec", revenue: 53000, expenses: 30000 },
  { month: "Jan", revenue: 49000, expenses: 32000 },
  { month: "Feb", revenue: 55000, expenses: 29000 },
  { month: "Mar", revenue: 58000, expenses: 31000 },
];

const recentMembers = [
  { name: "Arjun Patel", plan: "Premium", status: "active", joined: "2026-03-12", gymName: "HQ" },
  { name: "Priya Sharma", plan: "Basic", status: "active", joined: "2026-03-11", gymName: "Downtown" },
  { name: "Rahul Kumar", plan: "Premium", status: "expiring", joined: "2026-02-15", gymName: "HQ" },
  { name: "Sneha Reddy", plan: "Student", status: "active", joined: "2026-03-10", gymName: "East Side" },
  { name: "Vikram Singh", plan: "Premium", status: "overdue", joined: "2026-01-08", gymName: "Downtown" },
  { name: "Anita Desai", plan: "Basic", status: "active", joined: "2026-03-09", gymName: "HQ" },
  { name: "Karan Mehta", plan: "Premium", status: "active", joined: "2026-03-08", gymName: "East Side" },
  { name: "Divya Nair", plan: "Student", status: "expiring", joined: "2026-03-01", gymName: "HQ" },
];

const equipmentAlerts = [
  { name: "Treadmill #3", issue: "Service due in 3 days", status: "warning" as const },
  { name: "Leg Press", issue: "Hydraulic leak reported", status: "critical" as const },
  { name: "Cable Machine #2", issue: "Service due in 7 days", status: "warning" as const },
  { name: "Smith Machine", issue: "Operational", status: "operational" as const },
];

const Dashboard = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">System Status: All Operational</h1>
          <p className="text-sm text-muted-foreground">42 Members In-Gym · 3 Gyms Active · March 14, 2026</p>
        </div>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Quick Check-in
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Members"
          value="2,847"
          change="+12.5%"
          changeType="positive"
          icon={<Users className="w-4 h-4" />}
          sparkline={[30, 35, 28, 42, 38, 45, 50, 48]}
        />
        <MetricCard
          label="Monthly Revenue"
          value="₹5.8L"
          change="+8.2%"
          changeType="positive"
          icon={<DollarSign className="w-4 h-4" />}
          sparkline={[42, 45, 48, 51, 53, 49, 55, 58]}
        />
        <MetricCard
          label="Churn Rate"
          value="4.2%"
          change="-0.8%"
          changeType="positive"
          icon={<TrendingUp className="w-4 h-4" />}
        />
        <MetricCard
          label="Equipment Alerts"
          value="3"
          change="+1"
          changeType="negative"
          icon={<AlertTriangle className="w-4 h-4" />}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Revenue Chart - 2 cols */}
        <div className="xl:col-span-2 bg-card rounded-xl p-5 shadow-surface">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-foreground">Revenue vs Expenses</h2>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary" /> Revenue</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-accent" /> Expenses</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 12%)" />
              <XAxis dataKey="month" tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(222, 47%, 7%)", border: "1px solid hsl(222, 30%, 12%)", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "hsl(215, 20%, 55%)" }}
              />
              <Area type="monotone" dataKey="revenue" stroke="hsl(142, 71%, 45%)" fill="url(#colorRevenue)" strokeWidth={2} />
              <Area type="monotone" dataKey="expenses" stroke="hsl(217, 91%, 60%)" fill="url(#colorExpenses)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Equipment Status */}
        <div className="bg-card rounded-xl p-5 shadow-surface">
          <h2 className="text-sm font-medium text-foreground mb-4">Equipment Health</h2>
          <div className="space-y-3">
            {equipmentAlerts.map((eq, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div>
                  <p className="text-sm text-foreground">{eq.name}</p>
                  <p className="text-xs text-muted-foreground">{eq.issue}</p>
                </div>
                <StatusDot status={eq.status} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Members Table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-foreground">Recent Members</h2>
          <button className="text-xs text-accent hover:underline">View All →</button>
        </div>
        <DataTable
          columns={[
            {
              key: "name",
              header: "Member",
              render: (row) => (
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-surface-raised flex items-center justify-center text-xs font-medium text-muted-foreground">
                    {row.name.split(" ").map((n: string) => n[0]).join("")}
                  </div>
                  <span className="text-foreground font-medium">{row.name}</span>
                </div>
              ),
            },
            { key: "gymName", header: "Gym" },
            {
              key: "plan",
              header: "Plan",
              render: (row) => (
                <span className="px-2 py-0.5 rounded bg-surface-raised text-xs font-medium text-foreground">{row.plan}</span>
              ),
            },
            {
              key: "status",
              header: "Status",
              render: (row) => (
                <StatusDot
                  status={row.status === "active" ? "operational" : row.status === "expiring" ? "warning" : "critical"}
                  label={row.status}
                />
              ),
            },
            { key: "joined", header: "Joined" },
          ]}
          data={recentMembers}
        />
      </div>
    </div>
  );
};

export default Dashboard;
