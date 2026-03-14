import { DataTable } from "@/components/DataTable";
import { Plus, Check } from "lucide-react";
import { useState } from "react";

const plans = [
  {
    id: "P001",
    name: "Premium",
    price: "₹3,500",
    duration: "1 month",
    features: ["All equipment", "Personal trainer", "Locker", "Towel service", "Sauna"],
    activeMembers: 80,
    color: "primary",
  },
  {
    id: "P002",
    name: "Basic",
    price: "₹1,500",
    duration: "1 month",
    features: ["All equipment", "Group classes"],
    activeMembers: 80,
    color: "accent",
  },
  {
    id: "P003",
    name: "Student",
    price: "₹800",
    duration: "1 month",
    features: ["All equipment", "Student ID required"],
    activeMembers: 60,
    color: "amber",
  },
  {
    id: "P004",
    name: "Quarterly Premium",
    price: "₹9,000",
    duration: "3 months",
    features: ["All equipment", "Personal trainer", "Locker", "Towel service", "Sauna", "10% discount"],
    activeMembers: 35,
    color: "primary",
  },
  {
    id: "P005",
    name: "Annual Basic",
    price: "₹14,400",
    duration: "12 months",
    features: ["All equipment", "Group classes", "20% discount"],
    activeMembers: 25,
    color: "accent",
  },
];

const Plans = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Membership Plans</h1>
          <p className="text-sm text-muted-foreground">{plans.length} plans configured</p>
        </div>
        <button className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Plan
        </button>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.slice(0, 3).map((plan) => (
          <div key={plan.id} className="bg-card rounded-xl p-5 shadow-surface hover:shadow-surface-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className={`px-2.5 py-0.5 rounded text-xs font-medium bg-${plan.color}/10 text-${plan.color}`}>
                {plan.name}
              </span>
              <span className="text-xs text-muted-foreground">{plan.activeMembers} active</span>
            </div>
            <div className="mb-4">
              <span className="text-2xl font-semibold text-foreground">{plan.price}</span>
              <span className="text-sm text-muted-foreground">/{plan.duration}</span>
            </div>
            <ul className="space-y-2">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="w-3.5 h-3.5 text-primary" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-4 flex gap-2">
              <button className="flex-1 py-2 text-sm font-medium rounded-lg bg-surface hover:bg-surface-raised text-foreground transition-colors">
                Edit
              </button>
              <button className="flex-1 py-2 text-sm font-medium rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors">
                Assign
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* All Plans Table */}
      <DataTable
        columns={[
          { key: "id", header: "ID", className: "w-16" },
          { key: "name", header: "Plan Name" },
          { key: "price", header: "Price" },
          { key: "duration", header: "Duration" },
          { key: "activeMembers", header: "Active Members" },
          {
            key: "features",
            header: "Features",
            render: (row) => (
              <span className="text-xs text-muted-foreground">{row.features.length} features</span>
            ),
          },
          {
            key: "actions",
            header: "",
            render: () => (
              <button className="text-xs text-accent hover:underline">Edit →</button>
            ),
          },
        ]}
        data={plans}
      />
    </div>
  );
};

export default Plans;
