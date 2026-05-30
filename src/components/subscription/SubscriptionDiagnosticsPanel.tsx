import { AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/lib/subscription";

export function SubscriptionDiagnosticsPanel() {
  const {
    activePlan,
    diagnostics,
    aiLimit,
    allowedLanguagesCount,
    subscriptionSource,
    permissionState,
    loading,
    refresh,
  } = useSubscription();

  const hasMismatch = !!(diagnostics?.profile_mismatch || diagnostics?.jwt_mismatch);
  const limitLabel = aiLimit === -1 ? "∞" : `${aiLimit}/day`;
  const languageLabel = allowedLanguagesCount > 500 ? "100+" : `${allowedLanguagesCount}`;

  return (
    <section className="rounded-2xl border border-dashed bg-muted/30 p-4 md:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold">Subscription diagnostics</h2>
            <Badge variant={hasMismatch ? "destructive" : "secondary"} className="gap-1">
              {hasMismatch ? <AlertTriangle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
              {hasMismatch ? "Mismatch" : "Synced"}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Temporary access-control verification panel.</p>
        </div>
        <Button variant="outline" size="sm" className="h-9 w-full sm:w-auto" onClick={() => void refresh()} disabled={loading}>
          <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          Refresh
        </Button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
        <Diag label="Current plan" value={activePlan} />
        <Diag label="AI limits" value={limitLabel} />
        <Diag label="Allowed languages" value={languageLabel} />
        <Diag label="Source" value={subscriptionSource} />
        <Diag label="JWT plan" value={diagnostics?.jwt_plan ?? "none"} />
        <Diag label="Database plan" value={diagnostics?.database_plan ?? activePlan} />
        <Diag label="Cached plan" value={diagnostics?.browser_cached_plan ?? diagnostics?.cached_plan ?? "none"} />
        <Diag label="Permission state" value={permissionState} />
      </div>
    </section>
  );
}

function Diag({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl border bg-background/60 p-3">
      <div className="truncate text-[11px] text-muted-foreground">{label}</div>
      <div className="mt-1 truncate text-sm font-semibold capitalize">{value}</div>
    </div>
  );
}