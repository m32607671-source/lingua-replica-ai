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

export const Route = createFileRoute("/clans")({
  component: ClansPage,
  head: () => ({
    meta: [
      { title: "Clans — Lingua AI" },
      { name: "description", content: "Create or join a language-learning clan, chat with members, and compete on the clan leaderboard." },
    ],
  }),
  errorComponent: ({ error }) => <div className="p-8">Error: {error.message}</div>,
  notFoundComponent: () => <div className="p-8">Not found</div>,
});

function ClansPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: clans = [] } = useQuery({
    queryKey: ["clans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clans")
        .select("id, name, tag, description, emoji, member_count, total_xp")
        .order("total_xp", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: myMembership } = useQuery({
    queryKey: ["my-clan", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("clan_members")
        .select("clan_id, role")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  async function join(clanId: string) {
    if (!user) return toast.error("Sign in to join a clan");
    const { data, error } = await supabase.rpc("join_clan", { _clan_id: clanId });
    if (error) return toast.error(error.message);
    const res = data as { ok: boolean; error?: string };
    if (!res.ok) return toast.error(res.error || "Failed");
    toast.success("Joined clan!");
    void qc.invalidateQueries({ queryKey: ["clans"] });
    void qc.invalidateQueries({ queryKey: ["my-clan"] });
  }

  return (
    <SiteLayout>
      <div className="container mx-auto px-4 py-10 max-w-4xl">
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">🛡️ Clans</h1>
            <p className="text-muted-foreground mt-2">Join forces, climb the global clan leaderboard.</p>
          </div>
          {user && !myMembership && <CreateClanDialog onCreated={() => {
            void qc.invalidateQueries({ queryKey: ["clans"] });
            void qc.invalidateQueries({ queryKey: ["my-clan"] });
          }} />}
        </div>

        {myMembership && (
          <Card className="p-4 mb-6 bg-primary/5 border-primary/30">
            <p className="text-sm">You're already in a clan.</p>
            <Link to="/clans/$clanId" params={{ clanId: myMembership.clan_id }}>
              <Button size="sm" className="mt-2">Go to my clan →</Button>
            </Link>
          </Card>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {clans.map((c) => (
            <Card key={c.id} className="p-4 flex items-center gap-3">
              <div className="text-3xl">{c.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Link to="/clans/$clanId" params={{ clanId: c.id }} className="font-semibold hover:underline truncate">
                    {c.name}
                  </Link>
                  <span className="text-xs px-1.5 py-0.5 bg-accent/20 rounded">[{c.tag}]</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{c.description || "No description"}</p>
                <p className="text-xs mt-1">👥 {c.member_count} · ⭐ {c.total_xp.toLocaleString()} XP</p>
              </div>
              {!myMembership && user && (
                <Button size="sm" onClick={() => join(c.id)}>Join</Button>
              )}
            </Card>
          ))}
          {clans.length === 0 && (
            <Card className="p-8 text-center sm:col-span-2 text-muted-foreground">
              No clans yet. Be the first to create one!
            </Card>
          )}
        </div>
      </div>
    </SiteLayout>
  );
}

function CreateClanDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [description, setDescription] = useState("");
  const [emoji, setEmoji] = useState("🛡️");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { data, error } = await supabase.rpc("create_clan", {
      _name: name, _tag: tag, _description: description || undefined, _emoji: emoji,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    const res = data as { ok: boolean; error?: string };
    if (!res.ok) return toast.error(res.error || "Failed");
    toast.success("Clan created!");
    setOpen(false);
    setName(""); setTag(""); setDescription("");
    onCreated();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-primary text-white">+ Create clan</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Create a clan</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="text-sm font-medium">Emoji</label>
            <Input value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={4} />
          </div>
          <div>
            <label className="text-sm font-medium">Name (3-32 chars)</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required minLength={3} maxLength={32} />
          </div>
          <div>
            <label className="text-sm font-medium">Tag (2-6 chars)</label>
            <Input value={tag} onChange={(e) => setTag(e.target.value)} required minLength={2} maxLength={6} />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={200} />
          </div>
          <Button type="submit" disabled={saving} className="w-full bg-gradient-primary text-white">
            {saving ? "Creating…" : "Create clan"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
