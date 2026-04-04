import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, Star, TrendingUp } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";

const Feedback = () => {
  const { gym } = useAuth();
  const [feedback, setFeedback] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("feedback").select("*, members(full_name, member_code)").order("created_at", { ascending: false });
      setFeedback(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const avgRating = feedback.length > 0 ? (feedback.reduce((s, f) => s + f.rating, 0) / feedback.length).toFixed(1) : "0";
  const nps = feedback.length > 0 ? (
    ((feedback.filter(f => f.rating >= 4).length - feedback.filter(f => f.rating <= 2).length) / feedback.length * 100).toFixed(0)
  ) : "0";
  const ratingDist = [1,2,3,4,5].map(r => ({ rating: r, count: feedback.filter(f => f.rating === r).length }));

  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Feedback & Ratings</h1>
        <p className="text-sm text-muted-foreground">{feedback.length} responses collected</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard label="Avg Rating" value={`${avgRating}/5`} icon={<Star className="w-4 h-4" />} />
        <MetricCard label="NPS Score" value={nps} changeType={Number(nps) > 0 ? "positive" : "negative"} icon={<TrendingUp className="w-4 h-4" />} />
        <MetricCard label="Total Responses" value={feedback.length} />
      </div>

      <div className="bg-card rounded-xl p-5 shadow-surface">
        <h2 className="text-sm font-medium text-foreground mb-4">Rating Distribution</h2>
        <div className="space-y-2">
          {ratingDist.reverse().map(r => (
            <div key={r.rating} className="flex items-center gap-3">
              <span className="text-sm text-foreground w-8">{r.rating}★</span>
              <div className="flex-1 bg-surface rounded-full h-3">
                <div className="bg-primary rounded-full h-3 transition-all" style={{ width: `${feedback.length > 0 ? (r.count / feedback.length * 100) : 0}%` }} />
              </div>
              <span className="text-xs text-muted-foreground w-8 text-right">{r.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {feedback.map(f => (
          <div key={f.id} className="bg-card rounded-xl p-4 shadow-surface">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{f.members?.full_name}</p>
                <p className="text-xs text-muted-foreground">{f.members?.member_code}</p>
              </div>
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map(s => <Star key={s} className={`w-3.5 h-3.5 ${s <= f.rating ? "text-amber-400 fill-amber-400" : "text-muted"}`} />)}
              </div>
            </div>
            {f.comment && <p className="text-sm text-muted-foreground mt-2">{f.comment}</p>}
            <p className="text-xs text-muted-foreground mt-1">{new Date(f.created_at).toLocaleDateString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Feedback;
