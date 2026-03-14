interface StatusDotProps {
  status: "operational" | "warning" | "critical";
  label?: string;
}

export function StatusDot({ status, label }: StatusDotProps) {
  const colors = {
    operational: "bg-primary",
    warning: "bg-amber animate-pulse-amber",
    critical: "bg-destructive animate-pulse",
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${colors[status]}`} />
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
    </div>
  );
}
