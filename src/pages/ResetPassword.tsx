import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Dumbbell, Loader2 } from "lucide-react";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setReady(true);
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { toast.error("Passwords don't match"); return; }
    if (password.length < 6) { toast.error("Minimum 6 characters"); return; }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated! Redirecting...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err: any) { toast.error(err.message); }
    finally { setSubmitting(false); }
  };

  if (!ready) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Dumbbell className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">AuraFarming</span>
        </div>

        <h2 className="text-xl font-semibold text-foreground mb-1">Set New Password</h2>
        <p className="text-sm text-muted-foreground mb-6">Enter your new password below</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-label mb-1.5 block">New Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full bg-surface rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground shadow-surface focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="••••••••" required />
          </div>
          <div>
            <label className="text-label mb-1.5 block">Confirm Password</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
              className="w-full bg-surface rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground shadow-surface focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="••••••••" required />
          </div>
          <button type="submit" disabled={submitting}
            className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
            {submitting ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
