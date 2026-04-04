import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, MapPin, Phone, Mail, Dumbbell, Send } from "lucide-react";
import { toast } from "sonner";

const PublicGymPage = () => {
  const { code } = useParams<{ code: string }>();
  const [gym, setGym] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [enquiryForm, setEnquiryForm] = useState({ name: "", phone: "", interest: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      if (!code) { setLoading(false); return; }
      const { data: gymData } = await supabase.from("gyms").select("*").eq("code", code.toUpperCase()).eq("is_active", true).single();
      if (gymData) {
        setGym(gymData);
        const { data: plansData } = await supabase.from("plans").select("*").eq("gym_id", gymData.id).eq("is_active", true).order("price");
        setPlans(plansData || []);
      }
      setLoading(false);
    };
    fetch();
  }, [code]);

  const handleEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enquiryForm.name || !gym) { toast.error("Name required"); return; }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("enquiries").insert({
        gym_id: gym.id, name: enquiryForm.name, phone: enquiryForm.phone || null, interest: enquiryForm.interest || null,
      });
      if (error) throw error;
      setSubmitted(true);
      toast.success("Enquiry submitted!");
    } catch (err: any) { toast.error(err.message); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;

  if (!gym) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Dumbbell className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">Gym Not Found</h1>
        <p className="text-muted-foreground">This gym page doesn't exist or is inactive.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: `${gym.secondary_color || "#0a0a0a"}` }}>
      {/* Hero */}
      <div className="relative py-20 px-6 text-center" style={{ background: `linear-gradient(135deg, ${gym.primary_color}20, transparent)` }}>
        <div className="max-w-2xl mx-auto">
          {gym.logo_url ? (
            <img src={gym.logo_url} alt={gym.name} className="w-24 h-24 rounded-2xl mx-auto mb-6 object-cover" />
          ) : (
            <div className="w-24 h-24 rounded-2xl mx-auto mb-6 flex items-center justify-center text-3xl font-bold" style={{ backgroundColor: gym.primary_color, color: gym.secondary_color || "#fff" }}>
              {gym.code?.substring(0, 2)}
            </div>
          )}
          <h1 className="text-4xl font-bold mb-3" style={{ color: gym.primary_color }}>{gym.name}</h1>
          <div className="flex flex-wrap justify-center gap-4 text-sm mt-4" style={{ color: "#999" }}>
            {gym.city && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {gym.city}{gym.address ? `, ${gym.address}` : ""}</span>}
            {gym.phone && <span className="flex items-center gap-1"><Phone className="w-4 h-4" /> {gym.phone}</span>}
            {gym.email && <span className="flex items-center gap-1"><Mail className="w-4 h-4" /> {gym.email}</span>}
          </div>
        </div>
      </div>

      {/* Plans */}
      {plans.length > 0 && (
        <div className="max-w-4xl mx-auto px-6 py-12">
          <h2 className="text-2xl font-bold text-center mb-8" style={{ color: gym.primary_color }}>Membership Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan, i) => (
              <div key={plan.id} className={`rounded-2xl p-6 border ${i === 1 ? "border-2" : "border-border"}`}
                style={i === 1 ? { borderColor: gym.primary_color, backgroundColor: `${gym.primary_color}10` } : { backgroundColor: "rgba(255,255,255,0.03)" }}>
                <h3 className="text-lg font-semibold mb-2" style={{ color: "#eee" }}>{plan.name}</h3>
                <p className="text-3xl font-bold mb-1" style={{ color: gym.primary_color }}>₹{plan.price.toLocaleString("en-IN")}</p>
                <p className="text-xs mb-4" style={{ color: "#777" }}>{plan.duration_days} days</p>
                {plan.features?.map((f: string) => (
                  <p key={f} className="text-sm flex items-center gap-2 py-1" style={{ color: "#aaa" }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: gym.primary_color }} /> {f}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enquiry Form */}
      <div className="max-w-md mx-auto px-6 py-12">
        <h2 className="text-xl font-bold text-center mb-6" style={{ color: gym.primary_color }}>Interested? Get in Touch</h2>
        {submitted ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: `${gym.primary_color}20` }}>
              <Send className="w-8 h-8" style={{ color: gym.primary_color }} />
            </div>
            <p className="text-lg font-semibold" style={{ color: "#eee" }}>Thank you!</p>
            <p className="text-sm" style={{ color: "#777" }}>We'll get back to you soon.</p>
          </div>
        ) : (
          <form onSubmit={handleEnquiry} className="space-y-4">
            <input value={enquiryForm.name} onChange={e => setEnquiryForm({...enquiryForm, name: e.target.value})}
              className="w-full rounded-lg px-4 py-3 text-sm bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-1" style={{ focusRingColor: gym.primary_color }}
              placeholder="Your Name *" required />
            <input value={enquiryForm.phone} onChange={e => setEnquiryForm({...enquiryForm, phone: e.target.value})}
              className="w-full rounded-lg px-4 py-3 text-sm bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-1"
              placeholder="Phone Number" />
            <input value={enquiryForm.interest} onChange={e => setEnquiryForm({...enquiryForm, interest: e.target.value})}
              className="w-full rounded-lg px-4 py-3 text-sm bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-1"
              placeholder="What are you interested in?" />
            <button type="submit" disabled={submitting}
              className="w-full py-3 rounded-lg text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: gym.primary_color, color: gym.secondary_color || "#000" }}>
              {submitting ? "Submitting..." : "Join Now →"}
            </button>
          </form>
        )}
      </div>

      <div className="text-center py-6 text-xs" style={{ color: "#555" }}>
        Powered by <span className="font-medium">AuraFarming</span>
      </div>
    </div>
  );
};

export default PublicGymPage;
