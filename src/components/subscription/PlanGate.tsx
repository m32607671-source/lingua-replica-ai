import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription, type PlanName } from "@/lib/subscription";

interface Props {
  min: PlanName;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PlanGate({ min, children, fallback }: Props) {
  const { hasPlanAtLeast, loading } = useSubscription();
  if (loading) return null;
  if (hasPlanAtLeast(min)) return <>{children}</>;
  if (fallback) return <>{fallback}</>;
  return (
    <div className="glass rounded-2xl p-8 text-center space-y-4">
      <div className="mx-auto w-12 h-12 rounded-full bg-gradient-primary grid place-items-center text-white">
        <Lock className="w-5 h-5" />
      </div>
      <div>
        <h3 className="text-lg font-semibold">{min === "business" ? "Business" : "Pro"} plan required</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Upgrade your plan to unlock this feature.
        </p>
      </div>
      <Link to="/pricing">
        <Button className="bg-gradient-primary text-white shadow-glow">
          <Sparkles className="w-4 h-4 mr-2" /> View plans
        </Button>
      </Link>
    </div>
  );
}
