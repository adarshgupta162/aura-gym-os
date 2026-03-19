import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, CheckCircle, ChevronRight, ChevronLeft, User, Heart, Phone, ClipboardList } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TrainerInfo { id: string; full_name: string; }
interface PlanInfo { id: string; name: string; price: number; duration_days: number; }
interface GymInfo { id: string; name: string; code: string; }

interface AddMemberModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (credentials: { code: string; email: string; password: string }, planId: string, memberName: string) => void;
  trainers: TrainerInfo[];
  plans: PlanInfo[];
  gym: GymInfo | null;
  nextCode: string;
}

const STEPS = [
  { id: 1, label: "Basic Info", icon: User },
  { id: 2, label: "Health Info", icon: Heart },
  { id: 3, label: "Emergency", icon: Phone },
  { id: 4, label: "Review", icon: ClipboardList },
];

const FITNESS_GOALS = ["Weight Loss", "Muscle Gain", "General Fitness", "Rehabilitation"];
const FITNESS_LEVELS = ["Beginner", "Intermediate", "Advanced"];
const MEDICAL_CONDITION_OPTIONS = ["Diabetes", "BP", "Heart", "Joint Issues", "Back Problems", "None"];

const initialForm = {
  // Basic Info
  full_name: "",
  phone: "",
  email: "",
  password: "",
  dob: "",
  gender: "",
  join_date: new Date().toISOString().split("T")[0],
  plan_id: "",
  trainer_id: "",
  // Health Info
  weight: "",
  height: "",
  fitness_goal: "",
  fitness_level: "",
  medical_conditions: [] as string[],
  medical_notes: "",
  // Emergency Contact
  emergency_name: "",
  emergency_relationship: "",
  emergency_phone: "",
  // Admin Notes
  admin_notes: "",
  trainer_instructions: "",
};

