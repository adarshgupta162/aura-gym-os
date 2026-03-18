
-- Notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id uuid NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  target_type text NOT NULL DEFAULT 'all',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Notification recipients (for specific targeting + read tracking)
CREATE TABLE public.notification_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_recipients ENABLE ROW LEVEL SECURITY;

-- RLS for notifications
CREATE POLICY "Gym admin manages notifications" ON public.notifications
  FOR ALL TO authenticated
  USING (gym_id = get_user_gym_id(auth.uid()) OR is_super_admin(auth.uid()));

CREATE POLICY "Members can view gym notifications" ON public.notifications
  FOR SELECT TO authenticated
  USING (gym_id = get_user_gym_id(auth.uid()));

-- RLS for notification_recipients
CREATE POLICY "Users can view own notifications" ON public.notification_recipients
  FOR ALL TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Gym admin manages recipients" ON public.notification_recipients
  FOR ALL TO authenticated
  USING (notification_id IN (
    SELECT id FROM public.notifications WHERE gym_id = get_user_gym_id(auth.uid())
  ) OR is_super_admin(auth.uid()));

-- Auto-freeze function
CREATE OR REPLACE FUNCTION public.auto_freeze_expired_members()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.members
  SET status = 'frozen', updated_at = now()
  WHERE status = 'active'
    AND due_date IS NOT NULL
    AND due_date < CURRENT_DATE;
END;
$$;
