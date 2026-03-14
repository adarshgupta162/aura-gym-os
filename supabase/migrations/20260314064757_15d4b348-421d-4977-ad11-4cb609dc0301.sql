
-- ============================================
-- AuraFarming Multi-Tenant Gym SaaS Schema
-- ============================================

-- Role enum
CREATE TYPE public.app_role AS ENUM ('super_admin', 'gym_admin', 'trainer', 'member');

-- ============================================
-- GYMS TABLE
-- ============================================
CREATE TABLE public.gyms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#22c55e',
  secondary_color TEXT DEFAULT '#0a0a0a',
  address TEXT,
  city TEXT,
  phone TEXT,
  email TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  gym_id UUID REFERENCES public.gyms(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- USER ROLES TABLE (separate from profiles per security rules)
-- ============================================
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  gym_id UUID REFERENCES public.gyms(id) ON DELETE CASCADE,
  UNIQUE(user_id, role, gym_id)
);

-- ============================================
-- PLANS TABLE
-- ============================================
CREATE TABLE public.plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  duration_days INTEGER NOT NULL,
  features TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- TRAINERS TABLE
-- ============================================
CREATE TABLE public.trainers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  trainer_code TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  specialization TEXT,
  salary NUMERIC(10,2),
  status TEXT NOT NULL DEFAULT 'active',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- MEMBERS TABLE
-- ============================================
CREATE TABLE public.members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  member_code TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL,
  trainer_id UUID REFERENCES public.trainers(id) ON DELETE SET NULL,
  weight TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  due_date DATE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- ATTENDANCE TABLE
-- ============================================
CREATE TABLE public.attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  check_in TIMESTAMPTZ NOT NULL DEFAULT now(),
  check_out TIMESTAMPTZ,
  method TEXT NOT NULL DEFAULT 'manual'
);

-- ============================================
-- EQUIPMENT TABLE
-- ============================================
CREATE TABLE public.equipment (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  purchase_date DATE,
  warranty_until DATE,
  status TEXT NOT NULL DEFAULT 'operational',
  last_maintenance DATE,
  next_maintenance DATE,
  cost NUMERIC(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- PAYMENTS TABLE
-- ============================================
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
  amount NUMERIC(10,2) NOT NULL,
  method TEXT NOT NULL DEFAULT 'cash',
  status TEXT NOT NULL DEFAULT 'completed',
  description TEXT,
  payment_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- EXPENSES TABLE
-- ============================================
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(10,2) NOT NULL,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================
ALTER TABLE public.gyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SECURITY DEFINER FUNCTIONS (avoid RLS recursion)
-- ============================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_gym_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT gym_id FROM public.user_roles
  WHERE user_id = _user_id AND role IN ('gym_admin', 'trainer', 'member')
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'super_admin'
  )
$$;

-- ============================================
-- RLS POLICIES
-- ============================================

-- GYMS: super_admin sees all, others see their gym
CREATE POLICY "Super admin can manage gyms" ON public.gyms FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()));
CREATE POLICY "Users can view their gym" ON public.gyms FOR SELECT TO authenticated
  USING (id = public.get_user_gym_id(auth.uid()));

-- PROFILES: users see own profile, super_admin sees all
CREATE POLICY "Users can manage own profile" ON public.profiles FOR ALL TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Super admin can view all profiles" ON public.profiles FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()));

-- USER ROLES: super_admin manages all, users can read own
CREATE POLICY "Super admin manages roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()));
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- GYM-SCOPED TABLES: gym_admin sees their gym data, super_admin sees all
-- Plans
CREATE POLICY "Gym admin manages plans" ON public.plans FOR ALL TO authenticated
  USING (gym_id = public.get_user_gym_id(auth.uid()) OR public.is_super_admin(auth.uid()));
CREATE POLICY "Members can view plans" ON public.plans FOR SELECT TO authenticated
  USING (gym_id = public.get_user_gym_id(auth.uid()));

-- Trainers
CREATE POLICY "Gym admin manages trainers" ON public.trainers FOR ALL TO authenticated
  USING (gym_id = public.get_user_gym_id(auth.uid()) OR public.is_super_admin(auth.uid()));
CREATE POLICY "Members can view trainers" ON public.trainers FOR SELECT TO authenticated
  USING (gym_id = public.get_user_gym_id(auth.uid()));

-- Members
CREATE POLICY "Gym admin manages members" ON public.members FOR ALL TO authenticated
  USING (gym_id = public.get_user_gym_id(auth.uid()) OR public.is_super_admin(auth.uid()));
CREATE POLICY "Members can view own record" ON public.members FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Attendance
CREATE POLICY "Gym scoped attendance" ON public.attendance FOR ALL TO authenticated
  USING (gym_id = public.get_user_gym_id(auth.uid()) OR public.is_super_admin(auth.uid()));

-- Equipment
CREATE POLICY "Gym scoped equipment" ON public.equipment FOR ALL TO authenticated
  USING (gym_id = public.get_user_gym_id(auth.uid()) OR public.is_super_admin(auth.uid()));

-- Payments
CREATE POLICY "Gym scoped payments" ON public.payments FOR ALL TO authenticated
  USING (gym_id = public.get_user_gym_id(auth.uid()) OR public.is_super_admin(auth.uid()));

-- Expenses
CREATE POLICY "Gym scoped expenses" ON public.expenses FOR ALL TO authenticated
  USING (gym_id = public.get_user_gym_id(auth.uid()) OR public.is_super_admin(auth.uid()));

-- ============================================
-- TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_gyms_updated_at BEFORE UPDATE ON public.gyms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON public.plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_trainers_updated_at BEFORE UPDATE ON public.trainers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON public.members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_equipment_updated_at BEFORE UPDATE ON public.equipment FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_members_gym_id ON public.members(gym_id);
CREATE INDEX idx_members_member_code ON public.members(member_code);
CREATE INDEX idx_trainers_gym_id ON public.trainers(gym_id);
CREATE INDEX idx_trainers_trainer_code ON public.trainers(trainer_code);
CREATE INDEX idx_attendance_gym_id ON public.attendance(gym_id);
CREATE INDEX idx_attendance_member_id ON public.attendance(member_id);
CREATE INDEX idx_payments_gym_id ON public.payments(gym_id);
CREATE INDEX idx_equipment_gym_id ON public.equipment(gym_id);
CREATE INDEX idx_expenses_gym_id ON public.expenses(gym_id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
