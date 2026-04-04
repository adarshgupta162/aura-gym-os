import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Download, Loader2, Database } from "lucide-react";

const tables = [
  { key: "members", label: "Members" },
  { key: "payments", label: "Payments" },
  { key: "attendance", label: "Attendance" },
  { key: "trainers", label: "Trainers" },
  { key: "equipment", label: "Equipment" },
  { key: "expenses", label: "Expenses" },
  { key: "plans", label: "Plans" },
  { key: "enquiries", label: "Enquiries" },
  { key: "feedback", label: "Feedback" },
  { key: "inventory", label: "Inventory" },
];

const DataExport = () => {
  const [exporting, setExporting] = useState<string | null>(null);

  const exportTable = async (table: string) => {
    setExporting(table);
    try {
      const { data, error } = await supabase.from(table as any).select("*");
      if (error) throw error;
      if (!data || data.length === 0) { toast.info("No data to export"); setExporting(null); return; }
      const keys = Object.keys(data[0]);
      const csv = [keys.join(","), ...data.map(row => keys.map(k => `"${(row as any)[k] ?? ""}"`).join(","))].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `${table}_export.csv`; a.click();
      URL.revokeObjectURL(url);
      toast.success(`${table} exported!`);
    } catch (err: any) { toast.error(err.message); }
    setExporting(null);
  };

  const exportAll = async () => {
    setExporting("all");
    for (const t of tables) {
      await exportTable(t.key);
    }
    setExporting(null);
    toast.success("All data exported!");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Data Export</h1>
          <p className="text-sm text-muted-foreground">Download your gym data as CSV</p>
        </div>
        <button onClick={exportAll} disabled={!!exporting} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center gap-2 self-start disabled:opacity-50">
          {exporting === "all" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Export All
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tables.map(t => (
          <div key={t.key} className="bg-card rounded-xl p-5 shadow-surface flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Database className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{t.label}</p>
                <p className="text-xs text-muted-foreground">{t.key} table</p>
              </div>
            </div>
            <button onClick={() => exportTable(t.key)} disabled={!!exporting}
              className="p-2 rounded-lg hover:bg-surface-raised text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50">
              {exporting === t.key ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DataExport;
