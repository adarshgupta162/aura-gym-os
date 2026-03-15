import { useEffect, useState } from "react";
import { MetricCard } from "@/components/MetricCard";
import { DataTable } from "@/components/DataTable";
import { StatusDot } from "@/components/StatusDot";
import { Users, DollarSign, Dumbbell, TrendingUp, AlertTriangle, Clock, Building2, Loader2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const Dashboard = () => {
  const { isSuperAdmin } = useAuth();
  const [stats, setStats] = useState({ members: 0, trainers: 0, gyms: 0, equipment: 0, equipmentAlerts: 0 });
  const [recentMembers, setRecentMembers] = useState<any[]>([]);
  const [equipmentAlerts, setEquipmentAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const [membersRes, trainersRes, gymsRes, equipRes, recentRes, alertsRes] = await Promise.all([
        supabase.from("members").select("*", { count: "exact", head: true }),
        supabase.from("trainers").select("*", { count: "exact", head: true }),
        supabase.from("gyms").select("*", { count: "exact", head: true }),
        supabase.from("equipment").select("*", { count: "exact", head: true }),
        supabase.from("members").select("member_code, full_name, status, created_at").order("created_at", { ascending: false }).limit(8),
        supabase.from("equipment").select("name, status, notes").in("status", ["warning", "critical", "maintenance_due"]).limit(5),
      ]);

      setStats({
        members: membersRes.count || 0,
        trainers: trainersRes.count || 0,
        gyms: gymsRes.count || 0,
        equipment: equipRes.count || 0,
        equipmentAlerts: alertsRes.data?.length || 0,
      });
      setRecentMembers(recentRes.data || []);
      setEquipmentAlerts(alertsRes.data || []);
      setLoading(false);
    };
    fetchAll();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {isSuperAdmin ? `${stats.gyms} Gyms · ` : ""}{stats.members} Members · March 15, 2026
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isSuperAdmin && (
          <MetricCard label="Total Gyms" value={stats.gyms} icon={<Building2 className="w-4 h-4" />} />
        )}
        <MetricCard label="Total Members" value={stats.members} icon={<Users className="w-4 h-4" />} />
        <MetricCard label="Total Trainers" value={stats.trainers} icon={<Dumbbell className="w-4 h-4" />} />
        <MetricCard
          label="Equipment Alerts"
          value={stats.equipmentAlerts}
          changeType={stats.equipmentAlerts > 0 ? "negative" : "positive"}
          icon={<AlertTriangle className="w-4 h-4" />}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Members */}
        <div className="xl:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-foreground">Recent Members</h2>
          </div>
          {recentMembers.length > 0 ? (
            <DataTable
              columns={[
                { key: "member_code", header: "Code" },
                {
                  key: "full_name",
                  header: "Member",
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
                  key: "status",
                  header: "Status",
                  render: (row: any) => (
                    <StatusDot
                      status={row.status === "active" ? "operational" : row.status === "expiring" ? "warning" : "critical"}
                      label={row.status}
                    />
                  ),
                },
                {
                  key: "created_at",
                  header: "Joined",
                  render: (row: any) => <span className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleDateString()}</span>,
                },
              ]}
              data={recentMembers}
            />
          ) : (
            <div className="bg-card rounded-xl p-8 shadow-surface text-center text-muted-foreground text-sm">
              No members yet. Add a gym first, then add members.
            </div>
          )}
        </div>

        {/* Equipment Alerts */}
        <div className="bg-card rounded-xl p-5 shadow-surface">
          <h2 className="text-sm font-medium text-foreground mb-4">Equipment Alerts</h2>
          {equipmentAlerts.length > 0 ? (
            <div className="space-y-3">
              {equipmentAlerts.map((eq, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div>
                    <p className="text-sm text-foreground">{eq.name}</p>
                    <p className="text-xs text-muted-foreground">{eq.notes || eq.status}</p>
                  </div>
                  <StatusDot status={eq.status === "critical" ? "critical" : "warning"} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">All equipment operational ✓</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
