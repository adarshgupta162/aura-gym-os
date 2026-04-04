import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Plus, Loader2, Package, ShoppingCart, Trash2, Minus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { MetricCard } from "@/components/MetricCard";
import { DataTable } from "@/components/DataTable";
import { StatusDot } from "@/components/StatusDot";

const Inventory = () => {
  const { gym } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [sellOpen, setSellOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", category: "supplement", quantity: "", unit_price: "", selling_price: "" });
  const [sellForm, setSellForm] = useState({ inventory_id: "", member_id: "", quantity: "1" });

  const fetchData = async () => {
    const [itemsRes, salesRes, memRes] = await Promise.all([
      supabase.from("inventory").select("*").order("name"),
      supabase.from("inventory_sales").select("*, inventory(name), members(full_name)").order("sold_at", { ascending: false }).limit(50),
      supabase.from("members").select("id, full_name"),
    ]);
    setItems(itemsRes.data || []);
    setSales(salesRes.data || []);
    setMembers(memRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = async () => {
    if (!form.name || !form.selling_price || !gym) { toast.error("Name and price required"); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from("inventory").insert({
        gym_id: gym.id, name: form.name, category: form.category,
        quantity: parseInt(form.quantity) || 0, unit_price: parseFloat(form.unit_price) || 0,
        selling_price: parseFloat(form.selling_price),
      });
      if (error) throw error;
      toast.success("Item added");
      setAddOpen(false);
      setForm({ name: "", category: "supplement", quantity: "", unit_price: "", selling_price: "" });
      fetchData();
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleSell = async () => {
    if (!sellForm.inventory_id || !gym) { toast.error("Select an item"); return; }
    setSaving(true);
    try {
      const item = items.find(i => i.id === sellForm.inventory_id);
      if (!item) throw new Error("Item not found");
      const qty = parseInt(sellForm.quantity) || 1;
      if (qty > item.quantity) { toast.error("Not enough stock"); setSaving(false); return; }

      await supabase.from("inventory_sales").insert({
        gym_id: gym.id, inventory_id: sellForm.inventory_id,
        member_id: sellForm.member_id || null, quantity: qty,
        total_price: qty * Number(item.selling_price),
      });
      await supabase.from("inventory").update({ quantity: item.quantity - qty }).eq("id", item.id);
      toast.success("Sale recorded");
      setSellOpen(false);
      setSellForm({ inventory_id: "", member_id: "", quantity: "1" });
      fetchData();
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const totalStock = items.reduce((s, i) => s + i.quantity, 0);
  const totalSalesValue = sales.reduce((s, sale) => s + Number(sale.total_price), 0);
  const lowStock = items.filter(i => i.quantity < 5).length;

  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Inventory</h1>
          <p className="text-sm text-muted-foreground">{items.length} items in stock</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setSellOpen(true)} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" /> Record Sale
          </button>
          <button onClick={() => setAddOpen(true)} className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:bg-accent/90 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard label="Total Items" value={totalStock} icon={<Package className="w-4 h-4" />} />
        <MetricCard label="Sales Revenue" value={`₹${totalSalesValue.toLocaleString("en-IN")}`} icon={<ShoppingCart className="w-4 h-4" />} />
        <MetricCard label="Low Stock" value={lowStock} changeType={lowStock > 0 ? "negative" : "positive"} icon={<Minus className="w-4 h-4" />} />
      </div>

      <DataTable
        columns={[
          { key: "name", header: "Item" },
          { key: "category", header: "Category", render: (r: any) => <span className="capitalize text-xs">{r.category}</span> },
          { key: "quantity", header: "Stock", render: (r: any) => <span className={r.quantity < 5 ? "text-destructive font-medium" : ""}>{r.quantity}</span> },
          { key: "selling_price", header: "Price", render: (r: any) => <span>₹{Number(r.selling_price).toLocaleString("en-IN")}</span> },
          { key: "status", header: "Status", render: (r: any) => <StatusDot status={r.quantity > 5 ? "operational" : r.quantity > 0 ? "warning" : "critical"} label={r.quantity > 5 ? "In Stock" : r.quantity > 0 ? "Low" : "Out"} /> },
        ]}
        data={items}
      />

      {sales.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-foreground mb-3">Recent Sales</h2>
          <DataTable
            columns={[
              { key: "sold_at", header: "Date", render: (r: any) => <span className="text-xs">{new Date(r.sold_at).toLocaleDateString()}</span> },
              { key: "item", header: "Item", render: (r: any) => <span>{r.inventory?.name || "—"}</span> },
              { key: "member", header: "Member", render: (r: any) => <span>{r.members?.full_name || "Walk-in"}</span> },
              { key: "quantity", header: "Qty" },
              { key: "total_price", header: "Total", render: (r: any) => <span>₹{Number(r.total_price).toLocaleString("en-IN")}</span> },
            ]}
            data={sales}
          />
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Inventory Item</DialogTitle><DialogDescription>Add supplement or merchandise.</DialogDescription></DialogHeader>
          <div className="space-y-3 py-2">
            <div><label className="text-label mb-1 block">Name *</label><input className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Whey Protein 1kg" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-label mb-1 block">Category</label>
                <select className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                  <option value="supplement">Supplement</option><option value="merchandise">Merchandise</option><option value="beverage">Beverage</option><option value="other">Other</option>
                </select>
              </div>
              <div><label className="text-label mb-1 block">Quantity</label><input type="number" className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} placeholder="20" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-label mb-1 block">Cost Price (₹)</label><input type="number" className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={form.unit_price} onChange={e => setForm({...form, unit_price: e.target.value})} placeholder="2000" /></div>
              <div><label className="text-label mb-1 block">Selling Price (₹) *</label><input type="number" className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={form.selling_price} onChange={e => setForm({...form, selling_price: e.target.value})} placeholder="2500" /></div>
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setAddOpen(false)} className="px-4 py-2 text-sm text-muted-foreground">Cancel</button>
            <button onClick={handleAdd} disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">{saving ? "..." : "Add Item"}</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={sellOpen} onOpenChange={setSellOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Record Sale</DialogTitle><DialogDescription>Sell an item to a member or walk-in.</DialogDescription></DialogHeader>
          <div className="space-y-3 py-2">
            <div><label className="text-label mb-1 block">Item *</label>
              <select className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={sellForm.inventory_id} onChange={e => setSellForm({...sellForm, inventory_id: e.target.value})}>
                <option value="">Select</option>
                {items.filter(i => i.quantity > 0).map(i => <option key={i.id} value={i.id}>{i.name} (₹{i.selling_price}, {i.quantity} left)</option>)}
              </select>
            </div>
            <div><label className="text-label mb-1 block">Member</label>
              <select className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={sellForm.member_id} onChange={e => setSellForm({...sellForm, member_id: e.target.value})}>
                <option value="">Walk-in</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
              </select>
            </div>
            <div><label className="text-label mb-1 block">Quantity</label><input type="number" min="1" className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={sellForm.quantity} onChange={e => setSellForm({...sellForm, quantity: e.target.value})} /></div>
          </div>
          <DialogFooter>
            <button onClick={() => setSellOpen(false)} className="px-4 py-2 text-sm text-muted-foreground">Cancel</button>
            <button onClick={handleSell} disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">{saving ? "..." : "Sell"}</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Inventory;
