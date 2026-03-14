import { Search, Bell, ChevronDown } from "lucide-react";
import { useState } from "react";

const gyms = [
  { id: "1", name: "AuraFarming HQ" },
  { id: "2", name: "Downtown Fitness" },
  { id: "3", name: "East Side Gym" },
];

export function TopBar({ sidebarWidth }: { sidebarWidth: number }) {
  const [selectedGym, setSelectedGym] = useState(gyms[0]);
  const [showGymDropdown, setShowGymDropdown] = useState(false);

  return (
    <header
      className="fixed top-0 right-0 z-30 h-16 border-b border-border bg-background/80 backdrop-blur-sm flex items-center px-6 gap-4"
      style={{ left: sidebarWidth }}
    >
      {/* Gym Switcher */}
      <div className="relative">
        <button
          onClick={() => setShowGymDropdown(!showGymDropdown)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface shadow-surface text-sm hover:bg-surface-raised transition-colors"
        >
          <div className="w-5 h-5 rounded bg-primary/20 flex items-center justify-center">
            <span className="text-primary text-[10px] font-bold">{selectedGym.name[0]}</span>
          </div>
          <span className="text-foreground font-medium">{selectedGym.name}</span>
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        </button>
        {showGymDropdown && (
          <div className="absolute top-full mt-1 left-0 w-56 bg-surface rounded-lg shadow-surface-lg border border-border py-1 z-50">
            {gyms.map((gym) => (
              <button
                key={gym.id}
                onClick={() => { setSelectedGym(gym); setShowGymDropdown(false); }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-surface-raised transition-colors ${
                  gym.id === selectedGym.id ? "text-primary" : "text-foreground"
                }`}
              >
                {gym.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Search */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search members, equipment, plans..."
            className="w-full bg-surface rounded-lg pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground shadow-surface focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-lg hover:bg-surface transition-colors">
          <Bell className="w-4 h-4 text-muted-foreground" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
        </button>
        <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
          <span className="text-accent text-xs font-bold">SA</span>
        </div>
      </div>
    </header>
  );
}
