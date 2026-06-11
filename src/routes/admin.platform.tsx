import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useIsAdmin } from "@/lib/useIsAdmin";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Search, ShieldAlert, Coins, Zap, Ban, RotateCcw, Crown } from "lucide-react";

export const Route = createFileRoute("/admin/platform")({
  component: PlatformAdmin,
  head: () => ({ meta: [{ title: "Platform Admin — Lingua AI" }, { name: "robots", content: "noindex" }] }),
});

type AdminUserRow = {
  id: string; email: string | null; full_name: string | null; plan: string;
  xp: number; coins: number; level: number;
  banned_at: string | null; suspended_until: string | null;
  created_at: string; last_sign_in_at: string | null;
  is_admin: boolean; is_super_admin: boolean;
};

type AuditRow = {
  id: string; actor_email: string | null; action: string;
  target_type: string | null; target_id: string | null;
  before_state: unknown; after_state: unknown; details: unknown;
  created_at: string;
};

type Stats = {
  total_users: number; banned_users: number; pro_users: number; business_users: number;
  total_xp: number; total_coins: number; games_played_24h: number;
  new_users_7d: number; audit_events_24h: number;
};

function PlatformAdmin() {
  const { isAdmin, loading: adminLoading } = useIsAdmin();

  if (adminLoading) {
    return <SiteLayout><div className="container py-16 flex justify-center"><Loader2 className="animate-spin" /></div></SiteLayout>;
  }
  if (!isAdmin) {
    return (
      <SiteLayout>
        <div className="container py-16 text-center">
          <ShieldAlert className="mx-auto h-12 w-12 text-destructive mb-4" />
          <h1 className="text-2xl font-bold">Forbidden</h1>
          <p className="text-muted-foreground mt-2">Admin access required.</p>
          <Link to="/" className="text-primary underline mt-4 inline-block">Return home</Link>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="container py-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2"><Crown className="text-primary" /> Platform Administration</h1>
            <p className="text-muted-foreground">Manage users, rewards, and view audit trail.</p>
          </div>
          <Link to="/admin"><Button variant="outline">Subscriptions Admin</Button></Link>
        </div>

        <StatsPanel />

        <Tabs defaultValue="users" className="w-full">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
          </TabsList>
          <TabsContent value="users" className="mt-4"><UsersPanel /></TabsContent>
          <TabsContent value="audit" className="mt-4"><AuditPanel /></TabsContent>
        </Tabs>
      </div>
    </SiteLayout>
  );
}

function StatsPanel() {
  const [stats, setStats] = useState<Stats | null>(null);
  useEffect(() => {
    supabase.rpc("admin_platform_stats").then(({ data }) => {
      if (data) setStats(data as unknown as Stats);
    });
  }, []);
  if (!stats) return <div className="h-24 flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  const items = [
    { label: "Total users", value: stats.total_users },
    { label: "New (7d)", value: stats.new_users_7d },
    { label: "Pro", value: stats.pro_users },
    { label: "Business", value: stats.business_users },
    { label: "Banned", value: stats.banned_users },
    { label: "Games (24h)", value: stats.games_played_24h },
    { label: "Total XP", value: stats.total_xp.toLocaleString() },
    { label: "Total coins", value: stats.total_coins.toLocaleString() },
    { label: "Audit (24h)", value: stats.audit_events_24h },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {items.map((i) => (
        <Card key={i.label} className="p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">{i.label}</div>
          <div className="text-2xl font-bold mt-1">{i.value}</div>
        </Card>
      ))}
    </div>
  );
}

function UsersPanel() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<AdminUserRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("admin_list_users", { _search: search || null, _limit: 200 });
    if (error) toast.error(error.message);
    else setUsers((data ?? []) as AdminUserRow[]);
    setLoading(false);
  }, [search]);

  useEffect(() => { load(); }, [load]);

  return (
    <Card className="p-4">
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Search by email or name…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button onClick={load} disabled={loading}>{loading ? <Loader2 className="animate-spin h-4 w-4" /> : "Search"}</Button>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>XP</TableHead>
              <TableHead>Coins</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <div className="font-medium flex items-center gap-2">
                    {u.full_name || "—"}
                    {u.is_super_admin && <Badge variant="default" className="bg-amber-500">Super</Badge>}
                    {u.is_admin && !u.is_super_admin && <Badge variant="default">Admin</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground">{u.email}</div>
                </TableCell>
                <TableCell><Badge variant="secondary">{u.plan}</Badge></TableCell>
                <TableCell>{u.xp.toLocaleString()}</TableCell>
                <TableCell>{u.coins.toLocaleString()}</TableCell>
                <TableCell>
                  {u.banned_at ? <Badge variant="destructive">Banned</Badge>
                    : u.suspended_until && new Date(u.suspended_until) > new Date()
                      ? <Badge variant="outline">Suspended</Badge>
                      : <Badge variant="outline">Active</Badge>}
                </TableCell>
                <TableCell><Button size="sm" variant="outline" onClick={() => setSelected(u)}>Manage</Button></TableCell>
              </TableRow>
            ))}
            {users.length === 0 && !loading && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No users found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {selected && <ManageUserDialog user={selected} onClose={() => setSelected(null)} onChange={load} />}
    </Card>
  );
}

