import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Lock, User, Bell } from "lucide-react";

const SettingsPage = () => {
  const { user, gym, isSuperAdmin, activeRole, signOut } = useAuth();
  const [passwordForm, setPasswordForm] = useState({ new: "", confirm: "" });
  const [changingPassword, setChangingPassword] = useState(false);
  const [profileForm, setProfileForm] = useState({ full_name: user?.user_metadata?.full_name || "", phone: "" });
  const [savingProfile, setSavingProfile] = useState(false);

  const handleChangePassword = async () => {
    if (passwordForm.new !== passwordForm.confirm) { toast.error("Passwords don't match"); return; }
    if (passwordForm.new.length < 6) { toast.error("Min 6 characters"); return; }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordForm.new });
      if (error) throw error;
      toast.success("Password updated!");
      setPasswordForm({ new: "", confirm: "" });
    } catch (err: any) { toast.error(err.message); }
    finally { setChangingPassword(false); }
  };

  const handleUpdateProfile = async () => {
    if (!profileForm.full_name) { toast.error("Name required"); return; }
    setSavingProfile(true);
    try {
      const { error } = await supabase.auth.updateUser({ data: { full_name: profileForm.full_name } });
      if (error) throw error;
      if (user) {
        await supabase.from("profiles").update({ full_name: profileForm.full_name, phone: profileForm.phone || null }).eq("user_id", user.id);
      }
      toast.success("Profile updated!");
    } catch (err: any) { toast.error(err.message); }
    finally { setSavingProfile(false); }
  };

  const roleLabel = isSuperAdmin ? "Super Admin" : activeRole?.replace("_", " ") || "User";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground capitalize">{roleLabel} · {gym?.name || "AuraFarming"}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile */}
        <div className="bg-card rounded-xl p-5 shadow-surface">
          <h2 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2"><User className="w-4 h-4" /> Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="text-label mb-1.5 block">Name</label>
              <input value={profileForm.full_name} onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                className="w-full bg-surface rounded-lg px-3 py-2 text-sm text-foreground shadow-surface focus:outline-none focus:ring-1 focus:ring-accent" />
            </div>
            <div>
              <label className="text-label mb-1.5 block">Email</label>
              <input value={user?.email || ""} disabled
                className="w-full bg-surface rounded-lg px-3 py-2 text-sm text-muted-foreground shadow-surface" />
            </div>
            <div>
              <label className="text-label mb-1.5 block">Phone</label>
              <input value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                className="w-full bg-surface rounded-lg px-3 py-2 text-sm text-foreground shadow-surface focus:outline-none focus:ring-1 focus:ring-accent" placeholder="9876543210" />
            </div>
            <button onClick={handleUpdateProfile} disabled={savingProfile}
              className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center gap-2">
              {savingProfile && <Loader2 className="w-4 h-4 animate-spin" />} Update Profile
            </button>
          </div>
        </div>

        {/* Security */}
        <div className="bg-card rounded-xl p-5 shadow-surface">
          <h2 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2"><Lock className="w-4 h-4" /> Security</h2>
          <div className="space-y-4">
            <div>
              <label className="text-label mb-1.5 block">New Password</label>
              <input type="password" value={passwordForm.new} onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                className="w-full bg-surface rounded-lg px-3 py-2 text-sm text-foreground shadow-surface focus:outline-none focus:ring-1 focus:ring-accent" placeholder="••••••••" />
            </div>
            <div>
              <label className="text-label mb-1.5 block">Confirm Password</label>
              <input type="password" value={passwordForm.confirm} onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                className="w-full bg-surface rounded-lg px-3 py-2 text-sm text-foreground shadow-surface focus:outline-none focus:ring-1 focus:ring-accent" placeholder="••••••••" />
            </div>
            <button onClick={handleChangePassword} disabled={changingPassword}
              className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center gap-2">
              {changingPassword && <Loader2 className="w-4 h-4 animate-spin" />} Change Password
            </button>
          </div>
        </div>

        {/* Notifications Preferences */}
        {(isSuperAdmin || activeRole === "gym_admin") && (
          <div className="bg-card rounded-xl p-5 shadow-surface">
            <h2 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2"><Bell className="w-4 h-4" /> Notification Preferences</h2>
            <div className="space-y-3">
              {["Equipment maintenance alerts", "Payment overdue alerts", "New member registrations", "Subscription expiry warnings"].map((item) => (
                <div key={item} className="flex items-center justify-between py-2">
                  <span className="text-sm text-foreground">{item}</span>
                  <div className="w-10 h-5 bg-primary rounded-full relative cursor-pointer">
                    <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-primary-foreground rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Account */}
        <div className="bg-card rounded-xl p-5 shadow-surface">
          <h2 className="text-sm font-medium text-foreground mb-4">Account</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-foreground">Role</span>
              <span className="text-sm text-muted-foreground capitalize">{roleLabel}</span>
            </div>
            {gym && (
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-foreground">Gym</span>
                <span className="text-sm text-muted-foreground">{gym.name} ({gym.code})</span>
              </div>
            )}
            <button onClick={signOut}
              className="w-full py-2.5 bg-destructive/10 text-destructive rounded-lg text-sm font-medium hover:bg-destructive/20 transition-colors mt-4">
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
