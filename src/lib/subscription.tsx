import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
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

interface Ctx {
  subscription: Subscription | null;
  activePlan: PlanName;
  loading: boolean;
  refresh: () => Promise<void>;
  hasPlanAtLeast: (min: PlanName) => boolean;
}

const SubCtx = createContext<Ctx | null>(null);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const rows = (data ?? []) as Subscription[];
    // Pick highest active, non-expired plan; else latest row
    const now = Date.now();
    const active = rows
      .filter((r) => r.status === "active" && (!r.end_date || new Date(r.end_date).getTime() > now))
      .sort((a, b) => PLAN_RANK[b.plan] - PLAN_RANK[a.plan])[0];
    setSubscription(active ?? rows[0] ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  const activePlan: PlanName =
    subscription && subscription.status === "active" &&
    (!subscription.end_date || new Date(subscription.end_date).getTime() > Date.now())
      ? subscription.plan
      : "free";

  const hasPlanAtLeast = (min: PlanName) => PLAN_RANK[activePlan] >= PLAN_RANK[min];

  return (
    <SubCtx.Provider value={{ subscription, activePlan, loading, refresh: load, hasPlanAtLeast }}>
      {children}
    </SubCtx.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubCtx);
  if (!ctx) throw new Error("useSubscription must be used within SubscriptionProvider");
  return ctx;
}
