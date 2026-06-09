import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { TeamChat } from "@/components/teams/TeamChat";
import { Copy, RefreshCw, Trash2, LogOut, Plus } from "lucide-react";

export const Route = createFileRoute("/teams/$teamId")({
  component: TeamDetailPage,
  head: () => ({ meta: [{ title: "Team — Lingua AI" }] }),
  errorComponent: ({ error }) => <div className="p-8">Error: {error.message}</div>,
  notFoundComponent: () => <div className="p-8">Team not found</div>,
});

const ROLES = ["admin", "manager", "translator", "reviewer", "viewer"] as const;

function TeamDetailPage() {
  const { teamId } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: team } = useQuery({
    queryKey: ["team", teamId],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("teams")
        .select("id, name, emoji, description, owner_id, invite_code, member_count, project_count")
        .eq("id", teamId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: members = [] } = useQuery({
    queryKey: ["team-members", teamId],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("team_members")
        .select("user_id, role, joined_at, profiles:user_id(full_name, avatar_url)")
        .eq("team_id", teamId);
      if (error) throw error;
      return data ?? [];
    },
  });

  const me = members.find((m: any) => m.user_id === user?.id);
  const myRole: string = me?.role ?? "viewer";
  const canManage = ["owner", "admin", "manager"].includes(myRole);
  const isOwnerOrAdmin = ["owner", "admin"].includes(myRole);

  const { data: projects = [] } = useQuery({
    queryKey: ["team-projects", teamId],
    queryFn: async () => {
      const { data } = await (supabase as any).from("team_projects")
        .select("id, name, description, source_language, target_language, status, progress, created_at")
        .eq("team_id", teamId).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: glossary = [] } = useQuery({
    queryKey: ["team-glossary", teamId],
    queryFn: async () => {
      const { data } = await (supabase as any).from("team_glossary")
        .select("id, term, translation, source_language, target_language, notes")
        .eq("team_id", teamId).order("term");
      return data ?? [];
    },
  });

  const { data: activity = [] } = useQuery({
    queryKey: ["team-activity", teamId],
    queryFn: async () => {
      const { data } = await (supabase as any).from("team_activity")
        .select("id, user_id, event_type, payload, created_at")
        .eq("team_id", teamId).order("created_at", { ascending: false }).limit(30);
      return data ?? [];
    },
  });

  if (!team) {
    return <SiteLayout><div className="container mx-auto px-4 py-10">Loading team…</div></SiteLayout>;
  }

  function refreshAll() {
    void qc.invalidateQueries({ queryKey: ["team", teamId] });
    void qc.invalidateQueries({ queryKey: ["team-members", teamId] });
    void qc.invalidateQueries({ queryKey: ["team-projects", teamId] });
    void qc.invalidateQueries({ queryKey: ["team-glossary", teamId] });
    void qc.invalidateQueries({ queryKey: ["team-activity", teamId] });
    void qc.invalidateQueries({ queryKey: ["my-teams"] });
  }

  async function copyInvite() {
    await navigator.clipboard.writeText(team.invite_code);
    toast.success("Invite code copied!");
  }

  async function regenInvite() {
    const { data, error } = await supabase.rpc("regenerate_team_invite_code" as any, { _team_id: teamId });
    if (error) return toast.error(error.message);
    const res = data as { ok: boolean; error?: string };
    if (!res.ok) return toast.error(res.error || "Failed");
    toast.success("New invite code generated");
    refreshAll();
  }

  async function leave() {
    if (!confirm("Leave this team?")) return;
    const { data, error } = await supabase.rpc("leave_team" as any, { _team_id: teamId });
    if (error) return toast.error(error.message);
    const res = data as { ok: boolean; error?: string };
    if (!res.ok) return toast.error(res.error || "Failed");
    toast.success("Left team");
    navigate({ to: "/teams" });
  }

  async function deleteTeam() {
    if (!confirm("Delete team permanently? This cannot be undone.")) return;
    const { error } = await (supabase as any).from("teams").delete().eq("id", teamId);
    if (error) return toast.error(error.message);
    toast.success("Team deleted");
    navigate({ to: "/teams" });
  }

  return (
    <SiteLayout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="text-4xl">{team.emoji}</div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">{team.name}</h1>
              <p className="text-sm text-muted-foreground">{team.description || "No description"}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link to="/teams"><Button variant="ghost" size="sm">← All teams</Button></Link>
            {myRole !== "owner" && me && <Button variant="outline" size="sm" onClick={leave}><LogOut className="w-4 h-4 mr-1" />Leave</Button>}
            {myRole === "owner" && <Button variant="outline" size="sm" onClick={deleteTeam} className="text-destructive"><Trash2 className="w-4 h-4 mr-1" />Delete</Button>}
          </div>
        </div>

        {canManage && (
          <Card className="p-3 mb-4 flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium">Invite code:</span>
            <code className="px-2 py-1 bg-accent/20 rounded text-sm">{team.invite_code}</code>
            <Button size="sm" variant="ghost" onClick={copyInvite}><Copy className="w-3.5 h-3.5" /></Button>
            <Button size="sm" variant="ghost" onClick={regenInvite}><RefreshCw className="w-3.5 h-3.5" /></Button>
            <span className="text-xs text-muted-foreground ml-auto">Share this code so others can join.</span>
          </Card>
        )}

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="members">Members ({members.length})</TabsTrigger>
            <TabsTrigger value="projects">Projects ({projects.length})</TabsTrigger>
            <TabsTrigger value="glossary">Glossary ({glossary.length})</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Card className="p-4"><p className="text-xs text-muted-foreground">Members</p><p className="text-2xl font-bold">{team.member_count}</p></Card>
              <Card className="p-4"><p className="text-xs text-muted-foreground">Projects</p><p className="text-2xl font-bold">{team.project_count}</p></Card>
              <Card className="p-4"><p className="text-xs text-muted-foreground">Your role</p><p className="text-2xl font-bold capitalize">{myRole}</p></Card>
            </div>
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Activity feed</h3>
              {activity.length === 0 && <p className="text-sm text-muted-foreground">No activity yet.</p>}
              <ul className="space-y-2 text-sm">
                {activity.map((a: any) => (
                  <li key={a.id} className="flex items-start gap-2 py-1 border-b border-border/30 last:border-0">
                    <span className="text-xs px-1.5 py-0.5 bg-accent/20 rounded">{a.event_type}</span>
                    <span className="text-xs text-muted-foreground ml-auto">{new Date(a.created_at).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </TabsContent>

          <TabsContent value="members">
            <Card className="p-4">
              <div className="space-y-2">
                {members.map((m: any) => (
                  <div key={m.user_id} className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0">
                    {m.profiles?.avatar_url ? (
                      <img src={m.profiles.avatar_url} className="w-8 h-8 rounded-full" alt="" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-primary grid place-items-center text-white text-xs font-bold">
                        {(m.profiles?.full_name || "?").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{m.profiles?.full_name || "Anon"} {m.user_id === user?.id && <span className="text-xs text-muted-foreground">(you)</span>}</p>
                      <p className="text-xs text-muted-foreground">Joined {new Date(m.joined_at).toLocaleDateString()}</p>
                    </div>
                    {isOwnerOrAdmin && m.role !== "owner" && m.user_id !== user?.id ? (
                      <>
                        <Select value={m.role} onValueChange={async (v) => {
                          const { data, error } = await supabase.rpc("update_team_member_role" as any, { _team_id: teamId, _user_id: m.user_id, _role: v });
                          if (error) return toast.error(error.message);
                          const r = data as any; if (!r.ok) return toast.error(r.error || "Failed");
                          toast.success("Role updated"); refreshAll();
                        }}>
                          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                          <SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                        </Select>
                        <Button variant="ghost" size="icon" onClick={async () => {
                          if (!confirm("Remove member?")) return;
                          const { data, error } = await supabase.rpc("remove_team_member" as any, { _team_id: teamId, _user_id: m.user_id });
                          if (error) return toast.error(error.message);
                          const r = data as any; if (!r.ok) return toast.error(r.error || "Failed");
                          toast.success("Removed"); refreshAll();
                        }}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary capitalize">{m.role}</span>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="projects" className="space-y-3">
            {canManage && <CreateProjectDialog teamId={teamId} onCreated={refreshAll} />}
            {projects.length === 0 && <Card className="p-6 text-center text-muted-foreground">No projects yet.</Card>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {projects.map((p: any) => (
                <Card key={p.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{p.description || "No description"}</p>
                    </div>
                    <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-accent/20">{p.status}</span>
                  </div>
                  <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{p.source_language.toUpperCase()} → {p.target_language.toUpperCase()}</span>
                    <span>· {p.progress}% done</span>
                  </div>
                  <div className="mt-2 h-1.5 bg-accent/20 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-primary" style={{ width: `${p.progress}%` }} />
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="glossary" className="space-y-3">
            {canManage && <AddGlossaryDialog teamId={teamId} onAdded={refreshAll} />}
            {glossary.length === 0 && <Card className="p-6 text-center text-muted-foreground">No terms yet.</Card>}
            <Card className="divide-y divide-border/40">
              {glossary.map((g: any) => (
                <div key={g.id} className="p-3 flex items-start gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{g.term} <span className="text-muted-foreground">→</span> {g.translation}</p>
                    {g.notes && <p className="text-xs text-muted-foreground mt-0.5">{g.notes}</p>}
                  </div>
                  <span className="text-xs text-muted-foreground">{g.source_language.toUpperCase()} → {g.target_language.toUpperCase()}</span>
                  {canManage && (
                    <Button variant="ghost" size="icon" onClick={async () => {
                      const { error } = await (supabase as any).from("team_glossary").delete().eq("id", g.id);
                      if (error) return toast.error(error.message);
                      toast.success("Deleted"); refreshAll();
                    }}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  )}
                </div>
              ))}
            </Card>
          </TabsContent>

          <TabsContent value="chat">
            <TeamChat teamId={teamId} />
          </TabsContent>
        </Tabs>
      </div>
    </SiteLayout>
  );
}

function CreateProjectDialog({ teamId, onCreated }: { teamId: string; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [src, setSrc] = useState("en");
  const [tgt, setTgt] = useState("es");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { data, error } = await supabase.rpc("create_team_project" as any, {
      _team_id: teamId, _name: name, _description: description || null,
      _source_language: src, _target_language: tgt,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    const res = data as { ok: boolean; error?: string; limit?: number };
    if (!res.ok) {
      if (res.error === "project_limit_reached") return toast.error(`Plan allows ${res.limit} projects. Upgrade for more.`);
      return toast.error(res.error || "Failed");
    }
    toast.success("Project created!");
    setOpen(false); setName(""); setDescription("");
    onCreated();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-primary text-white"><Plus className="w-4 h-4 mr-1" />New project</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Create a project</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div><label className="text-sm font-medium">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={80} /></div>
          <div><label className="text-sm font-medium">Description</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-sm font-medium">Source</label>
              <Input value={src} onChange={(e) => setSrc(e.target.value.toLowerCase())} maxLength={5} /></div>
            <div><label className="text-sm font-medium">Target</label>
              <Input value={tgt} onChange={(e) => setTgt(e.target.value.toLowerCase())} maxLength={5} /></div>
          </div>
          <Button type="submit" disabled={saving} className="w-full bg-gradient-primary text-white">
            {saving ? "Creating…" : "Create project"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddGlossaryDialog({ teamId, onAdded }: { teamId: string; onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [translation, setTranslation] = useState("");
  const [notes, setNotes] = useState("");
  const [src, setSrc] = useState("en");
  const [tgt, setTgt] = useState("es");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { error } = await (supabase as any).from("team_glossary").insert({
      team_id: teamId, term: term.trim(), translation: translation.trim(),
      notes: notes || null, source_language: src, target_language: tgt,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Term added!");
    setOpen(false); setTerm(""); setTranslation(""); setNotes("");
    onAdded();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-primary text-white"><Plus className="w-4 h-4 mr-1" />Add term</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add glossary term</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-sm font-medium">Term</label>
              <Input value={term} onChange={(e) => setTerm(e.target.value)} required maxLength={120} /></div>
            <div><label className="text-sm font-medium">Translation</label>
              <Input value={translation} onChange={(e) => setTranslation(e.target.value)} required maxLength={120} /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-sm font-medium">Source</label>
              <Input value={src} onChange={(e) => setSrc(e.target.value.toLowerCase())} maxLength={5} /></div>
            <div><label className="text-sm font-medium">Target</label>
              <Input value={tgt} onChange={(e) => setTgt(e.target.value.toLowerCase())} maxLength={5} /></div>
          </div>
          <div><label className="text-sm font-medium">Notes (optional)</label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} /></div>
          <Button type="submit" disabled={saving} className="w-full bg-gradient-primary text-white">
            {saving ? "Saving…" : "Add term"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
