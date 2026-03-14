import { DataTable } from "@/components/DataTable";
import { MetricCard } from "@/components/MetricCard";
import { Building2, Users, DollarSign, Plus } from "lucide-react";

const gyms = [
  { id: "1", name: "AuraFarming HQ", city: "Mumbai", admin: "Rahul Verma", members: 1245, revenue: "₹2.4L", status: "active" },
  { id: "2", name: "Downtown Fitness", city: "Pune", admin: "Sneha Patil", members: 876, revenue: "₹1.8L", status: "active" },
  { id: "3", name: "East Side Gym", city: "Mumbai", admin: "Vikram Das", members: 726, revenue: "₹1.6L", status: "active" },
  { id: "4", name: "North Zone Fit", city: "Delhi", admin: "Anita Singh", members: 0, revenue: "₹0", status: "setup" },
];

const Gyms = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Gym Directory</h1>
          <p className="text-sm text-muted-foreground">{gyms.length} gyms registered</p>
        </div>
        <button className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Gym
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <MetricCard label="Total Gyms" value={gyms.length} icon={<Building2 className="w-4 h-4" />} />
        <MetricCard label="Total Members" value="2,847" change="+12.5%" changeType="positive" icon={<Users className="w-4 h-4" />} />
        <MetricCard label="Platform Revenue" value="₹5.8L" change="+8.2%" changeType="positive" icon={<DollarSign className="w-4 h-4" />} />
      </div>

      <DataTable
        columns={[
          {
            key: "name",
            header: "Gym",
            render: (row) => (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-foreground font-medium">{row.name}</p>
                  <p className="text-xs text-muted-foreground">{row.city}</p>
                </div>
              </div>
            ),
          },
          { key: "admin", header: "Admin" },
          { key: "members", header: "Members" },
          { key: "revenue", header: "Monthly Revenue" },
          {
            key: "status",
            header: "Status",
            render: (row) => (
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                row.status === "active" ? "bg-primary/10 text-primary" : "bg-amber/10 text-amber"
              }`}>
                {row.status}
              </span>
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
        data={gyms}
      />
    </div>
  );
};

export default Gyms;
