import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useApp } from "@/lib/i18n";
import { Mail, Lock, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GoogleButton } from "@/components/auth/GoogleButton";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
  head: () => ({
    meta: [{ title: "Create account — Lingua AI" }, { name: "description", content: "Create your Lingua AI account." }],
    links: [{ rel: "canonical", href: "/register" }],
  }),
});

function RegisterPage() {
  const { t } = useApp();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin + "/dashboard",
        data: { full_name: name },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Check your email to confirm your account.");
    navigate({ to: "/login" });
  };

  return (
    <SiteLayout>
      <section className="px-4 py-20 min-h-[80vh] grid place-items-center">
        <div className="w-full max-w-md">
          <div className="glass rounded-3xl p-8 shadow-elegant">
            <h1 className="text-3xl font-bold tracking-tight text-center">{t("auth.register.title")}</h1>
            <p className="text-sm text-muted-foreground text-center mt-2">{t("auth.register.subtitle")}</p>

            <div className="mt-6">
              <GoogleButton label="Sign up with Google" />
            </div>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground uppercase">{t("auth.or")}</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t("auth.name")}</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute top-3.5 start-3 text-muted-foreground" />
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full h-11 ps-10 pe-3 rounded-xl bg-background/50 border border-border focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Jane Doe" />
                </div>
              </div>
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
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full h-11 ps-10 pe-3 rounded-xl bg-background/50 border border-border focus:outline-none focus:ring-2 focus:ring-ring" placeholder="At least 6 characters" />
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full h-11 bg-gradient-primary text-white shadow-glow">
                {loading ? "..." : t("auth.signup")}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              {t("auth.haveAccount")} <Link to="/login" className="text-primary font-medium hover:underline">{t("nav.login")}</Link>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}