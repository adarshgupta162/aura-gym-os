import { DataTable } from "@/components/DataTable";
import { MetricCard } from "@/components/MetricCard";
import { StatusDot } from "@/components/StatusDot";
import { Dumbbell, AlertTriangle, Wrench, Plus } from "lucide-react";

const equipment = [
  { id: "E001", name: "Treadmill #1", category: "Cardio", purchased: "2024-06-15", warranty: "2026-06-15", status: "operational", lastService: "2026-02-10", cost: "₹85,000" },
  { id: "E002", name: "Treadmill #2", category: "Cardio", purchased: "2024-06-15", warranty: "2026-06-15", status: "operational", lastService: "2026-02-10", cost: "₹85,000" },
  { id: "E003", name: "Treadmill #3", category: "Cardio", purchased: "2024-08-01", warranty: "2026-08-01", status: "warning", lastService: "2025-12-01", cost: "₹92,000" },
  { id: "E004", name: "Leg Press", category: "Strength", purchased: "2024-03-20", warranty: "2027-03-20", status: "critical", lastService: "2026-01-15", cost: "₹1,20,000" },
  { id: "E005", name: "Smith Machine", category: "Strength", purchased: "2024-05-10", warranty: "2027-05-10", status: "operational", lastService: "2026-03-01", cost: "₹1,50,000" },
  { id: "E006", name: "Cable Machine #1", category: "Strength", purchased: "2024-07-22", warranty: "2027-07-22", status: "operational", lastService: "2026-02-20", cost: "₹1,10,000" },
  { id: "E007", name: "Cable Machine #2", category: "Strength", purchased: "2024-07-22", warranty: "2027-07-22", status: "warning", lastService: "2025-11-15", cost: "₹1,10,000" },
  { id: "E008", name: "Rowing Machine", category: "Cardio", purchased: "2025-01-10", warranty: "2028-01-10", status: "operational", lastService: "2026-03-05", cost: "₹65,000" },
  { id: "E009", name: "Bench Press Set", category: "Free Weights", purchased: "2024-03-15", warranty: "2026-03-15", status: "operational", lastService: "2026-02-28", cost: "₹45,000" },
  { id: "E010", name: "Spin Bike x5", category: "Cardio", purchased: "2025-02-01", warranty: "2028-02-01", status: "operational", lastService: "2026-03-10", cost: "₹2,50,000" },
];

const Equipment = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Equipment</h1>
          <p className="text-sm text-muted-foreground">{equipment.length} items tracked</p>
        </div>
        <button className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Equipment
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Equipment" value={equipment.length} icon={<Dumbbell className="w-4 h-4" />} />
        <MetricCard label="Operational" value={equipment.filter(e => e.status === "operational").length} />
        <MetricCard label="Service Due" value={equipment.filter(e => e.status === "warning").length} changeType="negative" icon={<Wrench className="w-4 h-4" />} />
        <MetricCard label="Out of Order" value={equipment.filter(e => e.status === "critical").length} changeType="negative" icon={<AlertTriangle className="w-4 h-4" />} />
      </div>

      {/* Status Grid */}
      <div className="bg-card rounded-xl p-5 shadow-surface">
        <h2 className="text-sm font-medium text-foreground mb-4">Status Grid</h2>
        <div className="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-10 gap-3">
          {equipment.map((eq) => (
            <div
              key={eq.id}
              className="group relative flex flex-col items-center gap-1.5 p-3 rounded-lg bg-surface hover:bg-surface-raised transition-colors cursor-pointer"
              title={`${eq.name} — ${eq.status}`}
            >
              <StatusDot status={eq.status as "operational" | "warning" | "critical"} />
              <span className="text-[10px] text-muted-foreground text-center leading-tight">{eq.name.split(" ").slice(0, 2).join(" ")}</span>
            </div>
          ))}
        </div>
      </div>

      <DataTable
        columns={[
          { key: "id", header: "ID", className: "w-16" },
          { key: "name", header: "Equipment" },
          { key: "category", header: "Category" },
          { key: "purchased", header: "Purchased" },
          { key: "warranty", header: "Warranty Until" },
          { key: "lastService", header: "Last Service" },
          { key: "cost", header: "Cost" },
          {
            key: "status",
            header: "Status",
            render: (row) => (
              <StatusDot
                status={row.status as "operational" | "warning" | "critical"}
                label={row.status}
              />
            ),
          },
        ]}
        data={equipment}
      />
    </div>
  );
};

export default Equipment;
