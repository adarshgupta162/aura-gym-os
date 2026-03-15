import { useEffect, useState } from "react";
import { MetricCard } from "@/components/MetricCard";
import { DataTable } from "@/components/DataTable";
import { UserCircle, Calendar, Dumbbell, Tags, Loader2, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const MemberPortal = () => {
  const { user } = useAuth();
  const [member, setMember] = useState<any>(null);
  const [plan, setPlan] = useState<any>(null);
  const [trainer, setTrainer] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      // Find member record linked to this user
      const { data: memberData } = await supabase
        .from("members")
        .select("*, plans(name, price, duration_days, features), trainers(full_name, specialization, phone)")
        .eq("user_id", user.id)
        .single();

      if (memberData) {
        setMember(memberData);
        setPlan(memberData.plans);
        setTrainer(memberData.trainers);

        // Fetch attendance
        const { data: attData } = await supabase
          .from("attendance")
          .select("*")
          .eq("member_id", memberData.id)
          .order("check_in", { ascending: false })
          .limit(20);
        setAttendance(attData || []);
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  if (!member) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <UserCircle className="w-12 h-12 text-muted-foreground" />
        <p className="text-foreground font-medium">No member profile found</p>
        <p className="text-sm text-muted-foreground">Please contact your gym administrator to link your account.</p>
      </div>
    );
  }

  const daysLeft = member.due_date
    ? Math.max(0, Math.ceil((new Date(member.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const thisMonthAttendance = attendance.filter(a => {
    const d = new Date(a.check_in);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Welcome, {member.full_name}</h1>
        <p className="text-sm text-muted-foreground">Member Code: {member.member_code}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Status" value={member.status} icon={<UserCircle className="w-4 h-4" />} />
        <MetricCard label="Days Left" value={daysLeft !== null ? daysLeft : "—"} changeType={daysLeft !== null && daysLeft < 7 ? "negative" : "positive"} icon={<Calendar className="w-4 h-4" />} />
        <MetricCard label="This Month" value={`${thisMonthAttendance} visits`} icon={<Clock className="w-4 h-4" />} />
        <MetricCard label="Plan" value={plan?.name || "No plan"} icon={<Tags className="w-4 h-4" />} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Plan & Trainer Info */}
        <div className="space-y-4">
          {/* Plan Card */}
          <div className="bg-card rounded-xl p-5 shadow-surface">
            <h2 className="text-sm font-medium text-foreground mb-3">My Plan</h2>
            {plan ? (
              <div>
                <p className="text-xl font-semibold text-foreground">₹{plan.price?.toLocaleString("en-IN")}</p>
                <p className="text-xs text-muted-foreground mb-3">{plan.name} · {plan.duration_days} days</p>
                {plan.features && plan.features.length > 0 && (
                  <ul className="space-y-1.5">
                    {plan.features.map((f: string) => (
                      <li key={f} className="text-xs text-muted-foreground flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" /> {f}
                      </li>
                    ))}
                  </ul>
                )}
                {member.due_date && (
                  <p className="mt-3 text-xs text-muted-foreground">Due: {new Date(member.due_date).toLocaleDateString()}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No plan assigned</p>
            )}
          </div>

          {/* Trainer Card */}
          <div className="bg-card rounded-xl p-5 shadow-surface">
            <h2 className="text-sm font-medium text-foreground mb-3">My Trainer</h2>
            {trainer ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Dumbbell className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{trainer.full_name}</p>
                  <p className="text-xs text-muted-foreground">{trainer.specialization || "General"}</p>
                  {trainer.phone && <p className="text-xs text-muted-foreground">{trainer.phone}</p>}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No trainer assigned</p>
            )}
          </div>
        </div>

        {/* Attendance History */}
        <div className="xl:col-span-2">
          <h2 className="text-sm font-medium text-foreground mb-3">Attendance History</h2>
          {attendance.length > 0 ? (
            <DataTable
              columns={[
                { key: "check_in", header: "Date", render: (r: any) => <span className="text-xs">{new Date(r.check_in).toLocaleDateString()}</span> },
                { key: "check_in_time", header: "In", render: (r: any) => <span className="text-xs">{new Date(r.check_in).toLocaleTimeString()}</span> },
                { key: "check_out", header: "Out", render: (r: any) => <span className="text-xs">{r.check_out ? new Date(r.check_out).toLocaleTimeString() : "—"}</span> },
                { key: "method", header: "Method", render: (r: any) => <span className="text-xs capitalize">{r.method}</span> },
              ]}
              data={attendance}
            />
          ) : (
            <div className="bg-card rounded-xl p-8 shadow-surface text-center text-muted-foreground text-sm">No attendance records yet</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemberPortal;
