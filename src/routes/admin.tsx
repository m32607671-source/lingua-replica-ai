import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useCallback } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useAuth } from "@/lib/auth";
import { useIsAdmin } from "@/lib/useIsAdmin";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import { Search, ArrowUp, ArrowDown, Power, PowerOff, Calendar, FileText, Users, CreditCard, TrendingUp, Loader2 } from "lucide-react";

type Plan = Database["public"]["Enums"]["subscription_plan"];
type SubStatus = Database["public"]["Enums"]["subscription_status"];
type PayStatus = Database["public"]["Enums"]["payment_status"];

const PLANS: Plan[] = ["free", "pro", "business"];
const STATUSES: SubStatus[] = ["active", "pending", "expired", "cancelled"];
const PAY_STATUSES: PayStatus[] = ["unpaid", "pending", "paid", "refunded", "failed"];
const PLAN_RANK: Record<Plan, number> = { free: 1, pro: 2, business: 3 };

interface AdminUser {
  id: string;
  full_name: string | null;
  email: string | null;
  user_created_at: string | null;
  last_sign_in_at: string | null;
}

interface Sub {
  id: string;
  user_id: string;
  plan: Plan;
  status: SubStatus;
  payment_status: PayStatus;
  start_date: string;
  end_date: string | null;
  notes: string | null;
  updated_at: string;
}

interface Row extends AdminUser {
  sub: Sub | null;
}

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({
    meta: [{ title: "Admin — Lingua AI" }, { name: "robots", content: "noindex" }],
  }),
});

function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useIsAdmin();
  const navigate = useNavigate();

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [planFilter, setPlanFilter] = useState<"all" | Plan>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | SubStatus>("all");
  const [editing, setEditing] = useState<Row | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login" });
  }, [authLoading, user, navigate]);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: users }, { data: subs }] = await Promise.all([
      supabase.from("admin_users_view").select("*").order("user_created_at", { ascending: false }),
      supabase.from("subscriptions").select("*").order("created_at", { ascending: false }),
    ]);

    const subByUser = new Map<string, Sub>();
    for (const s of (subs ?? []) as Sub[]) {
      const cur = subByUser.get(s.user_id);
      if (!cur) { subByUser.set(s.user_id, s); continue; }
      const score = (x: Sub) =>
        (x.status === "active" ? 100 : 0) + PLAN_RANK[x.plan];
      if (score(s) > score(cur)) subByUser.set(s.user_id, s);
    }
    const merged: Row[] = ((users ?? []) as AdminUser[]).map((u) => ({
      ...u,
      sub: subByUser.get(u.id) ?? null,
    }));
    setRows(merged);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAdmin) void load();
  }, [isAdmin, load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (q && !(r.email?.toLowerCase().includes(q) || r.full_name?.toLowerCase().includes(q))) return false;
      const plan = r.sub?.plan ?? "free";
      const status = r.sub?.status ?? "active";
      if (planFilter !== "all" && plan !== planFilter) return false;
      if (statusFilter !== "all" && status !== statusFilter) return false;
      return true;
    });
  }, [rows, query, planFilter, statusFilter]);

  const analytics = useMemo(() => {
    const total = rows.length;
    const byPlan: Record<Plan, number> = { free: 0, pro: 0, business: 0 };
    const byStatus: Record<SubStatus, number> = { active: 0, pending: 0, expired: 0, cancelled: 0 };
    let paid = 0;
    for (const r of rows) {
      const p = r.sub?.plan ?? "free";
      const s = r.sub?.status ?? "active";
      byPlan[p]++;
      byStatus[s]++;
      if (r.sub?.payment_status === "paid" && p !== "free") paid++;
    }
    return { total, byPlan, byStatus, paid };
  }, [rows]);

  if (authLoading || roleLoading) {
    return <SiteLayout><div className="py-24 text-center text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div></SiteLayout>;
  }
  if (!isAdmin) {
    return (
      <SiteLayout>
        <div className="container max-w-2xl mx-auto py-24 text-center">
          <h1 className="text-2xl font-bold mb-2">Access denied</h1>
          <p className="text-muted-foreground">You need admin privileges to view this page.</p>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Subscription Admin</h1>
          <p className="text-muted-foreground">Manage users, plans, and payments.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={Users} label="Total users" value={analytics.total} />
          <StatCard icon={TrendingUp} label="Active" value={analytics.byStatus.active} />
          <StatCard icon={CreditCard} label="Paid (Pro/Biz)" value={analytics.paid} />
          <StatCard icon={FileText} label="Pending" value={analytics.byStatus.pending} />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Free" value={analytics.byPlan.free} />
          <StatCard label="Pro" value={analytics.byPlan.pro} />
          <StatCard label="Business" value={analytics.byPlan.business} />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={planFilter} onValueChange={(v) => setPlanFilter(v as typeof planFilter)}>
            <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Plan" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All plans</SelectItem>
              {PLANS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
            <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => void load()}>Refresh</Button>
        </div>

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>End date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No users found.</TableCell></TableRow>
              ) : filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="font-medium">{r.full_name || "—"}</div>
                    <div className="text-xs text-muted-foreground">{r.email}</div>
                  </TableCell>
                  <TableCell><Badge variant="outline">{r.sub?.plan ?? "free"}</Badge></TableCell>
                  <TableCell><StatusBadge status={r.sub?.status ?? "active"} /></TableCell>
                  <TableCell><Badge variant="secondary">{r.sub?.payment_status ?? "—"}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.sub?.end_date ? new Date(r.sub.end_date).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => setEditing(r)}>Manage</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {editing && (
        <ManageDialog
          row={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); void load(); }}
        />
      )}
    </SiteLayout>
  );
}

