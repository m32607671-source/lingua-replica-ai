import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useIsAdmin } from "@/lib/useIsAdmin";
import { useSubscription } from "@/lib/subscription";

type AuthDiagnostics = {
  auth_status?: string;
  session_status?: string;
  current_user?: { id?: string; email?: string; provider?: string } | null;
  current_role?: string;
  current_subscription?: string;
  oauth_status?: string;
  backend_connection_status?: string;
  profile_ready?: boolean;
  subscription_ready?: boolean;
};

export function AuthDiagnosticsPanel() {
  const { user, session, profile, loading: authLoading, refreshSession } = useAuth();
  const { isAdmin, loading: roleLoading } = useIsAdmin();
  const { activePlan, refresh: refreshSubscription } = useSubscription();
  const [diagnostics, setDiagnostics] = useState<AuthDiagnostics | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    if (!user) {
      setDiagnostics({
        auth_status: "signed_out",
        session_status: session ? "unverified" : "missing",
        current_user: null,
        current_role: "none",
        current_subscription: "free",
        oauth_status: "managed_google_enabled",
        backend_connection_status: "connected",
        profile_ready: false,
        subscription_ready: false,
      });
      setLoading(false);
      return;
    }
    const { data, error } = await (
      supabase.rpc as unknown as (fn: string) => Promise<{ data: AuthDiagnostics | null; error: { message: string } | null }>
    )("get_my_auth_diagnostics");
    setDiagnostics(error ? { backend_connection_status: error.message } : data);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, [user?.id, session?.access_token]);

  const synced = !!user && !!session && !!profile && diagnostics?.backend_connection_status === "connected";

  return (
    <section className="rounded-2xl border border-dashed bg-muted/30 p-4 md:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold">Authentication diagnostics</h2>
            <Badge variant={synced ? "secondary" : "destructive"} className="gap-1">
              {synced ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
              {synced ? "Healthy" : "Check"}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Live login, session, role, OAuth, and backend status.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-9 w-full sm:w-auto"
          disabled={loading || authLoading || roleLoading}
          onClick={() => void Promise.all([refreshSession(), refreshSubscription(), load()])}
        >
          <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          Refresh
        </Button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
        <Diag label="Auth status" value={diagnostics?.auth_status ?? (user ? "signed_in" : "signed_out")} />
        <Diag label="Session status" value={diagnostics?.session_status ?? (session ? "active" : "missing")} />
        <Diag label="Current user" value={diagnostics?.current_user?.email ?? user?.email ?? "none"} />
        <Diag label="Current role" value={isAdmin ? "admin" : diagnostics?.current_role ?? "user"} />
        <Diag label="Subscription" value={diagnostics?.current_subscription ?? activePlan} />
        <Diag label="OAuth status" value={diagnostics?.oauth_status ?? "managed_google_enabled"} />
        <Diag label="Backend status" value={diagnostics?.backend_connection_status ?? "connected"} />
        <Diag label="Profile ready" value={profile ? "yes" : diagnostics?.profile_ready ? "yes" : "no"} />
      </div>
    </section>
  );
}

function Diag({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl border bg-background/60 p-3">
      <div className="truncate text-[11px] text-muted-foreground">{label}</div>
      <div className="mt-1 truncate text-sm font-semibold">{value}</div>
    </div>
  );
}