import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SiteLayout } from "@/components/site/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClanChat } from "@/components/clans/ClanChat";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/clans/$clanId")({
  component: ClanDetail,
  errorComponent: ({ error }) => <div className="p-8">Error: {error.message}</div>,
  notFoundComponent: () => <div className="p-8">Clan not found</div>,
});

function ClanDetail() {
  const { clanId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: clan } = useQuery({
    queryKey: ["clan", clanId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clans")
        .select("id, name, tag, description, emoji, member_count, total_xp, owner_id")
        .eq("id", clanId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: members = [] } = useQuery({
    queryKey: ["clan-members", clanId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clan_members")
        .select("user_id, role, contributed_xp, joined_at")
        .eq("clan_id", clanId)
        .order("contributed_xp", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const isMember = !!user && members.some((m) => m.user_id === user.id);

  async function leave() {
    if (!confirm("Leave this clan?")) return;
    const { data, error } = await supabase.rpc("leave_clan");
    if (error) return toast.error(error.message);
    const res = data as { ok: boolean; error?: string };
    if (!res.ok) return toast.error(res.error || "Failed");
    toast.success("Left the clan");
    void qc.invalidateQueries({ queryKey: ["my-clan"] });
    void qc.invalidateQueries({ queryKey: ["clans"] });
    void navigate({ to: "/clans" });
  }

  if (!clan) {
    return <SiteLayout><div className="container mx-auto p-10 text-center text-muted-foreground">Loading…</div></SiteLayout>;
  }

  return (
    <SiteLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link to="/clans" className="text-sm text-muted-foreground hover:underline">← All clans</Link>
        <div className="flex items-start gap-4 mt-3 mb-6">
          <div className="text-5xl">{clan.emoji}</div>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold">
              {clan.name} <span className="text-base text-muted-foreground">[{clan.tag}]</span>
            </h1>
            <p className="text-muted-foreground">{clan.description || "No description"}</p>
            <p className="text-sm mt-1">👥 {clan.member_count} members · ⭐ {clan.total_xp.toLocaleString()} XP</p>
          </div>
          {isMember && (
            <Button variant="outline" size="sm" onClick={leave}>Leave</Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 md:col-span-1">
            <h2 className="font-semibold mb-3">Members</h2>
            <ul className="space-y-2 max-h-[420px] overflow-y-auto">
              {members.map((m) => (
                <li key={m.user_id} className="flex items-center justify-between text-sm">
                  <span className="truncate">
                    {m.user_id.slice(0, 8)}…
                    {m.role !== "member" && <span className="ml-1 text-xs text-primary">({m.role})</span>}
                  </span>
                  <span className="text-xs text-muted-foreground">{m.contributed_xp} XP</span>
                </li>
              ))}
            </ul>
          </Card>
          <div className="md:col-span-2">
            <h2 className="font-semibold mb-3">Clan chat</h2>
            {isMember ? (
              <ClanChat clanId={clanId} />
            ) : (
              <Card className="p-8 text-center text-muted-foreground">Join the clan to access chat.</Card>
            )}
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