export function AddMemberModal({ open, onClose, onSuccess, trainers, plans, gym, nextCode }: AddMemberModalProps) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initialForm);

  const set = (field: keyof typeof initialForm, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const toggleMedical = (condition: string) => {
    setForm((f) => {
      const current = f.medical_conditions;
      if (condition === "None") {
        return { ...f, medical_conditions: current.includes("None") ? [] : ["None"] };
      }
      const filtered = current.filter((c) => c !== "None");
      return {
        ...f,
        medical_conditions: filtered.includes(condition)
          ? filtered.filter((c) => c !== condition)
          : [...filtered, condition],
      };
    });
  };

  const handleClose = () => {
    setStep(1);
    setForm(initialForm);
    onClose();
  };

  const validateStep1 = () => {
    if (!form.full_name.trim()) { toast.error("Full name is required"); return false; }
    if (!form.phone.trim()) { toast.error("Phone number is required"); return false; }
    if (!form.email.trim()) { toast.error("Email is required"); return false; }
    if (!form.password.trim()) { toast.error("Password is required"); return false; }
    if (!form.dob) { toast.error("Date of birth is required"); return false; }
    if (!form.gender) { toast.error("Gender is required"); return false; }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    setStep((s) => Math.min(s + 1, 4));
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    if (!gym) { toast.error("No gym context found"); return; }
    setSaving(true);
    try {
      const code = nextCode;
      const selectedPlan = plans.find((p) => p.id === form.plan_id);
      let dueDate = "";
      if (selectedPlan) {
        const d = new Date(form.join_date || new Date().toISOString().split("T")[0]);
        d.setDate(d.getDate() + selectedPlan.duration_days);
        dueDate = d.toISOString().split("T")[0];
      }

      // Create auth account via edge function
      const res = await supabase.functions.invoke("create-user", {
        body: {
          email: form.email,
          password: form.password,
          full_name: form.full_name,
          role: "member",
          gym_id: gym.id,
        },
      });
      if (res.error) throw new Error(res.error.message || "Failed to create account");
      if (res.data?.error) throw new Error(res.data.error);

      const userId = res.data?.user_id;

      const { error } = await supabase.from("members").insert({
        member_code: code,
        full_name: form.full_name,
        phone: form.phone || null,
        email: form.email || null,
        weight: form.weight || null,
        gym_id: gym.id,
        plan_id: form.plan_id || null,
        trainer_id: form.trainer_id || null,
        joined_at: form.join_date || new Date().toISOString().split("T")[0],
        due_date: dueDate || null,
        user_id: userId || null,
      });
      if (error) throw error;

      toast.success(`Member ${code} created`);
      onSuccess({ code, email: form.email, password: form.password }, form.plan_id, form.full_name);
      handleClose();
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full bg-input rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent";
  const labelCls = "text-label mb-1 block text-xs font-medium text-muted-foreground";

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Member</DialogTitle>
          <DialogDescription>
            {nextCode ? `Member Code: ${nextCode} · Gym: ${gym?.name || ""}` : "Loading..."}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-0 mt-1 mb-4">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = step === s.id;
            const isDone = step > s.id;
            return (
              <div key={s.id} className="flex items-center flex-1 min-w-0">
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                    isDone ? "bg-primary text-primary-foreground" :
                    isActive ? "bg-accent text-accent-foreground" :
                    "bg-surface-raised text-muted-foreground"
                  }`}>
                    {isDone ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className={`text-[10px] font-medium whitespace-nowrap ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-px flex-1 mx-2 mb-4 transition-colors ${isDone ? "bg-primary" : "bg-border"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Full Name *</label>
                <input className={inputCls} value={form.full_name} onChange={(e) => set("full_name", e.target.value)} placeholder="Arjun Patel" />
              </div>
              <div>
                <label className={labelCls}>Phone Number *</label>
                <input className={inputCls} value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="9876543210" type="tel" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Email (for login) *</label>
                <input className={inputCls} type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="arjun@email.com" />
              </div>
              <div>
                <label className={labelCls}>Password (temporary) *</label>
                <input className={inputCls} type="password" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="Temporary password" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Date of Birth *</label>
                <input className={inputCls} type="date" value={form.dob} onChange={(e) => set("dob", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Gender *</label>
                <select className={inputCls} value={form.gender} onChange={(e) => set("gender", e.target.value)}>
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Join Date</label>
                <input className={inputCls} type="date" value={form.join_date} onChange={(e) => set("join_date", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Plan</label>
                <select className={inputCls} value={form.plan_id} onChange={(e) => set("plan_id", e.target.value)}>
                  <option value="">No plan</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} (₹{p.price})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Trainer Assignment</label>
                <select className={inputCls} value={form.trainer_id} onChange={(e) => set("trainer_id", e.target.value)}>
                  <option value="">No trainer</option>
                  {trainers.map((t) => (
                    <option key={t.id} value={t.id}>{t.full_name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Health Info */}
        {step === 2 && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Current Weight (kg)</label>
                <input className={inputCls} type="number" value={form.weight} onChange={(e) => set("weight", e.target.value)} placeholder="e.g. 75" />
              </div>
              <div>
                <label className={labelCls}>Height (cm)</label>
                <input className={inputCls} type="number" value={form.height} onChange={(e) => set("height", e.target.value)} placeholder="e.g. 175" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Fitness Goal</label>
                <select className={inputCls} value={form.fitness_goal} onChange={(e) => set("fitness_goal", e.target.value)}>
                  <option value="">Select goal</option>
                  {FITNESS_GOALS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Fitness Level</label>
                <select className={inputCls} value={form.fitness_level} onChange={(e) => set("fitness_level", e.target.value)}>
                  <option value="">Select level</option>
                  {FITNESS_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={labelCls}>Medical Conditions</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {MEDICAL_CONDITION_OPTIONS.map((cond) => (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => toggleMedical(cond)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      form.medical_conditions.includes(cond)
                        ? "bg-accent text-accent-foreground border-accent"
                        : "bg-surface text-muted-foreground border-border hover:border-accent"
                    }`}
                  >
                    {cond}
                  </button>
                ))}
              </div>
              <textarea
                className={`${inputCls} resize-none`}
                rows={3}
                value={form.medical_notes}
                onChange={(e) => set("medical_notes", e.target.value)}
                placeholder="Additional medical details or notes..."
              />
            </div>
          </div>
        )}

        {/* Step 3: Emergency Contact */}
        {step === 3 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Emergency contact information for this member.</p>
            <div>
              <label className={labelCls}>Contact Name</label>
              <input className={inputCls} value={form.emergency_name} onChange={(e) => set("emergency_name", e.target.value)} placeholder="Contact full name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Relationship</label>
                <input className={inputCls} value={form.emergency_relationship} onChange={(e) => set("emergency_relationship", e.target.value)} placeholder="e.g. Parent, Spouse" />
              </div>
              <div>
                <label className={labelCls}>Phone Number</label>
                <input className={inputCls} type="tel" value={form.emergency_phone} onChange={(e) => set("emergency_phone", e.target.value)} placeholder="9876543210" />
              </div>
            </div>
            <div className="pt-2 border-t border-border">
              <p className="text-xs font-semibold text-foreground mb-2">Admin Notes</p>
              <div className="space-y-2">
                <div>
                  <label className={labelCls}>Private Notes (admin only)</label>
                  <textarea
                    className={`${inputCls} resize-none`}
                    rows={3}
                    value={form.admin_notes}
                    onChange={(e) => set("admin_notes", e.target.value)}
                    placeholder="Internal notes visible only to admins..."
                  />
                </div>
                <div>
                  <label className={labelCls}>Special Trainer Instructions</label>
                  <textarea
                    className={`${inputCls} resize-none`}
                    rows={3}
                    value={form.trainer_instructions}
                    onChange={(e) => set("trainer_instructions", e.target.value)}
                    placeholder="Special instructions for the assigned trainer..."
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Review & Confirm */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="bg-surface rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Basic Info</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <ReviewRow label="Full Name" value={form.full_name} />
                <ReviewRow label="Phone" value={form.phone || "—"} />
                <ReviewRow label="Email" value={form.email} />
                <ReviewRow label="Date of Birth" value={form.dob || "—"} />
                <ReviewRow label="Gender" value={form.gender || "—"} />
                <ReviewRow label="Join Date" value={form.join_date || "—"} />
                <ReviewRow label="Plan" value={plans.find((p) => p.id === form.plan_id)?.name || "No plan"} />
                <ReviewRow label="Trainer" value={trainers.find((t) => t.id === form.trainer_id)?.full_name || "No trainer"} />
              </div>
            </div>
            <div className="bg-surface rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Health Info</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <ReviewRow label="Weight" value={form.weight ? `${form.weight} kg` : "—"} />
                <ReviewRow label="Height" value={form.height ? `${form.height} cm` : "—"} />
                <ReviewRow label="Fitness Goal" value={form.fitness_goal || "—"} />
                <ReviewRow label="Fitness Level" value={form.fitness_level || "—"} />
                <ReviewRow label="Medical Conditions" value={form.medical_conditions.length ? form.medical_conditions.join(", ") : "—"} />
              </div>
            </div>
            <div className="bg-surface rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Emergency Contact</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <ReviewRow label="Name" value={form.emergency_name || "—"} />
                <ReviewRow label="Relationship" value={form.emergency_relationship || "—"} />
                <ReviewRow label="Phone" value={form.emergency_phone || "—"} />
              </div>
            </div>
            {(form.admin_notes || form.trainer_instructions) && (
              <div className="bg-surface rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Admin Notes</p>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  {form.admin_notes && <ReviewRow label="Private Notes" value={form.admin_notes} />}
                  {form.trainer_instructions && <ReviewRow label="Trainer Instructions" value={form.trainer_instructions} />}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
          <button
            onClick={handleBack}
            disabled={step === 1}
            className="flex items-center gap-1 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex items-center gap-3">
            <button onClick={handleClose} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              Cancel
            </button>
            {step < 4 ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-1 px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Add Member
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  );
}
