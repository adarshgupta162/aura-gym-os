import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface NotificationPrefs {
  equipment_maintenance: boolean;
  payment_overdue: boolean;
  new_member_registration: boolean;
  churn_risk: boolean;
}

const defaultPrefs: NotificationPrefs = {
  equipment_maintenance: true,
  payment_overdue: true,
  new_member_registration: true,
  churn_risk: true,
};

const prefLabels: { key: keyof NotificationPrefs; label: string }[] = [
  { key: "equipment_maintenance", label: "Equipment maintenance alerts" },
  { key: "payment_overdue", label: "Payment overdue alerts" },
  { key: "new_member_registration", label: "New member registrations" },
  { key: "churn_risk", label: "Churn risk warnings" },
];

const SettingsPage = () => {
  const { user, gym } = useAuth();
  const gymId = gym?.id ?? null;

  /* ---- profile state ---- */
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  /* ---- notification prefs state ---- */
  const [prefs, setPrefs] = useState<NotificationPrefs>(defaultPrefs);
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [prefsMsg, setPrefsMsg] = useState<string | null>(null);

  /* ---- load profile ---- */
  useEffect(() => {
    if (!user) return;
    setEmail(user.email ?? "");

    const loadProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .single();
      if (data) setFullName(data.full_name);
    };

    const loadPrefs = async () => {
      let query = supabase
        .from("notification_preferences")
        .select("equipment_maintenance, payment_overdue, new_member_registration, churn_risk")
        .eq("user_id", user.id);
      if (gymId) {
        query = query.eq("gym_id", gymId);
      } else {
        query = query.is("gym_id", null);
      }
      const { data } = await query.maybeSingle();
      if (data) {
        setPrefs({
          equipment_maintenance: data.equipment_maintenance,
          payment_overdue: data.payment_overdue,
          new_member_registration: data.new_member_registration,
          churn_risk: data.churn_risk,
        });
      }
    };

    loadProfile();
    loadPrefs();
  }, [user, gymId]);

  /* ---- save profile ---- */
  const handleProfileUpdate = async () => {
    if (!user) return;
    setProfileSaving(true);
    setProfileMsg(null);

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName })
      .eq("user_id", user.id);

    setProfileSaving(false);
    setProfileMsg(error ? "Failed to update profile." : "Profile updated!");
  };

  /* ---- toggle & save a notification pref ---- */
  const togglePref = async (key: keyof NotificationPrefs) => {
    if (!user) return;
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    setPrefsSaving(true);
    setPrefsMsg(null);

    const { error } = await supabase
      .from("notification_preferences")
      .upsert(
        { user_id: user.id, gym_id: gymId, ...updated },
        { onConflict: "user_id,gym_id" }
      );

    setPrefsSaving(false);
    setPrefsMsg(error ? "Failed to save preference." : "Preferences saved!");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your platform configuration</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile */}
        <div className="bg-card rounded-xl p-5 shadow-surface">
          <h2 className="text-sm font-medium text-foreground mb-4">Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="text-label mb-1.5 block">Name</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-surface rounded-lg px-3 py-2 text-sm text-foreground shadow-surface focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <div>
              <label className="text-label mb-1.5 block">Email</label>
              <input
                value={email}
                disabled
                className="w-full bg-surface rounded-lg px-3 py-2 text-sm text-foreground shadow-surface opacity-60 cursor-not-allowed"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleProfileUpdate}
                disabled={profileSaving}
                className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
              >
                {profileSaving ? "Saving…" : "Update Profile"}
              </button>
              {profileMsg && (
                <span className="text-xs text-muted-foreground">{profileMsg}</span>
              )}
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-card rounded-xl p-5 shadow-surface">
          <h2 className="text-sm font-medium text-foreground mb-4">Notifications</h2>
          <div className="space-y-3">
            {prefLabels.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between py-2">
                <span className="text-sm text-foreground">{label}</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={prefs[key]}
                  onClick={() => togglePref(key)}
                  className={`w-10 h-5 rounded-full relative transition-colors ${
                    prefs[key] ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-4 h-4 bg-primary-foreground rounded-full transition-transform ${
                      prefs[key] ? "right-0.5" : "left-0.5"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
          {prefsMsg && (
            <p className="text-xs text-muted-foreground mt-3">{prefsMsg}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
