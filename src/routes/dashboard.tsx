import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useApp } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useSubscription } from "@/lib/subscription";
import { Button } from "@/components/ui/button";
import { SubscriptionDiagnosticsPanel } from "@/components/subscription/SubscriptionDiagnosticsPanel";
import { TrendingUp, Languages as LangIcon, Star, FileText, Crown, ArrowRight, CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
  head: () => ({
    meta: [{ title: "Dashboard — Lingua AI" }, { name: "description", content: "Your Lingua AI dashboard." }],
    links: [{ rel: "canonical", href: "/dashboard" }],
  }),
});

function DashboardPage() {
  const { t } = useApp();
  const { user, profile, loading } = useAuth();
  const { subscription, activePlan } = useSubscription();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return <SiteLayout><div className="py-24 text-center text-muted-foreground">Loading…</div></SiteLayout>;
  }

  const displayName = profile?.full_name || user.email?.split("@")[0] || "there";
  const stats = [
    { label: t("dash.stats.translations"), value: (profile?.translations_count ?? 0).toLocaleString(), icon: TrendingUp },
    { label: t("dash.stats.words"), value: (profile?.words_count ?? 0).toLocaleString(), icon: FileText },
    { label: t("dash.stats.languages"), value: "—", icon: LangIcon },
    { label: "Plan", value: activePlan, icon: Star },
  ];
  const recent = [
    { from: "English", to: "العربية", text: "Welcome to the future of translation.", time: "2m ago" },
    { from: "Español", to: "English", text: "Hola, ¿cómo estás hoy?", time: "1h ago" },
    { from: "Français", to: "Deutsch", text: "Le monde change rapidement.", time: "3h ago" },
    { from: "日本語", to: "English", text: "おはようございます", time: "Yesterday" },
  ];

  return (
    <SiteLayout>
      <section className="px-4 py-12">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{t("dash.welcome")}, {displayName} 👋</h1>
              <p className="text-muted-foreground mt-1">Here's what's happening with your account.</p>
            </div>
            <Link to="/translate">
              <Button className="bg-gradient-primary text-white shadow-glow">
                {t("nav.translate")} <ArrowRight className="w-4 h-4 ms-2 rtl:rotate-180" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="glass rounded-2xl p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{s.label}</span>
                    <div className="w-8 h-8 rounded-lg bg-gradient-primary grid place-items-center">
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="mt-3 text-2xl font-bold">{s.value}</div>
                </div>
              );
            })}
          </div>

          <div className="mb-8">
            <SubscriptionDiagnosticsPanel />
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 glass rounded-3xl p-6">
              <h2 className="font-semibold text-lg mb-4">{t("dash.recent")}</h2>
              <div className="space-y-3">
                {recent.map((r, i) => (
                  <div key={i} className="p-4 rounded-xl bg-background/40 border border-border/50">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                      <span className="font-medium">{r.from} → {r.to}</span>
                      <span>{r.time}</span>
                    </div>
                    <p className="text-sm">{r.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <SubscriptionCard subscription={subscription} activePlan={activePlan} />
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

function SubscriptionCard({
  subscription,
  activePlan,
}: {
  subscription: ReturnType<typeof useSubscription>["subscription"];
  activePlan: ReturnType<typeof useSubscription>["activePlan"];
}) {
  const statusMeta = {
    active: { icon: CheckCircle2, color: "text-emerald-500", label: "Active" },
    pending: { icon: Clock, color: "text-amber-500", label: "Pending" },
    expired: { icon: AlertCircle, color: "text-orange-500", label: "Expired" },
    cancelled: { icon: XCircle, color: "text-red-500", label: "Cancelled" },
  } as const;
  const meta = subscription ? statusMeta[subscription.status] : statusMeta.active;
  const StatusIcon = meta.icon;

  const planLabel = activePlan.charAt(0).toUpperCase() + activePlan.slice(1);
  const fmt = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—";

  return (
    <div className="glass rounded-3xl p-6 bg-gradient-soft border-2 border-primary/30">
      <Crown className="w-8 h-8 text-primary mb-3" />
      <h3 className="font-bold text-lg">Subscription</h3>
      <p className="text-sm text-muted-foreground mt-1">Your current plan and billing status.</p>

      <div className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Plan</span>
          <span className="font-semibold">{planLabel}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Status</span>
          <span className={`font-medium flex items-center gap-1.5 ${meta.color}`}>
            <StatusIcon className="w-4 h-4" /> {meta.label}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Payment</span>
          <span className="font-medium capitalize">{subscription?.payment_status ?? "—"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Start</span>
          <span>{fmt(subscription?.start_date)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">End</span>
          <span>{fmt(subscription?.end_date)}</span>
        </div>
        {subscription?.notes && (
          <p className="text-xs text-muted-foreground pt-2 border-t border-border/40">{subscription.notes}</p>
        )}
      </div>

      {activePlan !== "business" && (
        <Link to="/pricing" className="block mt-5">
          <Button className="w-full bg-gradient-primary text-white shadow-glow">Upgrade plan</Button>
        </Link>
      )}
    </div>
  );
}