import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
  head: () => ({
    meta: [{ title: "Reset password — Lingua AI" }],
    links: [{ rel: "canonical", href: "/forgot-password" }],
  }),
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password",
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setSent(true);
    toast.success("Reset link sent. Check your inbox.");
  };

  return (
    <SiteLayout>
      <section className="px-4 py-20 min-h-[80vh] grid place-items-center">
        <div className="w-full max-w-md">
          <div className="glass rounded-3xl p-8 shadow-elegant">
            <h1 className="text-3xl font-bold tracking-tight text-center">Forgot password?</h1>
            <p className="text-sm text-muted-foreground text-center mt-2">
              Enter your email and we'll send you a reset link.
            </p>

            {sent ? (
              <div className="mt-8 text-center">
                <p className="text-sm">If an account exists for <b>{email}</b>, a reset link is on its way.</p>
                <Link to="/login" className="text-primary text-sm mt-4 inline-block hover:underline">Back to sign in</Link>
              </div>
            ) : (
              <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute top-3.5 start-3 text-muted-foreground" />
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full h-11 ps-10 pe-3 rounded-xl bg-background/50 border border-border focus:outline-none focus:ring-2 focus:ring-ring" placeholder="you@example.com" />
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full h-11 bg-gradient-primary text-white shadow-glow">
                  {loading ? "..." : "Send reset link"}
                </Button>
                <div className="text-center text-sm text-muted-foreground">
                  <Link to="/login" className="text-primary hover:underline">Back to sign in</Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}