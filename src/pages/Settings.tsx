const SettingsPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your platform configuration</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile */}
        <div className="bg-card rounded-xl p-5 shadow-surface">
          <h2 className="text-sm font-medium text-foreground mb-4">Super Admin Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="text-label mb-1.5 block">Name</label>
              <input defaultValue="Super Admin" className="w-full bg-surface rounded-lg px-3 py-2 text-sm text-foreground shadow-surface focus:outline-none focus:ring-1 focus:ring-accent" />
            </div>
            <div>
              <label className="text-label mb-1.5 block">Email</label>
              <input defaultValue="admin@aurafarming.com" className="w-full bg-surface rounded-lg px-3 py-2 text-sm text-foreground shadow-surface focus:outline-none focus:ring-1 focus:ring-accent" />
            </div>
            <button className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors">
              Update Profile
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-card rounded-xl p-5 shadow-surface">
          <h2 className="text-sm font-medium text-foreground mb-4">Notifications</h2>
          <div className="space-y-3">
            {["Equipment maintenance alerts", "Payment overdue alerts", "New member registrations", "Churn risk warnings"].map((item) => (
              <div key={item} className="flex items-center justify-between py-2">
                <span className="text-sm text-foreground">{item}</span>
                <div className="w-10 h-5 bg-primary rounded-full relative cursor-pointer">
                  <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-primary-foreground rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
