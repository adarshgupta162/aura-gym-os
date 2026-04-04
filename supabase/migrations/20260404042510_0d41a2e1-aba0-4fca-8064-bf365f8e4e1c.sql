
-- ========== NEW TABLES ==========

-- Diet Plans
CREATE TABLE public.diet_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  trainer_id UUID REFERENCES public.trainers(id),
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  meal_type TEXT NOT NULL DEFAULT 'breakfast',
  description TEXT NOT NULL DEFAULT '',
  calories INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.diet_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Gym scoped diet_plans" ON public.diet_plans FOR ALL TO authenticated USING (gym_id = get_user_gym_id(auth.uid()) OR is_super_admin(auth.uid()));
CREATE POLICY "Members view own diet" ON public.diet_plans FOR SELECT TO authenticated USING (member_id IN (SELECT id FROM members WHERE user_id = auth.uid()));

-- Enquiries / Lead CRM
CREATE TABLE public.enquiries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  interest TEXT,
  follow_up_date DATE,
  status TEXT NOT NULL DEFAULT 'new',
  notes TEXT,
  converted_member_id UUID REFERENCES public.members(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Gym scoped enquiries" ON public.enquiries FOR ALL TO authenticated USING (gym_id = get_user_gym_id(auth.uid()) OR is_super_admin(auth.uid()));

-- Feedback & Ratings
CREATE TABLE public.feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(member_id, month, year)
);
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Gym scoped feedback" ON public.feedback FOR ALL TO authenticated USING (gym_id = get_user_gym_id(auth.uid()) OR is_super_admin(auth.uid()));
CREATE POLICY "Members manage own feedback" ON public.feedback FOR ALL TO authenticated USING (member_id IN (SELECT id FROM members WHERE user_id = auth.uid()));

-- Audit Logs
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  performed_by UUID NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Gym scoped audit_logs" ON public.audit_logs FOR ALL TO authenticated USING (gym_id = get_user_gym_id(auth.uid()) OR is_super_admin(auth.uid()));

-- Inventory
CREATE TABLE public.inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'supplement',
  quantity INTEGER NOT NULL DEFAULT 0,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  selling_price NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'in_stock',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Gym scoped inventory" ON public.inventory FOR ALL TO authenticated USING (gym_id = get_user_gym_id(auth.uid()) OR is_super_admin(auth.uid()));

-- Inventory Sales
CREATE TABLE public.inventory_sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  inventory_id UUID NOT NULL REFERENCES public.inventory(id) ON DELETE CASCADE,
  member_id UUID REFERENCES public.members(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  total_price NUMERIC NOT NULL DEFAULT 0,
  sold_by UUID,
  sold_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.inventory_sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Gym scoped inventory_sales" ON public.inventory_sales FOR ALL TO authenticated USING (gym_id = get_user_gym_id(auth.uid()) OR is_super_admin(auth.uid()));

-- Referrals
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  referrer_member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  referred_name TEXT NOT NULL,
  referred_phone TEXT,
  referred_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reward_type TEXT DEFAULT 'days',
  reward_value INTEGER DEFAULT 7,
  converted_member_id UUID REFERENCES public.members(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Gym scoped referrals" ON public.referrals FOR ALL TO authenticated USING (gym_id = get_user_gym_id(auth.uid()) OR is_super_admin(auth.uid()));
CREATE POLICY "Members view own referrals" ON public.referrals FOR SELECT TO authenticated USING (referrer_member_id IN (SELECT id FROM members WHERE user_id = auth.uid()));

-- Gym Subscriptions (SaaS billing)
CREATE TABLE public.gym_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE UNIQUE,
  plan_tier TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active',
  max_members INTEGER NOT NULL DEFAULT 50,
  price_monthly NUMERIC DEFAULT 0,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.gym_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admin manages subscriptions" ON public.gym_subscriptions FOR ALL TO authenticated USING (is_super_admin(auth.uid()));
CREATE POLICY "Gym admin views own subscription" ON public.gym_subscriptions FOR SELECT TO authenticated USING (gym_id = get_user_gym_id(auth.uid()));

-- Staff Attendance
CREATE TABLE public.staff_attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  trainer_id UUID REFERENCES public.trainers(id) ON DELETE CASCADE,
  user_id UUID,
  check_in TIMESTAMPTZ NOT NULL DEFAULT now(),
  check_out TIMESTAMPTZ,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.staff_attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Gym scoped staff_attendance" ON public.staff_attendance FOR ALL TO authenticated USING (gym_id = get_user_gym_id(auth.uid()) OR is_super_admin(auth.uid()));

-- Add GST number to gyms
ALTER TABLE public.gyms ADD COLUMN IF NOT EXISTS gst_number TEXT;
