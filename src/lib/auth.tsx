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
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (uid: string) => {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
    if (error) {
      console.error("Profile load failed", error.message);
      setProfile(null);
      return;
    }
    setProfile((data as Profile) ?? null);
  };

  const refreshSession = async () => {
    const [{ data: sessionData }, { data: userData, error }] = await Promise.all([
      supabase.auth.getSession(),
      supabase.auth.getUser(),
    ]);
    const verifiedUser = error ? null : userData.user;
    setSession(verifiedUser ? sessionData.session : null);
    setUser(verifiedUser);
    if (verifiedUser) await loadProfile(verifiedUser.id);
    else setProfile(null);
    setLoading(false);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        setTimeout(() => { void loadProfile(s.user.id); }, 0);
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
    signOut: async () => {
      await supabase.auth.signOut();
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