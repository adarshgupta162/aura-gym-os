import { DataTable } from "@/components/DataTable";
import { MetricCard } from "@/components/MetricCard";
import { StatusDot } from "@/components/StatusDot";
import { Users, UserPlus, DollarSign, Plus, Dumbbell } from "lucide-react";

const trainers = [
  { id: "1", trainer_code: "KSMT0001", full_name: "Coach Raj", phone: "9876543230", specialization: "Strength & Conditioning", salary: "₹35,000", members_assigned: 12, status: "active" },
  { id: "2", trainer_code: "KSMT0002", full_name: "Coach Neha", phone: "9876543231", specialization: "Yoga & Flexibility", salary: "₹30,000", members_assigned: 8, status: "active" },
  { id: "3", trainer_code: "KSMT0003", full_name: "Coach Vikram", phone: "9876543232", specialization: "CrossFit", salary: "₹32,000", members_assigned: 15, status: "active" },
  { id: "4", trainer_code: "KSMT0004", full_name: "Coach Priya", phone: "9876543233", specialization: "Cardio & HIIT", salary: "₹28,000", members_assigned: 0, status: "inactive" },
];

const Trainers = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Trainers</h1>
          <p className="text-sm text-muted-foreground">{trainers.length} trainers registered</p>
        </div>
        <button className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Trainer
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Trainers" value={trainers.length} icon={<Dumbbell className="w-4 h-4" />} />
        <MetricCard label="Active" value={trainers.filter(t => t.status === "active").length} changeType="positive" icon={<Users className="w-4 h-4" />} />
        <MetricCard label="Total Salary" value="₹1.25L" icon={<DollarSign className="w-4 h-4" />} />
        <MetricCard label="Avg Members/Trainer" value="12" icon={<UserPlus className="w-4 h-4" />} />
      </div>

      <DataTable
        columns={[
          { key: "trainer_code", header: "Code", className: "w-24" },
          {
            key: "full_name",
            header: "Trainer",
            render: (row) => (
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                  {row.full_name.split(" ").map((n: string) => n[0]).join("")}
                </div>
                <div>
                  <p className="text-foreground font-medium">{row.full_name}</p>
                  <p className="text-xs text-muted-foreground">{row.phone}</p>
                </div>
              </div>
            ),
          },
          { key: "specialization", header: "Specialization" },
          { key: "salary", header: "Salary" },
          { key: "members_assigned", header: "Members" },
          {
            key: "status",
            header: "Status",
            render: (row) => (
              <StatusDot
                status={row.status === "active" ? "operational" : "critical"}
                label={row.status}
              />
            ),
          },
          {
            key: "actions",
            header: "",
            render: () => (
              <button className="text-xs text-accent hover:underline">Manage →</button>
            ),
          },
        ]}
        data={trainers}
      />
    </div>
  );
};

export default Trainers;
