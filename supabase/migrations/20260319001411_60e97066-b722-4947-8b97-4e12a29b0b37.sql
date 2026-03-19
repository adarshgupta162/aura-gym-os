ALTER TABLE public.gyms ADD COLUMN IF NOT EXISTS admin_email text;
ALTER TABLE public.gyms ADD COLUMN IF NOT EXISTS admin_initial_password text;