function ManageUserDialog({ user, onClose, onChange }: { user: AdminUserRow; onClose: () => void; onChange: () => void }) {
  const [xpDelta, setXpDelta] = useState("");
  const [coinDelta, setCoinDelta] = useState("");
  const [reason, setReason] = useState("");
  const [plan, setPlan] = useState(user.plan);
  const [banReason, setBanReason] = useState("");
  const [busy, setBusy] = useState(false);

  const rpc = (supabase as unknown as { rpc: (name: string, args: Record<string, unknown>) => Promise<{ error: { message: string } | null }> }).rpc.bind(supabase);

  const run = async (label: string, fn: () => Promise<{ error: { message: string } | null }>) => {
    setBusy(true);
    const { error } = await fn();
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success(label); onChange(); }
  };


  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Manage {user.full_name || user.email}
            {user.is_super_admin && <Badge className="bg-amber-500">Super Admin</Badge>}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <section className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2"><Zap className="h-4 w-4 text-primary" /> XP & Coins</h3>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="XP ± (e.g. 100 or -50)" value={xpDelta} onChange={(e) => setXpDelta(e.target.value)} />
              <Input placeholder="Coins ± (e.g. 50 or -20)" value={coinDelta} onChange={(e) => setCoinDelta(e.target.value)} />
            </div>
            <Input placeholder="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} />
            <div className="flex gap-2">
              <Button size="sm" disabled={busy || !xpDelta} onClick={() =>
                run("XP updated", () => supabase.rpc("admin_adjust_xp", { _user_id: user.id, _delta: parseInt(xpDelta, 10) || 0, _reason: reason || null }) as Promise<{ error: { message: string } | null }>)
              }><Zap className="h-3 w-3 mr-1" />Apply XP</Button>
              <Button size="sm" disabled={busy || !coinDelta} onClick={() =>
                run("Coins updated", () => supabase.rpc("admin_adjust_coins", { _user_id: user.id, _delta: parseInt(coinDelta, 10) || 0, _reason: reason || null }) as Promise<{ error: { message: string } | null }>)
              }><Coins className="h-3 w-3 mr-1" />Apply Coins</Button>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold">Subscription Plan</h3>
            <div className="flex gap-2">
              <Select value={plan} onValueChange={setPlan}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" disabled={busy || plan === user.plan} onClick={() =>
                run("Plan changed", () => supabase.rpc("admin_change_plan", { _user_id: user.id, _plan: plan as "free" | "pro" | "business", _months: 1 }) as Promise<{ error: { message: string } | null }>)
              }>Change plan</Button>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2"><Ban className="h-4 w-4 text-destructive" /> Moderation</h3>
            <Input placeholder="Ban / suspend reason" value={banReason} onChange={(e) => setBanReason(e.target.value)} />
            <div className="flex flex-wrap gap-2">
              {user.banned_at ? (
                <Button size="sm" variant="outline" disabled={busy} onClick={() =>
                  run("Unbanned", () => supabase.rpc("admin_unban_user", { _user_id: user.id }) as Promise<{ error: { message: string } | null }>)
                }>Unban</Button>
              ) : (
                <>
                  <Button size="sm" variant="destructive" disabled={busy || user.is_super_admin} onClick={() =>
                    run("Banned", () => supabase.rpc("admin_ban_user", { _user_id: user.id, _reason: banReason || null }) as Promise<{ error: { message: string } | null }>)
                  }>Ban</Button>
                  <Button size="sm" variant="outline" disabled={busy || user.is_super_admin} onClick={() => {
                    const until = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
                    run("Suspended 7d", () => supabase.rpc("admin_suspend_user", { _user_id: user.id, _until: until, _reason: banReason || null }) as Promise<{ error: { message: string } | null }>);
                  }}>Suspend 7 days</Button>
                </>
              )}
              <Button size="sm" variant="outline" disabled={busy} onClick={() => {
                if (!confirm("Reset all progress for this user? This deletes XP, sessions, achievements, streaks.")) return;
                run("Progress reset", () => supabase.rpc("admin_reset_user_progress", { _user_id: user.id }) as Promise<{ error: { message: string } | null }>);
              }}><RotateCcw className="h-3 w-3 mr-1" />Reset progress</Button>
            </div>
          </section>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AuditPanel() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("admin_audit_logs").select("*").order("created_at", { ascending: false }).limit(200)
      .then(({ data, error }) => {
        if (error) toast.error(error.message);
        else setRows((data ?? []) as AuditRow[]);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="h-24 flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <Card className="p-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>When</TableHead>
            <TableHead>Actor</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Target</TableHead>
            <TableHead>Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="text-xs">{new Date(r.created_at).toLocaleString()}</TableCell>
              <TableCell className="text-xs">{r.actor_email || "—"}</TableCell>
              <TableCell><Badge variant="outline">{r.action}</Badge></TableCell>
              <TableCell className="text-xs font-mono">{r.target_id?.slice(0, 8) || "—"}</TableCell>
              <TableCell className="text-xs max-w-md truncate">
                {JSON.stringify({ before: r.before_state, after: r.after_state, ...((r.details && typeof r.details === "object") ? r.details : {}) })}
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No audit events yet.</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
