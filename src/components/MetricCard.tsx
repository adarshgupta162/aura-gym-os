import { ReactNode } from "react";

interface MetricCardProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: ReactNode;
  sparkline?: number[];
}

export function MetricCard({ label, value, change, changeType = "neutral", icon, sparkline }: MetricCardProps) {
  return (
    <div className="bg-card rounded-xl p-4 shadow-surface hover:shadow-surface-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <span className="text-label">{label}</span>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      <div className="text-metric text-foreground">{value}</div>
      {change && (
        <div className="mt-1 flex items-center gap-1">
          <span className={`text-xs font-medium ${
            changeType === "positive" ? "text-primary" : changeType === "negative" ? "text-destructive" : "text-muted-foreground"
          }`}>
            {change}
          </span>
          <span className="text-xs text-muted-foreground">vs last month</span>
        </div>
      )}
      {sparkline && (
        <div className="mt-3 flex items-end gap-0.5 h-8">
          {sparkline.map((v, i) => (
            <div
              key={i}
              className="flex-1 bg-primary/20 rounded-sm min-w-[3px]"
              style={{ height: `${(v / Math.max(...sparkline)) * 100}%` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
