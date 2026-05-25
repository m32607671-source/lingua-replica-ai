import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useApp } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const WHATSAPP_NUMBER = "201022583151";

export const Route = createFileRoute("/pricing")({
  component: PricingPage,
  head: () => ({
    meta: [
      { title: "Pricing — Lingua AI" },
      { name: "description", content: "Simple, transparent pricing. Start free, scale anytime." },
    ],
    links: [{ rel: "canonical", href: "/pricing" }],
  }),
});

function PricingPage() {
  const { t } = useApp();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [yearly, setYearly] = useState(false);

  const handleProCheckout = async () => {
    if (!user) {
      toast.info("Please sign in to continue");
      navigate({ to: "/login", search: { redirect: "/pricing?checkout=pro" } as never });
      return;
    }
    const name = profile?.full_name || user.email?.split("@")[0] || "";
    const email = user.email || "";
    const message = `Hello Lingua AI Team,\n\nI would like to subscribe to the Pro Plan.\n\nMy account email:\n${email}\n\nMy account name:\n${name}\n\nPlease contact me regarding payment and activation.`;

    void supabase.from("checkout_events").insert({
      user_id: user.id,
      plan: "pro",
      billing: yearly ? "yearly" : "monthly",
      channel: "whatsapp",
      user_email: email,
      user_name: name,
    });

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const plans = [
    {
      name: t("pricing.free.name"),
      desc: t("pricing.free.desc"),
      price: 0,
      features: ["5,000 chars/day", "20 languages", "Basic accuracy", "Web app only"],
      cta: t("pricing.cta"),
      popular: false,
    },
    {
      name: t("pricing.pro.name"),
      desc: t("pricing.pro.desc"),
      price: yearly ? 15 : 19,
      features: ["Unlimited text", "100+ languages", "Document translation", "API access", "Priority support"],
      cta: t("pricing.cta"),
      popular: true,
    },
    {
      name: t("pricing.business.name"),
      desc: t("pricing.business.desc"),
      price: yearly ? 49 : 59,
      features: ["Everything in Pro", "Team workspace", "Custom glossaries", "SOC 2 & SSO", "Dedicated manager"],
      cta: t("pricing.cta.contact"),
      popular: false,
    },
  ];

  return (
    <SiteLayout>
      <section className="px-4 py-20">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">{t("pricing.title")}</h1>
            <p className="mt-4 text-lg text-muted-foreground">{t("pricing.subtitle")}</p>

            <div className="mt-8 inline-flex items-center gap-1 p-1 rounded-full glass">
              <button
                onClick={() => setYearly(false)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${!yearly ? "bg-gradient-primary text-white shadow-glow" : ""}`}
              >
                {t("pricing.monthly")}
              </button>
              <button
                onClick={() => setYearly(true)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${yearly ? "bg-gradient-primary text-white shadow-glow" : ""}`}
              >
                {t("pricing.yearly")}
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/20">−20%</span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((p) => (
              <div
                key={p.name}
                className={`relative glass rounded-3xl p-8 transition-all hover:-translate-y-1 ${
                  p.popular ? "border-2 border-primary/50 shadow-glow" : ""
                }`}
              >
                {p.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-primary text-white text-xs font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> {t("pricing.popular")}
                  </div>
                )}
                <h3 className="text-xl font-bold">{p.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{p.desc}</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-5xl font-bold">${p.price}</span>
                  <span className="text-muted-foreground text-sm">/mo</span>
                </div>
                <Link to="/register" className="block mt-6">
                  <Button
                    className={`w-full h-11 ${p.popular ? "bg-gradient-primary text-white shadow-glow" : ""}`}
                    variant={p.popular ? "default" : "outline"}
                  >
                    {p.cta}
                  </Button>
                </Link>
                <ul className="mt-8 space-y-3">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}