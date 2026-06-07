import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  plan: string;
  translations_count: number;
  words_count: number;
  bio: string | null;
  native_language: string;
  learning_language: string;
  xp: number;
  coins: number;
  streak: number;
  level: number;
  last_activity_date: string | null;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  refreshSession: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const ensureAccountInitialized = async () => {
    const { error } = await (
      supabase.rpc as unknown as (
        fn: string,
      ) => Promise<{ data: unknown; error: { message: string } | null }>
    )("ensure_my_account_initialized");
    if (error) console.error("Account initialization failed", error.message);
  };

  const loadProfile = async (uid: string) => {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
    if (error) {
      console.error("Profile load failed", error.message);
      setProfile(null);
      return;
    }
    if (!data) {
      await ensureAccountInitialized();
      const { data: retryData, error: retryError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", uid)
        .maybeSingle();
      if (retryError) {
        console.error("Profile reload failed", retryError.message);
        setProfile(null);
        return;
      }
      setProfile((retryData as Profile) ?? null);
      return;
    }
    setProfile((data as Profile) ?? null);
  };

  const refreshSession = async () => {
    setLoading(true);
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        console.warn("Stored auth session could not be verified", userError?.message);
        await supabase.auth.signOut({ scope: "local" });
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      await ensureAccountInitialized();
      setSession(sessionData.session);
      setUser(userData.user);
      await loadProfile(userData.user.id);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        setTimeout(() => {
          void (async () => {
            if (event === "SIGNED_IN" || event === "USER_UPDATED") await ensureAccountInitialized();
            await loadProfile(s.user.id);
          })();
        }, 0);
      } else {
        setProfile(null);
      }
    });

    void refreshSession();

    return () => subscription.unsubscribe();
  }, []);

  const value: AuthContextValue = {
    user,
    session,
    profile,
    loading,
    refreshProfile: async () => { if (user) await loadProfile(user.id); },
    refreshSession,
    signOut: async () => {
      await supabase.auth.signOut();
      if (typeof window !== "undefined") window.localStorage.removeItem("lingua_active_plan");
      setSession(null);
      setUser(null);
      setProfile(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}