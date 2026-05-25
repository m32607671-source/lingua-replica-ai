import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
  head: () => ({
    meta: [{ title: "Set new password — Lingua AI" }],
  }),
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error("At least 6 characters"); return; }
    if (password !== confirm) { toast.error("Passwords don't match"); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated.");
    navigate({ to: "/dashboard" });
  };

  return (
    <SiteLayout>
      <section className="px-4 py-20 min-h-[80vh] grid place-items-center">
        <div className="w-full max-w-md">
          <div className="glass rounded-3xl p-8 shadow-elegant">
            <h1 className="text-3xl font-bold tracking-tight text-center">Set a new password</h1>
            <p className="text-sm text-muted-foreground text-center mt-2">Choose a strong password you don't use elsewhere.</p>

            <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">New password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute top-3.5 start-3 text-muted-foreground" />
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full h-11 ps-10 pe-3 rounded-xl bg-background/50 border border-border focus:outline-none focus:ring-2 focus:ring-ring" placeholder="••••••••" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Confirm password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute top-3.5 start-3 text-muted-foreground" />
                  <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} className="w-full h-11 ps-10 pe-3 rounded-xl bg-background/50 border border-border focus:outline-none focus:ring-2 focus:ring-ring" placeholder="••••••••" />
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full h-11 bg-gradient-primary text-white shadow-glow">
                {loading ? "..." : "Update password"}
              </Button>
            </form>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}