function StatCard({ icon: Icon, label, value }: { icon?: React.ComponentType<{ className?: string }>; label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground text-xs">
        {Icon && <Icon className="w-3.5 h-3.5" />}
        {label}
      </div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: SubStatus }) {
  const map: Record<SubStatus, string> = {
    active: "bg-green-500/15 text-green-600 dark:text-green-400",
    pending: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400",
    expired: "bg-muted text-muted-foreground",
    cancelled: "bg-red-500/15 text-red-600 dark:text-red-400",
  };
  return <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${map[status]}`}>{status}</span>;
}

function ManageDialog({ row, onClose, onSaved }: { row: Row; onClose: () => void; onSaved: () => void }) {
  const existing = row.sub;
  const [plan, setPlan] = useState<Plan>(existing?.plan ?? "free");
  const [status, setStatus] = useState<SubStatus>(existing?.status ?? "active");
  const [paymentStatus, setPaymentStatus] = useState<PayStatus>(existing?.payment_status ?? "unpaid");
  const [endDate, setEndDate] = useState<string>(existing?.end_date ? existing.end_date.slice(0, 10) : "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [saving, setSaving] = useState(false);

  const extend = (days: number) => {
    const base = endDate ? new Date(endDate) : new Date();
    base.setDate(base.getDate() + days);
    setEndDate(base.toISOString().slice(0, 10));
  };

  const upgrade = () => {
    if (plan === "free") setPlan("pro");
    else if (plan === "pro") setPlan("business");
  };
  const downgrade = () => {
    if (plan === "business") setPlan("pro");
    else if (plan === "pro") setPlan("free");
  };

  const save = async () => {
    setSaving(true);
    const payload = {
      plan,
      status,
      payment_status: paymentStatus,
      end_date: endDate ? new Date(endDate).toISOString() : null,
      notes: notes || null,
    };
    let error;
    if (existing) {
      const r = await supabase.from("subscriptions").update(payload).eq("id", existing.id);
      error = r.error;
    } else {
      const r = await supabase.from("subscriptions").insert({ user_id: row.id, ...payload });
      error = r.error;
    }
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Subscription updated");
    onSaved();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage subscription</DialogTitle>
          <div className="text-sm text-muted-foreground">{row.full_name || row.email}</div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={upgrade} disabled={plan === "business"}>
              <ArrowUp className="w-3.5 h-3.5" /> Upgrade
            </Button>
            <Button size="sm" variant="outline" onClick={downgrade} disabled={plan === "free"}>
              <ArrowDown className="w-3.5 h-3.5" /> Downgrade
            </Button>
            <Button size="sm" variant="outline" onClick={() => setStatus("active")}>
              <Power className="w-3.5 h-3.5" /> Activate
            </Button>
            <Button size="sm" variant="outline" onClick={() => setStatus("cancelled")}>
              <PowerOff className="w-3.5 h-3.5" /> Deactivate
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Plan">
              <Select value={plan} onValueChange={(v) => setPlan(v as Plan)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PLANS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Status">
              <Select value={status} onValueChange={(v) => setStatus(v as SubStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Payment status">
              <Select value={paymentStatus} onValueChange={(v) => setPaymentStatus(v as PayStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PAY_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="End date">
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </Field>
          </div>

          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => extend(30)}><Calendar className="w-3.5 h-3.5" /> +30d</Button>
            <Button size="sm" variant="ghost" onClick={() => extend(90)}><Calendar className="w-3.5 h-3.5" /> +90d</Button>
            <Button size="sm" variant="ghost" onClick={() => extend(365)}><Calendar className="w-3.5 h-3.5" /> +1y</Button>
          </div>

          <Field label="Payment notes">
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Internal notes about payment, contact, etc." />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => void save()} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}
