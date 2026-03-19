import { useEffect, useState } from "react";
import { MetricCard } from "@/components/MetricCard";
import { DataTable } from "@/components/DataTable";
import { InvoiceModal } from "@/components/InvoiceModal";
import { DollarSign, TrendingUp, TrendingDown, CreditCard, Plus, Loader2, FileText } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

interface GymFull {
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  city: string | null;
}

interface InvoiceData {
  gym: GymFull;
  member: { full_name: string; member_code: string; phone: string | null; email: string | null };
  payment: { id: string; amount: number; method: string; description: string | null; status: string; payment_date: string };
}

const Finance = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ category: "", amount: "", description: "" });
  const [payForm, setPayForm] = useState({ member_id: "", amount: "", method: "cash", description: "", status: "completed" });
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);

  const fetchData = async () => {
    const [payRes, expRes, memRes] = await Promise.all([
      supabase.from("payments").select("*, members(full_name, member_code)").order("payment_date", { ascending: false }),
      supabase.from("expenses").select("*").order("expense_date", { ascending: false }),
      supabase.from("members").select("id, full_name, member_code, phone, email").eq("status", "active"),
    ]);
    setPayments(payRes.data || []);
    setExpenses(expRes.data || []);
    setMembers(memRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const totalRevenue = payments.filter(p => p.status === "completed").reduce((s, p) => s + Number(p.amount), 0);
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const netProfit = totalRevenue - totalExpenses;
  const pendingDues = payments.filter(p => p.status === "pending").reduce((s, p) => s + Number(p.amount), 0);

  const formatCurrency = (n: number) => {
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
    if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
    return `₹${n}`;
  };

  // Payment method breakdown
  const methodMap: Record<string, number> = {};
  payments.filter(p => p.status === "completed").forEach(p => {
    methodMap[p.method] = (methodMap[p.method] || 0) + Number(p.amount);
  });
  const methodColors: Record<string, string> = { upi: "hsl(142, 71%, 45%)", cash: "hsl(217, 91%, 60%)", card: "hsl(38, 92%, 50%)", online: "hsl(280, 65%, 60%)" };
  const paymentBreakdown = Object.entries(methodMap).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    color: methodColors[name] || "hsl(215, 20%, 55%)",
  }));

  const handleAddExpense = async () => {
    if (!form.category || !form.amount) { toast.error("Category and amount required"); return; }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data: gymId } = await supabase.rpc("get_user_gym_id", { _user_id: user.id });
      if (!gymId) throw new Error("No gym assigned");

      const { error } = await supabase.from("expenses").insert({
        category: form.category,
        amount: parseFloat(form.amount),
        description: form.description || null,
        gym_id: gymId,
      });
      if (error) throw error;
      toast.success("Expense added");
      setExpenseOpen(false);
      setForm({ category: "", amount: "", description: "" });
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddPayment = async () => {
    if (!payForm.member_id || !payForm.amount) { toast.error("Member and amount required"); return; }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data: gymId } = await supabase.rpc("get_user_gym_id", { _user_id: user.id });
      if (!gymId) throw new Error("No gym assigned");

      const { data: insertedPayments, error } = await supabase.from("payments").insert({
        member_id: payForm.member_id,
        amount: parseFloat(payForm.amount),
        method: payForm.method,
        description: payForm.description || null,
        status: payForm.status,
        gym_id: gymId,
      }).select("*").single();
      if (error) throw error;
      toast.success("Payment recorded");
      setPaymentOpen(false);

      // Fetch gym details and member details for the invoice
      const selectedMember = members.find((m) => m.id === payForm.member_id);
      const { data: gymData } = await supabase
        .from("gyms")
        .select("name, address, phone, email, logo_url, city")
        .eq("id", gymId)
        .single();

      if (insertedPayments && selectedMember && gymData) {
        setInvoiceData({
          gym: gymData as GymFull,
          member: {
            full_name: selectedMember.full_name,
            member_code: selectedMember.member_code,
            phone: selectedMember.phone || null,
            email: selectedMember.email || null,
          },
          payment: {
            id: insertedPayments.id,
            amount: insertedPayments.amount,
            method: insertedPayments.method,
            description: insertedPayments.description || null,
            status: insertedPayments.status,
            payment_date: insertedPayments.payment_date,
          },
        });
      }

      setPayForm({ member_id: "", amount: "", method: "cash", description: "", status: "completed" });
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Finance & Revenue</h1>
          <p className="text-sm text-muted-foreground">Overview</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setPaymentOpen(true)} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" /> Record Payment
          </button>
          <button onClick={() => setExpenseOpen(true)} className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Expense
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Revenue" value={formatCurrency(totalRevenue)} icon={<DollarSign className="w-4 h-4" />} />
        <MetricCard label="Net Profit" value={formatCurrency(netProfit)} changeType={netProfit > 0 ? "positive" : "negative"} icon={<TrendingUp className="w-4 h-4" />} />
        <MetricCard label="Pending Dues" value={formatCurrency(pendingDues)} changeType="negative" icon={<TrendingDown className="w-4 h-4" />} />
        <MetricCard label="Expenses" value={formatCurrency(totalExpenses)} icon={<CreditCard className="w-4 h-4" />} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Payment Breakdown */}
        <div className="xl:col-span-1 bg-card rounded-xl p-5 shadow-surface">
          <h2 className="text-sm font-medium text-foreground mb-4">Payment Methods</h2>
          {paymentBreakdown.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={paymentBreakdown} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={3}>
                    {paymentBreakdown.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2">
                {paymentBreakdown.map((p) => (
                  <div key={p.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                    {p.name}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No payment data yet</p>
          )}
        </div>

        {/* Recent Payments */}
        <div className="xl:col-span-2">
          <h2 className="text-sm font-medium text-foreground mb-3">Recent Payments</h2>
          <DataTable
            columns={[
              { key: "payment_date", header: "Date", render: (r: any) => <span className="text-xs">{new Date(r.payment_date).toLocaleDateString()}</span> },
              { key: "member", header: "Member", render: (r: any) => <span className="text-xs">{r.members?.full_name || "—"}</span> },
              { key: "description", header: "Description", render: (r: any) => <span>{r.description || "—"}</span> },
              { key: "method", header: "Method", render: (r: any) => <span className="capitalize text-xs">{r.method}</span> },
              { key: "amount", header: "Amount", render: (r: any) => <span>₹{Number(r.amount).toLocaleString("en-IN")}</span> },
              { key: "status", header: "Status", render: (r: any) => <span className={`text-xs font-medium ${r.status === "completed" ? "text-primary" : "text-destructive"}`}>{r.status}</span> },
              {
                key: "invoice",
                header: "",
                render: (r: any) => (
                  <button
                    title="View Invoice"
                    onClick={async () => {
                      if (!r.member_id) return;
                      const { data: gymId } = await supabase.rpc("get_user_gym_id", { _user_id: (await supabase.auth.getUser()).data.user?.id });
                      if (!gymId) return;
                      const [{ data: gymData }, { data: memberData }] = await Promise.all([
                        supabase.from("gyms").select("name, address, phone, email, logo_url, city").eq("id", gymId).single(),
                        supabase.from("members").select("full_name, member_code, phone, email").eq("id", r.member_id).single(),
                      ]);
                      if (gymData && memberData) {
                        setInvoiceData({
                          gym: gymData as GymFull,
                          member: memberData as { full_name: string; member_code: string; phone: string | null; email: string | null },
                          payment: { id: r.id, amount: r.amount, method: r.method, description: r.description || null, status: r.status, payment_date: r.payment_date },
                        });
                      }
                    }}
                    className="p-1 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                ),
              },
            ]}
            data={payments.slice(0, 10)}
          />
        </div>
      </div>

      {/* Expenses */}
      <div>
        <h2 className="text-sm font-medium text-foreground mb-3">Recent Expenses</h2>
        <DataTable
          columns={[
            { key: "expense_date", header: "Date", render: (r: any) => <span className="text-xs">{new Date(r.expense_date).toLocaleDateString()}</span> },
            { key: "category", header: "Category" },
            { key: "description", header: "Description", render: (r: any) => <span>{r.description || "—"}</span> },
            { key: "amount", header: "Amount", render: (r: any) => <span>₹{Number(r.amount).toLocaleString("en-IN")}</span> },
          ]}
          data={expenses.slice(0, 10)}
        />
      </div>

      {/* Add Expense Modal */}
      <Dialog open={expenseOpen} onOpenChange={setExpenseOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
            <DialogDescription>Record a new gym expense.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-label mb-1 block">Category *</label>
              <select className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="">Select</option>
                <option value="Payroll">Payroll</option>
                <option value="Utilities">Utilities</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Rent">Rent</option>
                <option value="Operations">Operations</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-label mb-1 block">Amount (₹) *</label>
              <input type="number" className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="18000" />
            </div>
            <div>
              <label className="text-label mb-1 block">Description</label>
              <input className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Monthly electricity bill" />
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setExpenseOpen(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
            <button onClick={handleAddExpense} disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Add Expense
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Payment Modal */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>Record a member payment.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-label mb-1 block">Member *</label>
              <select className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={payForm.member_id} onChange={(e) => setPayForm({ ...payForm, member_id: e.target.value })}>
                <option value="">Select member</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.full_name} ({m.member_code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-label mb-1 block">Amount (₹) *</label>
              <input type="number" className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} placeholder="5000" />
            </div>
            <div>
              <label className="text-label mb-1 block">Method *</label>
              <select className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={payForm.method} onChange={(e) => setPayForm({ ...payForm, method: e.target.value })}>
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="card">Card</option>
                <option value="online">Online</option>
              </select>
            </div>
            <div>
              <label className="text-label mb-1 block">Status</label>
              <select className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={payForm.status} onChange={(e) => setPayForm({ ...payForm, status: e.target.value })}>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div>
              <label className="text-label mb-1 block">Description</label>
              <input className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={payForm.description} onChange={(e) => setPayForm({ ...payForm, description: e.target.value })} placeholder="Monthly subscription" />
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setPaymentOpen(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
            <button onClick={handleAddPayment} disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Record Payment
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice Modal */}
      {invoiceData && (
        <InvoiceModal
          open={!!invoiceData}
          onClose={() => setInvoiceData(null)}
          gym={invoiceData.gym}
          member={invoiceData.member}
          payment={invoiceData.payment}
        />
      )}
    </div>
  );
};

export default Finance;
