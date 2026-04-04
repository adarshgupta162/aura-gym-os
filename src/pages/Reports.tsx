import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Download, FileText, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { MetricCard } from "@/components/MetricCard";

type ReportType = "revenue" | "attendance" | "members" | "outstanding";

const Reports = () => {
  const [reportType, setReportType] = useState<ReportType>("revenue");
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState(new Date().toISOString().split("T")[0]);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({ total: 0, count: 0 });

  const fetchReport = async () => {
    setLoading(true);
    try {
      if (reportType === "revenue") {
        const { data: payments } = await supabase.from("payments").select("amount, payment_date, method, status, members(full_name)")
          .gte("payment_date", dateFrom).lte("payment_date", dateTo + "T23:59:59").eq("status", "completed").order("payment_date", { ascending: false });
        setData(payments || []);
        setSummary({ total: (payments || []).reduce((s, p) => s + Number(p.amount), 0), count: (payments || []).length });
      } else if (reportType === "attendance") {
        const { data: att } = await supabase.from("attendance").select("check_in, check_out, date, members(full_name, member_code)")
          .gte("date", dateFrom).lte("date", dateTo).order("check_in", { ascending: false });
        setData(att || []);
        setSummary({ total: new Set((att || []).map(a => a.date)).size, count: (att || []).length });
      } else if (reportType === "members") {
        const { data: members } = await supabase.from("members").select("full_name, member_code, status, due_date, created_at, plans(name)")
          .gte("created_at", dateFrom).lte("created_at", dateTo + "T23:59:59").order("created_at", { ascending: false });
        setData(members || []);
        setSummary({ total: (members || []).length, count: (members || []).filter(m => m.status === "active").length });
      } else if (reportType === "outstanding") {
        const { data: members } = await supabase.from("members").select("full_name, member_code, phone, due_date, status, plans(name, price)")
          .in("status", ["expiring", "overdue", "frozen"]).order("due_date");
        setData(members || []);
        setSummary({ total: (members || []).reduce((s, m) => s + Number(m.plans?.price || 0), 0), count: (members || []).length });
      }
    } catch (err: any) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchReport(); }, [reportType, dateFrom, dateTo]);

  const exportCSV = () => {
    if (data.length === 0) return;
    const keys = Object.keys(data[0]).filter(k => typeof data[0][k] !== "object");
    const csv = [keys.join(","), ...data.map(row => keys.map(k => `"${row[k] ?? ""}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${reportType}_report.csv`; a.click();
  };

  const formatCurrency = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Reports</h1>
          <p className="text-sm text-muted-foreground">Generate and export reports</p>
        </div>
        <button onClick={exportCSV} disabled={data.length === 0} className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:bg-accent/90 flex items-center gap-2 self-start disabled:opacity-50">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["revenue", "attendance", "members", "outstanding"] as ReportType[]).map(t => (
          <button key={t} onClick={() => setReportType(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${reportType === t ? "bg-primary text-primary-foreground" : "bg-surface text-muted-foreground hover:text-foreground"}`}>
            {t === "outstanding" ? "Outstanding Dues" : t}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="bg-surface rounded-lg px-3 py-2 text-sm text-foreground shadow-surface" />
        <span className="text-muted-foreground">to</span>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="bg-surface rounded-lg px-3 py-2 text-sm text-foreground shadow-surface" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <MetricCard label={reportType === "revenue" ? "Total Revenue" : reportType === "outstanding" ? "Total Outstanding" : "Total"} value={reportType === "revenue" || reportType === "outstanding" ? formatCurrency(summary.total) : summary.total} icon={<BarChart3 className="w-4 h-4" />} />
        <MetricCard label={reportType === "revenue" ? "Transactions" : reportType === "members" ? "Active" : "Records"} value={summary.count} icon={<FileText className="w-4 h-4" />} />
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : data.length === 0 ? (
        <div className="bg-card rounded-xl p-8 shadow-surface text-center text-muted-foreground">No data for selected period</div>
      ) : (
        <div className="bg-card rounded-xl p-4 shadow-surface overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {reportType === "revenue" && <><th className="text-left py-2 text-label">Date</th><th className="text-left text-label">Member</th><th className="text-left text-label">Method</th><th className="text-right text-label">Amount</th></>}
                {reportType === "attendance" && <><th className="text-left py-2 text-label">Date</th><th className="text-left text-label">Member</th><th className="text-left text-label">In</th><th className="text-left text-label">Out</th></>}
                {reportType === "members" && <><th className="text-left py-2 text-label">Code</th><th className="text-left text-label">Name</th><th className="text-left text-label">Status</th><th className="text-left text-label">Plan</th></>}
                {reportType === "outstanding" && <><th className="text-left py-2 text-label">Name</th><th className="text-left text-label">Phone</th><th className="text-left text-label">Due</th><th className="text-right text-label">Amount</th></>}
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 50).map((row, i) => (
                <tr key={i} className="border-b border-border/50">
                  {reportType === "revenue" && <><td className="py-2 text-xs">{new Date(row.payment_date).toLocaleDateString()}</td><td>{row.members?.full_name || "—"}</td><td className="capitalize text-xs">{row.method}</td><td className="text-right">{formatCurrency(Number(row.amount))}</td></>}
                  {reportType === "attendance" && <><td className="py-2 text-xs">{row.date}</td><td>{row.members?.full_name || "—"}</td><td className="text-xs">{new Date(row.check_in).toLocaleTimeString()}</td><td className="text-xs">{row.check_out ? new Date(row.check_out).toLocaleTimeString() : "—"}</td></>}
                  {reportType === "members" && <><td className="py-2 font-mono text-xs">{row.member_code}</td><td>{row.full_name}</td><td className="capitalize text-xs">{row.status}</td><td className="text-xs">{row.plans?.name || "—"}</td></>}
                  {reportType === "outstanding" && <><td className="py-2">{row.full_name}</td><td className="text-xs">{row.phone || "—"}</td><td className="text-xs">{row.due_date || "—"}</td><td className="text-right">{formatCurrency(Number(row.plans?.price || 0))}</td></>}
                </tr>
              ))}
            </tbody>
          </table>
          {data.length > 50 && <p className="text-xs text-muted-foreground text-center mt-2">Showing 50 of {data.length} records. Export for full data.</p>}
        </div>
      )}
    </div>
  );
};

export default Reports;
