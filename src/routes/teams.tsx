import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Users, Plus, LogIn } from "lucide-react";

export const Route = createFileRoute("/teams")({
  component: TeamsPage,
  head: () => ({
    meta: [
      { title: "Teams — Lingua AI" },
      { name: "description", content: "Collaborate with your team on shared translation projects, glossaries and real-time team chat." },
    ],
  }),
  errorComponent: ({ error }) => <div className="p-8">Error: {error.message}</div>,
  notFoundComponent: () => <div className="p-8">Not found</div>,
});

type TeamRow = {
  team_id: string;
  role: string;
  teams: { id: string; name: string; emoji: string; description: string | null; member_count: number; project_count: number; slug: string } | null;
};

function TeamsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: memberships = [], isLoading } = useQuery({
    queryKey: ["my-teams", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("team_members")
        .select("team_id, role, teams:team_id(id, name, emoji, description, member_count, project_count, slug)")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data ?? []) as TeamRow[];
    },
  });

  function refresh() {
    void qc.invalidateQueries({ queryKey: ["my-teams"] });
  }

  if (!user) {
    return (
      <SiteLayout>
        <div className="container mx-auto px-4 py-16 max-w-md text-center">
          <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <h1 className="text-2xl font-bold mb-2">Teams</h1>
          <p className="text-muted-foreground mb-6">Sign in to create or join a team.</p>
          <Link to="/login"><Button className="bg-gradient-primary text-white">Sign in</Button></Link>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="container mx-auto px-4 py-10 max-w-5xl">
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-2"><Users className="w-8 h-8" /> Teams</h1>
            <p className="text-muted-foreground mt-2">Work together on shared translation projects and glossaries.</p>
          </div>
          <div className="flex gap-2">
            <JoinTeamDialog onJoined={refresh} />
            <CreateTeamDialog onCreated={refresh} />
          </div>
        </div>

        {isLoading ? (
          <Card className="p-8 text-center text-muted-foreground">Loading…</Card>
        ) : memberships.length === 0 ? (
          <Card className="p-10 text-center">
            <Users className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-lg font-medium mb-1">You're not in a team yet</p>
            <p className="text-sm text-muted-foreground mb-4">Create one to start collaborating, or join with an invite code.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {memberships.map((m) => {
              const t = m.teams;
              if (!t) return null;
              return (
                <Link key={m.team_id} to="/teams/$teamId" params={{ teamId: m.team_id }}>
                  <Card className="p-4 hover:border-primary/50 transition-colors h-full">
                    <div className="flex items-start gap-3">
                      <div className="text-3xl">{t.emoji}</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold truncate">{t.name}</p>
                          <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-primary/10 text-primary">{m.role}</span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{t.description || "No description"}</p>
                        <p className="text-xs mt-2 text-muted-foreground">👥 {t.member_count} · 📁 {t.project_count} projects</p>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}

function CreateTeamDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("👥");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { data, error } = await supabase.rpc("create_team" as any, { _name: name, _emoji: emoji, _description: description || null });
    setSaving(false);
    if (error) return toast.error(error.message);
    const res = data as { ok: boolean; error?: string; limit?: number; plan?: string };
    if (!res.ok) {
      if (res.error === "team_limit_reached") return toast.error(`Your ${res.plan} plan allows ${res.limit} team(s). Upgrade for more.`);
      return toast.error(res.error || "Failed");
    }
    toast.success("Team created!");
    setOpen(false); setName(""); setDescription("");
    onCreated();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-primary text-white"><Plus className="w-4 h-4 mr-1" />Create team</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Create a team</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="text-sm font-medium">Emoji</label>
            <Input value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={4} />
          </div>
          <div>
            <label className="text-sm font-medium">Team name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={60} />
          </div>
          <div>
            <label className="text-sm font-medium">Description (optional)</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={300} />
          </div>
          <Button type="submit" disabled={saving} className="w-full bg-gradient-primary text-white">
            {saving ? "Creating…" : "Create team"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function JoinTeamDialog({ onJoined }: { onJoined: () => void }) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { data, error } = await supabase.rpc("join_team_by_code" as any, { _code: code });
    setSaving(false);
    if (error) return toast.error(error.message);
    const res = data as { ok: boolean; error?: string; limit?: number };
    if (!res.ok) {
      if (res.error === "team_full") return toast.error(`Team is full (${res.limit} members).`);
      if (res.error === "already_member") return toast.error("You're already in this team.");
      if (res.error === "invalid_code") return toast.error("Invalid invite code.");
      return toast.error(res.error || "Failed");
    }
    toast.success("Joined team!");
    setOpen(false); setCode("");
    onJoined();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline"><LogIn className="w-4 h-4 mr-1" />Join</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Join a team</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <p className="text-sm text-muted-foreground">Paste the invite code your team admin shared with you.</p>
          <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="abc123def456" required minLength={6} maxLength={40} />
          <Button type="submit" disabled={saving} className="w-full bg-gradient-primary text-white">
            {saving ? "Joining…" : "Join team"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
