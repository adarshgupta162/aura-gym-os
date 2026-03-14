import { MetricCard } from "@/components/MetricCard";
import { DataTable } from "@/components/DataTable";
import { DollarSign, TrendingUp, TrendingDown, CreditCard, Banknote, Smartphone } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const monthlyPL = [
  { month: "Oct", profit: 21000, loss: -6000 },
  { month: "Nov", profit: 20000, loss: -11000 },
  { month: "Dec", profit: 23000, loss: -7000 },
  { month: "Jan", profit: 17000, loss: -15000 },
  { month: "Feb", profit: 26000, loss: -3000 },
  { month: "Mar", profit: 27000, loss: -4000 },
];

const paymentBreakdown = [
  { name: "UPI", value: 45, color: "hsl(142, 71%, 45%)" },
  { name: "Cash", value: 30, color: "hsl(217, 91%, 60%)" },
  { name: "Card", value: 25, color: "hsl(38, 92%, 50%)" },
];

const pendingPayments = [
  { member: "Vikram Singh", plan: "Premium", amount: "₹3,500", dueDate: "2026-03-01", daysPast: 13 },
  { member: "Suresh Iyer", plan: "Basic", amount: "₹1,500", dueDate: "2026-02-28", daysPast: 14 },
  { member: "Rahul Kumar", plan: "Premium", amount: "₹3,500", dueDate: "2026-03-20", daysPast: 0 },
  { member: "Divya Nair", plan: "Student", amount: "₹800", dueDate: "2026-03-25", daysPast: 0 },
];

const expenses = [
  { item: "Trainer Salaries", amount: "₹1,20,000", category: "Payroll", date: "2026-03-01" },
  { item: "Electricity Bill", amount: "₹18,000", category: "Utilities", date: "2026-03-05" },
  { item: "Equipment Repair", amount: "₹8,500", category: "Maintenance", date: "2026-03-08" },
  { item: "Cleaning Supplies", amount: "₹3,200", category: "Operations", date: "2026-03-10" },
  { item: "Rent", amount: "₹45,000", category: "Fixed", date: "2026-03-01" },
];

const Finance = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Finance & Revenue</h1>
        <p className="text-sm text-muted-foreground">March 2026 Overview</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Monthly Revenue" value="₹5.8L" change="+8.2%" changeType="positive" icon={<DollarSign className="w-4 h-4" />} />
        <MetricCard label="Net Profit" value="₹2.7L" change="+15%" changeType="positive" icon={<TrendingUp className="w-4 h-4" />} />
        <MetricCard label="Pending Dues" value="₹9,300" changeType="negative" icon={<TrendingDown className="w-4 h-4" />} />
        <MetricCard label="Expenses" value="₹1.95L" icon={<CreditCard className="w-4 h-4" />} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* P&L Chart */}
        <div className="xl:col-span-2 bg-card rounded-xl p-5 shadow-surface">
          <h2 className="text-sm font-medium text-foreground mb-4">Profit & Loss</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyPL}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 12%)" />
              <XAxis dataKey="month" tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${Math.abs(v) / 1000}k`} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(222, 47%, 7%)", border: "1px solid hsl(222, 30%, 12%)", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="profit" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="loss" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Breakdown */}
        <div className="bg-card rounded-xl p-5 shadow-surface">
          <h2 className="text-sm font-medium text-foreground mb-4">Payment Methods</h2>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={paymentBreakdown} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={3}>
                {paymentBreakdown.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {paymentBreakdown.map((p) => (
              <div key={p.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                {p.name} {p.value}%
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Pending Payments */}
        <div>
          <h2 className="text-sm font-medium text-foreground mb-3">Pending Payments</h2>
          <DataTable
            columns={[
              { key: "member", header: "Member" },
              { key: "plan", header: "Plan" },
              { key: "amount", header: "Amount" },
              { key: "dueDate", header: "Due Date" },
              {
                key: "daysPast",
                header: "Status",
                render: (row) => (
                  <span className={`text-xs font-medium ${row.daysPast > 0 ? "text-destructive" : "text-amber"}`}>
                    {row.daysPast > 0 ? `${row.daysPast}d overdue` : "Upcoming"}
                  </span>
                ),
              },
            ]}
            data={pendingPayments}
          />
        </div>

        {/* Expenses */}
        <div>
          <h2 className="text-sm font-medium text-foreground mb-3">Recent Expenses</h2>
          <DataTable
            columns={[
              { key: "item", header: "Item" },
              { key: "category", header: "Category" },
              { key: "amount", header: "Amount" },
              { key: "date", header: "Date" },
            ]}
            data={expenses}
          />
        </div>
      </div>
    </div>
  );
};

export default Finance;
