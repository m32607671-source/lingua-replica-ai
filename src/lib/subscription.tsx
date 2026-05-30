import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export type PlanName = "free" | "pro" | "business";
export type SubStatus = "active" | "expired" | "pending" | "cancelled";
export type PayStatus = "unpaid" | "pending" | "paid" | "refunded" | "failed";

export interface Subscription {
  id: string;
  user_id: string;
  plan: PlanName;
  status: SubStatus;
  start_date: string;
  end_date: string | null;
  payment_status: PayStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const PLAN_RANK: Record<PlanName, number> = { free: 1, pro: 2, business: 3 };
export const PLAN_AI_LIMITS: Record<PlanName, number> = { free: 5, pro: 100, business: -1 };
export const FREE_LANGUAGE_LIMIT = 20;

export interface SubscriptionAccessDiagnostics {
  ok: boolean;
  current_plan: PlanName;
  database_plan: PlanName;
  profile_plan: string | null;
  jwt_plan: string | null;
  cached_plan: string | null;
  browser_cached_plan?: string | null;
  ai_limit: number;
  ai_used_today: number;
  ai_remaining: number;
  allowed_languages_count: number;
  unlimited_languages: boolean;
  unlimited_ai: boolean;
  priority_processing: boolean;
  subscription_source: string;
  permission_state: string;
  profile_mismatch?: boolean;
  jwt_mismatch?: boolean;
  checked_at?: string;
}

interface Ctx {
  subscription: Subscription | null;
  activePlan: PlanName;
  diagnostics: SubscriptionAccessDiagnostics | null;
  aiLimit: number;
  aiUsedToday: number;
  aiRemaining: number;
  allowedLanguagesCount: number;
  unlimitedLanguages: boolean;
  unlimitedAi: boolean;
  priorityProcessing: boolean;
  subscriptionSource: string;
  permissionState: string;
  loading: boolean;
  refresh: () => Promise<void>;
  hasPlanAtLeast: (min: PlanName) => boolean;
  trackEvent: (eventType: string, details?: Record<string, unknown>) => void;
}

const SubCtx = createContext<Ctx | null>(null);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user, session } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [diagnostics, setDiagnostics] = useState<SubscriptionAccessDiagnostics | null>(null);
  const [loading, setLoading] = useState(true);

  const readBrowserCachedPlan = () => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem("lingua_active_plan");
  };

  const load = useCallback(async () => {
    if (!user) {
      setSubscription(null);
      setDiagnostics(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const [{ data, error: subsError }, accessRes] = await Promise.all([
      supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      (
        supabase.rpc as unknown as (
          fn: string,
        ) => Promise<{
          data: SubscriptionAccessDiagnostics | null;
          error: { message?: string } | null;
        }>
      )("get_my_subscription_access"),
    ]);

    if (subsError || accessRes.error) {
      void (
        supabase.rpc as unknown as (fn: string, args: Record<string, unknown>) => Promise<unknown>
      )("track_subscription_access_event", {
        _event_type: "subscription_sync_failure",
        _plan: "free",
        _details: {
          subscriptions_error: subsError?.message ?? null,
          access_error: accessRes.error?.message ?? null,
        },
      });
    }

    const rows = (data ?? []) as Subscription[];
    // Pick highest active, non-expired plan; else latest row
    const now = Date.now();
    const active = rows
      .filter((r) => r.status === "active" && (!r.end_date || new Date(r.end_date).getTime() > now))
      .sort((a, b) => PLAN_RANK[b.plan] - PLAN_RANK[a.plan])[0];
    setSubscription(active ?? rows[0] ?? null);
    const nextDiagnostics = accessRes.data
      ? { ...accessRes.data, browser_cached_plan: readBrowserCachedPlan() }
      : null;
    setDiagnostics(nextDiagnostics);
    if (typeof window !== "undefined" && nextDiagnostics?.current_plan) {
      window.localStorage.setItem("lingua_active_plan", nextDiagnostics.current_plan);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load, session?.access_token]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`subscription-sync-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subscriptions", filter: `user_id=eq.${user.id}` },
        () => {
          void load();
        },
      )
      .subscribe();
    const onFocus = () => {
      void load();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
      void supabase.removeChannel(channel);
    };
  }, [user, load]);

  const activePlan: PlanName =
    diagnostics?.current_plan ??
    (subscription &&
    subscription.status === "active" &&
    (!subscription.end_date || new Date(subscription.end_date).getTime() > Date.now())
      ? subscription.plan
      : "free");

  const hasPlanAtLeast = (min: PlanName) => PLAN_RANK[activePlan] >= PLAN_RANK[min];
  const trackEvent = useCallback(
    (eventType: string, details: Record<string, unknown> = {}) => {
      if (!user) return;
      void (
        supabase.rpc as unknown as (fn: string, args: Record<string, unknown>) => Promise<unknown>
      )("track_subscription_access_event", {
        _event_type: eventType,
        _plan: activePlan,
        _details: details,
      });
    },
    [activePlan, user],
  );

  useEffect(() => {
    if (!diagnostics || !user) return;
    if (diagnostics.profile_mismatch || diagnostics.jwt_mismatch) {
      trackEvent("permission_mismatch", {
        database_plan: diagnostics.database_plan,
        profile_plan: diagnostics.profile_plan,
        jwt_plan: diagnostics.jwt_plan,
        browser_cached_plan: diagnostics.browser_cached_plan,
      });
    }
  }, [diagnostics, trackEvent, user]);

  const value = useMemo<Ctx>(
    () => ({
      subscription,
      activePlan,
      diagnostics,
      aiLimit: diagnostics?.ai_limit ?? PLAN_AI_LIMITS[activePlan],
      aiUsedToday: diagnostics?.ai_used_today ?? 0,
      aiRemaining:
        diagnostics?.ai_remaining ??
        (PLAN_AI_LIMITS[activePlan] === -1 ? -1 : PLAN_AI_LIMITS[activePlan]),
      allowedLanguagesCount:
        diagnostics?.allowed_languages_count ??
        (activePlan === "free" ? FREE_LANGUAGE_LIMIT : Number.MAX_SAFE_INTEGER),
      unlimitedLanguages: diagnostics?.unlimited_languages ?? activePlan !== "free",
      unlimitedAi: diagnostics?.unlimited_ai ?? activePlan === "business",
      priorityProcessing: diagnostics?.priority_processing ?? activePlan === "business",
      subscriptionSource: diagnostics?.subscription_source ?? "frontend-fallback",
      permissionState: diagnostics?.permission_state ?? activePlan,
      loading,
      refresh: load,
      hasPlanAtLeast,
      trackEvent,
    }),
    [activePlan, diagnostics, load, loading, subscription, trackEvent],
  );

  return <SubCtx.Provider value={value}>{children}</SubCtx.Provider>;
}

export function useSubscription() {
  const ctx = useContext(SubCtx);
  if (!ctx) throw new Error("useSubscription must be used within SubscriptionProvider");
  return ctx;
}
