import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Plus, Loader2, Trash2, UtensilsCrossed } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

const mealTypes = ["breakfast", "morning_snack", "lunch", "evening_snack", "dinner", "pre_workout", "post_workout"];
const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const DietPlans = () => {
  const { gym, user } = useAuth();
  const [plans, setPlans] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedMember, setSelectedMember] = useState("");
  const [form, setForm] = useState({ member_id: "", trainer_id: "", day_of_week: 0, meal_type: "breakfast", description: "", calories: "" });

  const fetchData = async () => {
    const [plansRes, memRes, trainRes] = await Promise.all([
      supabase.from("diet_plans").select("*, members(full_name, member_code), trainers(full_name)").order("day_of_week"),
      supabase.from("members").select("id, full_name, member_code"),
      supabase.from("trainers").select("id, full_name"),
    ]);
    setPlans(plansRes.data || []);
    setMembers(memRes.data || []);
    setTrainers(trainRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filteredPlans = selectedMember ? plans.filter(p => p.member_id === selectedMember) : plans;

  const handleAdd = async () => {
    if (!form.member_id || !form.description) { toast.error("Member and description required"); return; }
    if (!gym) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("diet_plans").insert({
        gym_id: gym.id, member_id: form.member_id, trainer_id: form.trainer_id || null,
        day_of_week: form.day_of_week, meal_type: form.meal_type,
        description: form.description, calories: form.calories ? parseInt(form.calories) : null,
      });
      if (error) throw error;
      toast.success("Diet plan added");
      setOpen(false);
      setForm({ member_id: "", trainer_id: "", day_of_week: 0, meal_type: "breakfast", description: "", calories: "" });
      fetchData();
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("diet_plans").delete().eq("id", id);
    toast.success("Deleted");
    fetchData();
  };

  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Diet Plans</h1>
          <p className="text-sm text-muted-foreground">{plans.length} meal plans assigned</p>
        </div>
        <button onClick={() => setOpen(true)} className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors flex items-center gap-2 self-start">
          <Plus className="w-4 h-4" /> Add Meal Plan
        </button>
      </div>

      <div>
        <select value={selectedMember} onChange={e => setSelectedMember(e.target.value)}
          className="bg-surface rounded-lg px-3 py-2 text-sm text-foreground shadow-surface focus:outline-none focus:ring-1 focus:ring-accent">
          <option value="">All Members</option>
          {members.map(m => <option key={m.id} value={m.id}>{m.full_name} ({m.member_code})</option>)}
        </select>
      </div>

      {filteredPlans.length === 0 ? (
        <div className="bg-card rounded-xl p-12 shadow-surface text-center">
          <UtensilsCrossed className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-foreground font-medium">No diet plans yet</p>
        </div>
      ) : (
        dayNames.map((dayName, dayIdx) => {
          const dayPlans = filteredPlans.filter(p => p.day_of_week === dayIdx);
          if (dayPlans.length === 0) return null;
          return (
            <div key={dayIdx} className="bg-card rounded-xl p-5 shadow-surface">
              <h2 className="text-sm font-medium text-foreground mb-3">{dayName}</h2>
              <div className="space-y-2">
                {dayPlans.map(p => (
                  <div key={p.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-surface">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium uppercase text-accent">{p.meal_type.replace("_", " ")}</span>
                        {p.calories && <span className="text-xs text-muted-foreground">· {p.calories} kcal</span>}
                      </div>
                      <p className="text-sm text-foreground mt-0.5">{p.description}</p>
                      <p className="text-xs text-muted-foreground">{p.members?.full_name} {p.trainers ? `· by ${p.trainers.full_name}` : ""}</p>
                    </div>
                    <button onClick={() => handleDelete(p.id)} className="p-1.5 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Meal Plan</DialogTitle><DialogDescription>Assign a diet plan entry for a member.</DialogDescription></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-label mb-1 block">Member *</label>
              <select className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={form.member_id} onChange={e => setForm({...form, member_id: e.target.value})}>
                <option value="">Select</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-label mb-1 block">Day</label>
                <select className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={form.day_of_week} onChange={e => setForm({...form, day_of_week: parseInt(e.target.value)})}>
                  {dayNames.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-label mb-1 block">Meal</label>
                <select className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={form.meal_type} onChange={e => setForm({...form, meal_type: e.target.value})}>
                  {mealTypes.map(m => <option key={m} value={m}>{m.replace("_", " ")}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-label mb-1 block">Description *</label>
              <textarea className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground min-h-[60px]" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="4 eggs, oats with milk, banana" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-label mb-1 block">Calories</label>
                <input type="number" className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={form.calories} onChange={e => setForm({...form, calories: e.target.value})} placeholder="450" />
              </div>
              <div>
                <label className="text-label mb-1 block">Trainer</label>
                <select className="w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground" value={form.trainer_id} onChange={e => setForm({...form, trainer_id: e.target.value})}>
                  <option value="">None</option>
                  {trainers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-muted-foreground">Cancel</button>
            <button onClick={handleAdd} disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Add
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DietPlans;
