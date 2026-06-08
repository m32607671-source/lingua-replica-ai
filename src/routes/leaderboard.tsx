import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/leaderboard")({
  component: Leaderboard,
  head: () => ({
    meta: [
      { title: "Leaderboard — Lingua AI" },
      { name: "description", content: "See the top language learners by XP, coins, and translations." },
    ],
  }),
  errorComponent: ({ error }) => <div className="p-8">Error: {error.message}</div>,
  notFoundComponent: () => <div className="p-8">Not found</div>,
});

type Metric = "xp" | "coins" | "translations_count";

const TABS: { key: Metric; label: string }[] = [
  { key: "xp", label: "XP" },
  { key: "coins", label: "Coins" },
  { key: "translations_count", label: "Translations" },
];

function Leaderboard() {
  const [metric, setMetric] = useState<Metric>("xp");
  const { user } = useAuth();

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["leaderboard", metric],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, xp, coins, translations_count, level, plan")
        .order(metric, { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <SiteLayout>
      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold">🏆 Leaderboard</h1>
          <p className="text-muted-foreground mt-2">Top 100 learners worldwide.</p>
        </div>
        <div className="flex gap-2 mb-4">
          {TABS.map((t) => (
            <Button
              key={t.key}
              variant={metric === t.key ? "default" : "outline"}
              size="sm"
              onClick={() => setMetric(t.key)}
            >
              {t.label}
            </Button>
          ))}
        </div>
        <Card className="divide-y divide-border/40">
          {isLoading && <div className="p-6 text-center text-muted-foreground">Loading…</div>}
          {!isLoading && rows.length === 0 && <div className="p-6 text-center text-muted-foreground">No players yet.</div>}
          {rows.map((r, i) => {
            const isMe = user?.id === r.id;
            return (
              <div
                key={r.id}
                className={cn(
                  "flex items-center gap-3 p-3",
                  isMe && "bg-primary/10",
                )}
              >
                <div className={cn(
                  "w-8 text-center font-bold",
                  i === 0 && "text-amber-500",
                  i === 1 && "text-zinc-400",
                  i === 2 && "text-amber-700",
                )}>{i + 1}</div>
                {r.avatar_url ? (
                  <img src={r.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-primary grid place-items-center text-white text-sm font-bold">
                    {(r.full_name || "?").charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{r.full_name || "Anonymous"} {isMe && <span className="text-xs text-primary">(you)</span>}</p>
                  <p className="text-xs text-muted-foreground capitalize">Lvl {r.level} · {r.plan}</p>
                </div>
                <div className="font-semibold text-right tabular-nums">
                  {(r[metric] ?? 0).toLocaleString()}
                </div>
              </div>
            );
          })}
        </Card>
      </div>
    </SiteLayout>
  );
}
