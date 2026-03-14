import { DataTable } from "@/components/DataTable";
import { MetricCard } from "@/components/MetricCard";
import { StatusDot } from "@/components/StatusDot";
import { Users, UserPlus, UserMinus, Search, Filter, Plus } from "lucide-react";
import { useState } from "react";

const members = [
  { id: "M001", name: "Arjun Patel", phone: "9876543210", plan: "Premium", trainer: "Coach Raj", status: "active", dueDate: "2026-04-12", weight: "78kg" },
  { id: "M002", name: "Priya Sharma", phone: "9876543211", plan: "Basic", trainer: "—", status: "active", dueDate: "2026-04-11", weight: "62kg" },
  { id: "M003", name: "Rahul Kumar", phone: "9876543212", plan: "Premium", trainer: "Coach Neha", status: "expiring", dueDate: "2026-03-20", weight: "85kg" },
  { id: "M004", name: "Sneha Reddy", phone: "9876543213", plan: "Student", trainer: "—", status: "active", dueDate: "2026-05-10", weight: "55kg" },
  { id: "M005", name: "Vikram Singh", phone: "9876543214", plan: "Premium", trainer: "Coach Raj", status: "overdue", dueDate: "2026-03-01", weight: "92kg" },
  { id: "M006", name: "Anita Desai", phone: "9876543215", plan: "Basic", trainer: "Coach Neha", status: "active", dueDate: "2026-04-09", weight: "58kg" },
  { id: "M007", name: "Karan Mehta", phone: "9876543216", plan: "Premium", trainer: "Coach Raj", status: "active", dueDate: "2026-04-08", weight: "75kg" },
  { id: "M008", name: "Divya Nair", phone: "9876543217", plan: "Student", trainer: "—", status: "expiring", dueDate: "2026-03-25", weight: "60kg" },
  { id: "M009", name: "Amit Joshi", phone: "9876543218", plan: "Basic", trainer: "—", status: "active", dueDate: "2026-04-15", weight: "70kg" },
  { id: "M010", name: "Ritu Agarwal", phone: "9876543219", plan: "Premium", trainer: "Coach Neha", status: "active", dueDate: "2026-04-20", weight: "65kg" },
  { id: "M011", name: "Suresh Iyer", phone: "9876543220", plan: "Basic", trainer: "—", status: "overdue", dueDate: "2026-02-28", weight: "88kg" },
  { id: "M012", name: "Maya Gupta", phone: "9876543221", plan: "Premium", trainer: "Coach Raj", status: "active", dueDate: "2026-05-01", weight: "57kg" },
];

const Members = () => {
  const [search, setSearch] = useState("");
  const filtered = members.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Members</h1>
          <p className="text-sm text-muted-foreground">{members.length} total members</p>
        </div>
        <button className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Member
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Members" value={members.length} icon={<Users className="w-4 h-4" />} />
        <MetricCard label="New This Month" value="24" change="+18%" changeType="positive" icon={<UserPlus className="w-4 h-4" />} />
        <MetricCard label="Expiring Soon" value="5" changeType="negative" icon={<UserMinus className="w-4 h-4" />} />
        <MetricCard label="Overdue" value="2" changeType="negative" />
      </div>

      {/* Search / Filter Bar */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface rounded-lg pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground shadow-surface focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
        <button className="px-3 py-2 bg-surface rounded-lg shadow-surface text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Filter
        </button>
      </div>

      <DataTable
        columns={[
          { key: "id", header: "ID", className: "w-16" },
          {
            key: "name",
            header: "Member",
            render: (row) => (
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-surface-raised flex items-center justify-center text-xs font-medium text-muted-foreground">
                  {row.name.split(" ").map((n: string) => n[0]).join("")}
                </div>
                <div>
                  <p className="text-foreground font-medium">{row.name}</p>
                  <p className="text-xs text-muted-foreground">{row.phone}</p>
                </div>
              </div>
            ),
          },
          {
            key: "plan",
            header: "Plan",
            render: (row) => (
              <span className="px-2 py-0.5 rounded bg-surface-raised text-xs font-medium text-foreground">{row.plan}</span>
            ),
          },
          { key: "trainer", header: "Trainer" },
          { key: "weight", header: "Weight" },
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
          { key: "dueDate", header: "Due Date" },
        ]}
        data={filtered}
      />
      
      {/* Pagination */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Showing {filtered.length} of {members.length} members</span>
        <div className="flex gap-1">
          <button className="px-3 py-1.5 bg-surface-raised rounded text-foreground">1</button>
          <button className="px-3 py-1.5 rounded hover:bg-surface-raised transition-colors">2</button>
          <button className="px-3 py-1.5 rounded hover:bg-surface-raised transition-colors">3</button>
        </div>
      </div>
    </div>
  );
};

export default Members;
