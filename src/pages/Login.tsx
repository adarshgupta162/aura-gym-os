import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Dumbbell, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

const Login = () => {
  const { user, loading, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const { error } = await signIn(email, password);
    if (error) setError(error.message);
    setSubmitting(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) { toast.error("Enter your email"); return; }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setResetSent(true);
      toast.success("Reset link sent! Check your email.");
    } catch (err: any) { toast.error(err.message); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-card items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
        <div className="relative z-10 text-center px-12">
          <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-6">
            <Dumbbell className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-3">AuraFarming</h1>
          <p className="text-lg text-muted-foreground">Fitness Solutions</p>
          <p className="text-sm text-muted-foreground mt-6 max-w-sm mx-auto">
            Complete gym management platform. Powering fitness businesses across India.
          </p>
        </div>
      </div>

      {/* Right - Form */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">AuraFarming</span>
          </div>

          {forgotMode ? (
            <>
              <h2 className="text-xl font-semibold text-foreground mb-1">Reset Password</h2>
              <p className="text-sm text-muted-foreground mb-6">Enter your email to receive a reset link</p>

              {resetSent ? (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <Dumbbell className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-foreground font-medium">Check your email!</p>
                  <p className="text-sm text-muted-foreground">We've sent a password reset link to {resetEmail}</p>
                  <button onClick={() => { setForgotMode(false); setResetSent(false); }}
                    className="text-sm text-accent hover:underline">Back to Sign In</button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <label className="text-label mb-1.5 block">Email</label>
                    <input type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full bg-surface rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground shadow-surface focus:outline-none focus:ring-1 focus:ring-accent"
                      placeholder="your@email.com" required />
                  </div>
                  <button type="submit" disabled={submitting}
                    className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
                    {submitting ? "Sending..." : "Send Reset Link"}
                  </button>
                  <button type="button" onClick={() => setForgotMode(false)}
                    className="w-full text-sm text-muted-foreground hover:text-foreground">
                    Back to Sign In
                  </button>
                </form>
              )}
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-foreground mb-1">Sign in</h2>
              <p className="text-sm text-muted-foreground mb-6">Enter your credentials to access the platform</p>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-label mb-1.5 block">Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-surface rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground shadow-surface focus:outline-none focus:ring-1 focus:ring-accent"
                    placeholder="admin@gym.com" required />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-label">Password</label>
                    <button type="button" onClick={() => { setForgotMode(true); setResetEmail(email); }}
                      className="text-xs text-accent hover:underline">Forgot password?</button>
                  </div>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-surface rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground shadow-surface focus:outline-none focus:ring-1 focus:ring-accent pr-10"
                      placeholder="••••••••" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={submitting}
                  className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
                  {submitting ? "Signing in..." : "Sign In"}
                </button>
              </form>
            </>
          )}

          <div className="mt-6 text-center">
            <a href="/legal" className="text-xs text-muted-foreground hover:text-foreground">Terms of Service · Privacy Policy</a>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-4">
            Powered by AuraFarming Fitness Solutions
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
