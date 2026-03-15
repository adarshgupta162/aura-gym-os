import { useEffect, useState } from "react";
import { MetricCard } from "@/components/MetricCard";
import { DataTable } from "@/components/DataTable";
import { StatusDot } from "@/components/StatusDot";
import { Users, Dumbbell, TrendingUp, AlertTriangle, Building2, Loader2, CreditCard, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState({ gyms: 0, activeGyms: 0 });
  const [gyms, setGyms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [gymsRes, activeRes] = await Promise.all([
        supabase.from("gyms").select("id, name, code, city, is_active, created_at").order("created_at", { ascending: false }),
        supabase.from("gyms").select("*", { count: "exact", head: true }).eq("is_active", true),
      ]);
      setGyms(gymsRes.data || []);
      setStats({ gyms: gymsRes.data?.length || 0, activeGyms: activeRes.count || 0 });
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Platform Overview</h1>
        <p className="text-sm text-muted-foreground">Manage all gyms from here</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard label="Total Gyms" value={stats.gyms} icon={<Building2 className="w-4 h-4" />} />
        <MetricCard label="Active Gyms" value={stats.activeGyms} changeType="positive" icon={<TrendingUp className="w-4 h-4" />} />
        <MetricCard label="Platform Revenue" value="—" icon={<DollarSign className="w-4 h-4" />} />
      </div>
      <DataTable
        columns={[
          { key: "code", header: "Code", className: "w-20" },
          { key: "name", header: "Gym Name" },
          { key: "city", header: "City", render: (r: any) => <span>{r.city || "—"}</span> },
          { key: "is_active", header: "Status", render: (r: any) => <StatusDot status={r.is_active ? "operational" : "critical"} label={r.is_active ? "active" : "inactive"} /> },
        ]}
        data={gyms}
      />
    </div>
  );
};

const GymAdminDashboard = () => {
  const [stats, setStats] = useState({ members: 0, trainers: 0, equipment: 0, alerts: 0, revenue: 0 });
  const [recentMembers, setRecentMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [membersRes, trainersRes, equipRes, alertsRes, recentRes, paymentsRes] = await Promise.all([
        supabase.from("members").select("*", { count: "exact", head: true }),
        supabase.from("trainers").select("*", { count: "exact", head: true }),
        supabase.from("equipment").select("*", { count: "exact", head: true }),
        supabase.from("equipment").select("*", { count: "exact", head: true }).in("status", ["warning", "critical", "maintenance_due"]),
        supabase.from("members").select("member_code, full_name, status, created_at").order("created_at", { ascending: false }).limit(8),
        supabase.from("payments").select("amount").eq("status", "completed"),
      ]);
      const totalRev = (paymentsRes.data || []).reduce((s, p) => s + Number(p.amount), 0);
      setStats({
        members: membersRes.count || 0,
        trainers: trainersRes.count || 0,
        equipment: equipRes.count || 0,
        alerts: alertsRes.count || 0,
        revenue: totalRev,
      });
      setRecentMembers(recentRes.data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const formatCurrency = (n: number) => {
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
    if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
    return `₹${n}`;
  };

  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Gym Dashboard</h1>
        <p className="text-sm text-muted-foreground">{stats.members} Members · {stats.trainers} Trainers</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Members" value={stats.members} icon={<Users className="w-4 h-4" />} />
        <MetricCard label="Total Trainers" value={stats.trainers} icon={<Dumbbell className="w-4 h-4" />} />
        <MetricCard label="Revenue" value={formatCurrency(stats.revenue)} icon={<CreditCard className="w-4 h-4" />} />
        <MetricCard label="Equipment Alerts" value={stats.alerts} changeType={stats.alerts > 0 ? "negative" : "positive"} icon={<AlertTriangle className="w-4 h-4" />} />
      </div>
      <div>
        <h2 className="text-sm font-medium text-foreground mb-3">Recent Members</h2>
        {recentMembers.length > 0 ? (
          <DataTable
            columns={[
              { key: "member_code", header: "Code" },
              {
                key: "full_name", header: "Member",
                render: (row: any) => (
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-surface-raised flex items-center justify-center text-xs font-medium text-muted-foreground">
                      {row.full_name.split(" ").map((n: string) => n[0]).join("")}
                    </div>
                    <span className="text-foreground font-medium">{row.full_name}</span>
                  </div>
                ),
              },
              {
                key: "status", header: "Status",
                render: (row: any) => <StatusDot status={row.status === "active" ? "operational" : row.status === "expiring" ? "warning" : "critical"} label={row.status} />,
              },
            ]}
            data={recentMembers}
          />
        ) : (
          <div className="bg-card rounded-xl p-8 shadow-surface text-center text-muted-foreground text-sm">No members yet.</div>
        )}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { isSuperAdmin } = useAuth();
  return isSuperAdmin ? <SuperAdminDashboard /> : <GymAdminDashboard />;
};

export default Dashboard;
