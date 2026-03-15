import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "super_admin" | "gym_admin" | "trainer" | "member";

interface UserRole {
  role: AppRole;
  gym_id: string | null;
}

interface GymBranding {
  id: string;
  name: string;
  code: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  roles: UserRole[];
  activeRole: AppRole | null;
  gym: GymBranding | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [gym, setGym] = useState<GymBranding | null>(null);
  const [loading, setLoading] = useState(true);

  const activeRole = roles.length > 0 ? roles[0].role : null;
  const isSuperAdmin = roles.some((r) => r.role === "super_admin");

  const fetchUserData = async (userId: string) => {
    // Fetch roles
    const { data: rolesData } = await supabase
      .from("user_roles")
      .select("role, gym_id")
      .eq("user_id", userId);

    const userRoles = (rolesData || []) as UserRole[];
    setRoles(userRoles);

    // Fetch gym branding for non-super-admin
    const gymRole = userRoles.find((r) => r.gym_id);
    if (gymRole?.gym_id) {
      const { data: gymData } = await supabase
        .from("gyms")
        .select("id, name, code, logo_url, primary_color, secondary_color")
        .eq("id", gymRole.gym_id)
        .single();
      setGym(gymData as GymBranding | null);
    } else {
      setGym(null);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          // Use setTimeout to avoid Supabase deadlock
          setTimeout(() => fetchUserData(session.user.id), 0);
        } else {
          setRoles([]);
          setGym(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRoles([]);
    setGym(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, session, roles, activeRole, gym, loading, signIn, signUp, signOut, isSuperAdmin }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
