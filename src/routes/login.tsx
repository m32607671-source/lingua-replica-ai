import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useApp } from "@/lib/i18n";
import { Mail, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GoogleButton } from "@/components/auth/GoogleButton";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  head: () => ({
    meta: [{ title: "Sign in — Lingua AI" }, { name: "description", content: "Sign in to Lingua AI." }],
    links: [{ rel: "canonical", href: "/login" }],
  }),
});

function LoginPage() {
  const { t } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back!");
    navigate({ to: "/dashboard" });
  };

  return (
    <SiteLayout>
      <section className="px-4 py-20 min-h-[80vh] grid place-items-center">
        <div className="w-full max-w-md">
          <div className="glass rounded-3xl p-8 shadow-elegant">
            <h1 className="text-3xl font-bold tracking-tight text-center">{t("auth.login.title")}</h1>
            <p className="text-sm text-muted-foreground text-center mt-2">{t("auth.login.subtitle")}</p>

            <div className="mt-6">
              <GoogleButton label="Continue with Google" />
            </div>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground uppercase">{t("auth.or")}</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t("auth.email")}</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute top-3.5 start-3 text-muted-foreground" />
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full h-11 ps-10 pe-3 rounded-xl bg-background/50 border border-border focus:outline-none focus:ring-2 focus:ring-ring" placeholder="you@example.com" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t("auth.password")}</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute top-3.5 start-3 text-muted-foreground" />
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full h-11 ps-10 pe-3 rounded-xl bg-background/50 border border-border focus:outline-none focus:ring-2 focus:ring-ring" placeholder="••••••••" />
                </div>
              </div>
              <div className="text-end">
                <Link to="/forgot-password" className="text-sm text-primary hover:underline">{t("auth.forgot")}</Link>
              </div>
              <Button type="submit" disabled={loading} className="w-full h-11 bg-gradient-primary text-white shadow-glow">
                {loading ? "..." : t("auth.signin")}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              {t("auth.noAccount")} <Link to="/register" className="text-primary font-medium hover:underline">{t("nav.register")}</Link>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}