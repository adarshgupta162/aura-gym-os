import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
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
  rolesLoaded: boolean;
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
  const [rolesLoaded, setRolesLoaded] = useState(false);
  const initializedRef = useRef(false);

  const activeRole = roles.length > 0 ? roles[0].role : null;
  const isSuperAdmin = roles.some((r) => r.role === "super_admin");

  const fetchUserData = async (userId: string) => {
    try {
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("role, gym_id")
        .eq("user_id", userId);

      const userRoles = (rolesData || []) as UserRole[];
      setRoles(userRoles);

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
    } finally {
      setRolesLoaded(true);
    }
  };

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    // Safety timeout - never stuck loading
    const timeoutId = setTimeout(() => {
      setLoading(false);
      setRolesLoaded(true);
    }, 5000);

    // Set up listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          // Use setTimeout to avoid deadlock with Supabase internals
          setTimeout(() => fetchUserData(session.user.id), 0);
        } else {
          setRoles([]);
          setGym(null);
          setRolesLoaded(true);
        }
        setLoading(false);
        clearTimeout(timeoutId);
      }
    );

    // THEN get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setRolesLoaded(true);
      }
      setLoading(false);
      clearTimeout(timeoutId);
    }).catch(() => {
      setLoading(false);
      setRolesLoaded(true);
      clearTimeout(timeoutId);
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setRolesLoaded(false);
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
    setRolesLoaded(false);
  };

  return (
    <AuthContext.Provider
      value={{ user, session, roles, activeRole, gym, loading, rolesLoaded, signIn, signUp, signOut, isSuperAdmin }}
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
