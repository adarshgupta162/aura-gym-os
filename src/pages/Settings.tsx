import { useEffect, useState } from "react";
import { Loader2, Lock, User, Bell, Building2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const SettingsPage = () => {
  const { user, gym, isSuperAdmin, activeRole } = useAuth();
  const [profile, setProfile] = useState({ full_name: "", phone: "" });
  const [gymSettings, setGymSettings] = useState({ name: "", email: "", phone: "", primary_color: "#22c55e", secondary_color: "#0a0a0a" });
  const [passwordForm, setPasswordForm] = useState({ new: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: profileData } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
      if (profileData) setProfile({ full_name: profileData.full_name, phone: profileData.phone || "" });

      if (gym) {
        setGymSettings({
          name: gym.name, email: "", phone: "",
          primary_color: gym.primary_color || "#22c55e",
          secondary_color: gym.secondary_color || "#0a0a0a",
        });
        const { data: gymData } = await supabase.from("gyms").select("email, phone").eq("id", gym.id).single();
        if (gymData) setGymSettings(prev => ({ ...prev, email: gymData.email || "", phone: gymData.phone || "" }));
      }
      setLoading(false);
    };
    fetch();
  }, [user, gym]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").update({ full_name: profile.full_name, phone: profile.phone || null }).eq("user_id", user.id);
      if (error) throw error;
      toast.success("Profile updated");
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleSaveGym = async () => {
    if (!gym) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("gyms").update({
        name: gymSettings.name, email: gymSettings.email || null, phone: gymSettings.phone || null,
        primary_color: gymSettings.primary_color, secondary_color: gymSettings.secondary_color,
      }).eq("id", gym.id);
      if (error) throw error;
      toast.success("Gym settings updated");
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

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

  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground capitalize">{activeRole?.replace("_", " ")} settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile */}
        <div className="bg-card rounded-xl p-5 shadow-surface">
          <h2 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2"><User className="w-4 h-4" /> Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="text-label mb-1.5 block">Name</label>
              <input value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                className="w-full bg-surface rounded-lg px-3 py-2 text-sm text-foreground shadow-surface focus:outline-none focus:ring-1 focus:ring-accent" />
            </div>
            <div>
              <label className="text-label mb-1.5 block">Email</label>
              <input value={user?.email || ""} disabled
                className="w-full bg-surface rounded-lg px-3 py-2 text-sm text-muted-foreground shadow-surface" />
            </div>
            <div>
              <label className="text-label mb-1.5 block">Phone</label>
              <input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full bg-surface rounded-lg px-3 py-2 text-sm text-foreground shadow-surface focus:outline-none focus:ring-1 focus:ring-accent" placeholder="9876543210" />
            </div>
            <button onClick={handleSaveProfile} disabled={saving}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} <Save className="w-4 h-4" /> Save Profile
            </button>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-card rounded-xl p-5 shadow-surface">
          <h2 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2"><Lock className="w-4 h-4" /> Change Password</h2>
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
              {changingPassword && <Loader2 className="w-4 h-4 animate-spin" />} Update Password
            </button>
          </div>
        </div>

        {/* Gym Settings - only for gym_admin */}
        {(activeRole === "gym_admin" || isSuperAdmin) && gym && (
          <div className="bg-card rounded-xl p-5 shadow-surface lg:col-span-2">
            <h2 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2"><Building2 className="w-4 h-4" /> Gym Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-label mb-1.5 block">Gym Name</label>
                <input value={gymSettings.name} onChange={(e) => setGymSettings({ ...gymSettings, name: e.target.value })}
                  className="w-full bg-surface rounded-lg px-3 py-2 text-sm text-foreground shadow-surface focus:outline-none focus:ring-1 focus:ring-accent" />
              </div>
              <div>
                <label className="text-label mb-1.5 block">Email</label>
                <input value={gymSettings.email} onChange={(e) => setGymSettings({ ...gymSettings, email: e.target.value })}
                  className="w-full bg-surface rounded-lg px-3 py-2 text-sm text-foreground shadow-surface focus:outline-none focus:ring-1 focus:ring-accent" />
              </div>
              <div>
                <label className="text-label mb-1.5 block">Phone</label>
                <input value={gymSettings.phone} onChange={(e) => setGymSettings({ ...gymSettings, phone: e.target.value })}
                  className="w-full bg-surface rounded-lg px-3 py-2 text-sm text-foreground shadow-surface focus:outline-none focus:ring-1 focus:ring-accent" />
              </div>
              <div className="flex gap-4">
                <div>
                  <label className="text-label mb-1.5 block">Primary Color</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={gymSettings.primary_color} onChange={(e) => setGymSettings({ ...gymSettings, primary_color: e.target.value })} className="w-8 h-8 rounded cursor-pointer border-0 p-0" />
                    <span className="text-xs text-muted-foreground">{gymSettings.primary_color}</span>
                  </div>
                </div>
                <div>
                  <label className="text-label mb-1.5 block">Secondary Color</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={gymSettings.secondary_color} onChange={(e) => setGymSettings({ ...gymSettings, secondary_color: e.target.value })} className="w-8 h-8 rounded cursor-pointer border-0 p-0" />
                    <span className="text-xs text-muted-foreground">{gymSettings.secondary_color}</span>
                  </div>
                </div>
              </div>
            </div>
            <button onClick={handleSaveGym} disabled={saving}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} <Save className="w-4 h-4" /> Save Gym Settings
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
