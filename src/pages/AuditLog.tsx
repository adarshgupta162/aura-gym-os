import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Shield } from "lucide-react";
import { DataTable } from "@/components/DataTable";

const AuditLog = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(200);
      setLogs(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = filter ? logs.filter(l => l.entity_type.toLowerCase().includes(filter.toLowerCase()) || l.action.toLowerCase().includes(filter.toLowerCase())) : logs;

  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground flex items-center gap-2"><Shield className="w-5 h-5" /> Audit Log</h1>
        <p className="text-sm text-muted-foreground">{logs.length} actions recorded</p>
      </div>

      <input type="text" placeholder="Filter by action or entity..." value={filter} onChange={e => setFilter(e.target.value)}
        className="bg-surface rounded-lg px-3 py-2 text-sm text-foreground shadow-surface focus:outline-none focus:ring-1 focus:ring-accent max-w-sm w-full" />

      {filtered.length === 0 ? (
        <div className="bg-card rounded-xl p-12 shadow-surface text-center">
          <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-foreground font-medium">No audit logs yet</p>
          <p className="text-sm text-muted-foreground">Admin actions will be tracked here.</p>
        </div>
      ) : (
        <DataTable
          columns={[
            { key: "created_at", header: "Time", render: (r: any) => <span className="text-xs">{new Date(r.created_at).toLocaleString()}</span> },
            { key: "action", header: "Action", render: (r: any) => <span className="text-xs font-medium uppercase text-accent">{r.action}</span> },
            { key: "entity_type", header: "Entity", render: (r: any) => <span className="capitalize">{r.entity_type}</span> },
            { key: "entity_id", header: "ID", render: (r: any) => <span className="text-xs font-mono">{r.entity_id?.substring(0, 8) || "—"}</span> },
            { key: "details", header: "Details", render: (r: any) => <span className="text-xs text-muted-foreground max-w-[200px] truncate block">{r.details ? JSON.stringify(r.details) : "—"}</span> },
          ]}
          data={filtered}
        />
      )}
    </div>
  );
};

export default AuditLog;
