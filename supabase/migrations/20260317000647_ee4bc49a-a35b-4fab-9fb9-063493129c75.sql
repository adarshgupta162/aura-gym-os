
-- daily_codes table for daily gym check-in codes
CREATE TABLE public.daily_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  code text NOT NULL,
  qr_token text NOT NULL DEFAULT gen_random_uuid()::text,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(gym_id, date)
);

ALTER TABLE public.daily_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gym scoped daily_codes" ON public.daily_codes
  FOR ALL TO authenticated
  USING (gym_id = get_user_gym_id(auth.uid()) OR is_super_admin(auth.uid()));

CREATE POLICY "Members can view daily codes for their gym" ON public.daily_codes
  FOR SELECT TO authenticated
  USING (gym_id = get_user_gym_id(auth.uid()));

-- Add marked_by and audit_note to attendance
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS marked_by uuid;
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS audit_note text;
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS date date DEFAULT CURRENT_DATE;

-- workout_plans table
CREATE TABLE public.workout_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  trainer_id uuid REFERENCES public.trainers(id),
  day_of_week int NOT NULL,
  exercise_name text NOT NULL,
  sets int DEFAULT 3,
  reps text DEFAULT '12',
  notes text,
  is_done boolean DEFAULT false,
  week_start date DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gym scoped workout_plans" ON public.workout_plans
  FOR ALL TO authenticated
  USING (gym_id = get_user_gym_id(auth.uid()) OR is_super_admin(auth.uid()));

CREATE POLICY "Members can view own workouts" ON public.workout_plans
  FOR SELECT TO authenticated
  USING (member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid()));

CREATE POLICY "Members can update own workouts" ON public.workout_plans
  FOR UPDATE TO authenticated
  USING (member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid()));

-- progress_logs table
CREATE TABLE public.progress_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  gym_id uuid NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  log_type text NOT NULL DEFAULT 'weight',
  value numeric,
  unit text DEFAULT 'kg',
  notes text,
  photo_url text,
  logged_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.progress_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can manage own progress" ON public.progress_logs
  FOR ALL TO authenticated
  USING (member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid()));

CREATE POLICY "Gym scoped progress" ON public.progress_logs
  FOR ALL TO authenticated
  USING (gym_id = get_user_gym_id(auth.uid()) OR is_super_admin(auth.uid()));

-- member_xp table
CREATE TABLE public.member_xp (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  gym_id uuid NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  xp int NOT NULL DEFAULT 0,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.member_xp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view own xp" ON public.member_xp
  FOR SELECT TO authenticated
  USING (member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid()));

CREATE POLICY "Gym scoped xp" ON public.member_xp
  FOR ALL TO authenticated
  USING (gym_id = get_user_gym_id(auth.uid()) OR is_super_admin(auth.uid()));
