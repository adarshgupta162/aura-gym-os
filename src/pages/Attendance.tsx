import { MetricCard } from "@/components/MetricCard";
import { QrCode, Keyboard, Users, Clock } from "lucide-react";
import { useState } from "react";

const recentCheckins = [
  { name: "Arjun Patel", time: "09:42 AM", method: "QR", photo: "AP" },
  { name: "Priya Sharma", time: "09:38 AM", method: "OTP", photo: "PS" },
  { name: "Karan Mehta", time: "09:35 AM", method: "QR", photo: "KM" },
  { name: "Sneha Reddy", time: "09:30 AM", method: "QR", photo: "SR" },
  { name: "Anita Desai", time: "09:22 AM", method: "Manual", photo: "AD" },
  { name: "Rahul Kumar", time: "09:15 AM", method: "QR", photo: "RK" },
  { name: "Divya Nair", time: "09:10 AM", method: "OTP", photo: "DN" },
  { name: "Amit Joshi", time: "08:58 AM", method: "QR", photo: "AJ" },
];

const Attendance = () => {
  const [mode, setMode] = useState<"qr" | "otp">("qr");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Attendance</h1>
        <p className="text-sm text-muted-foreground">42 members currently in-gym</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Today's Check-ins" value="87" icon={<Users className="w-4 h-4" />} />
        <MetricCard label="Currently In-Gym" value="42" icon={<Clock className="w-4 h-4" />} />
        <MetricCard label="Peak Hour" value="6-7 PM" />
        <MetricCard label="Avg Duration" value="1h 24m" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Check-in Panel */}
        <div className="xl:col-span-1 bg-card rounded-xl p-6 shadow-surface flex flex-col items-center">
          <div className="flex bg-surface rounded-lg p-0.5 mb-6 w-full">
            <button
              onClick={() => setMode("qr")}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === "qr" ? "bg-surface-raised text-foreground" : "text-muted-foreground"
              }`}
            >
              <QrCode className="w-4 h-4" /> QR Scan
            </button>
            <button
              onClick={() => setMode("otp")}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === "otp" ? "bg-surface-raised text-foreground" : "text-muted-foreground"
              }`}
            >
              <Keyboard className="w-4 h-4" /> Manual OTP
            </button>
          </div>

          {mode === "qr" ? (
            <div className="w-48 h-48 bg-surface-raised rounded-xl flex items-center justify-center border-2 border-dashed border-border mb-4">
              <div className="text-center">
                <QrCode className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Camera feed here</p>
              </div>
            </div>
          ) : (
            <div className="w-full mb-4">
              <label className="text-label mb-2 block">Enter Member OTP</label>
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                className="w-full bg-surface rounded-lg px-4 py-3 text-lg text-center text-foreground font-mono placeholder:text-muted-foreground shadow-surface focus:outline-none focus:ring-1 focus:ring-accent tracking-[0.5em]"
              />
            </div>
          )}

          <button className="w-full py-3 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
            Verify & Check-in
          </button>
        </div>

        {/* Recent Check-ins */}
        <div className="xl:col-span-2 bg-card rounded-xl p-5 shadow-surface">
          <h2 className="text-sm font-medium text-foreground mb-4">Recent Check-ins</h2>
          <div className="space-y-2">
            {recentCheckins.map((c, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-surface-raised transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                    {c.photo}
                  </div>
                  <div>
                    <p className="text-sm text-foreground font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.time}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  c.method === "QR" ? "bg-primary/10 text-primary" : c.method === "OTP" ? "bg-accent/10 text-accent" : "bg-amber/10 text-amber"
                }`}>
                  {c.method}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
