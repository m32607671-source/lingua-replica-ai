import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import { GameCard } from "@/components/games/GameCard";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/games")({
  component: GamesHub,
  head: () => ({
    meta: [
      { title: "Games — Lingua AI" },
      { name: "description", content: "Play 50+ language-learning games. Earn XP, coins, and climb the leaderboard." },
    ],
  }),
  errorComponent: ({ error }) => <div className="p-8">Failed to load games: {error.message}</div>,
  notFoundComponent: () => <div className="p-8">Not found</div>,
});

const CATEGORIES = ["all", "vocabulary", "grammar", "translation", "pronunciation", "listening", "memory", "speed", "multiplayer"] as const;

function GamesHub() {
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("all");
  const { data: games = [] } = useQuery({
    queryKey: ["games"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("games")
        .select("code, name, category, description, icon, xp_reward, coin_reward, status, sort_order")
        .order("status", { ascending: true })
        .order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = cat === "all" ? games : games.filter((g) => g.category === cat);
  const liveCount = games.filter((g) => g.status === "live").length;

  return (
    <SiteLayout>
      <div className="container mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold">Games</h1>
          <p className="text-muted-foreground mt-2">
            {liveCount} games live now · {games.length - liveCount} coming soon · earn XP, coins, and climb the leaderboard.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 mb-6">
          {CATEGORIES.map((c) => (
            <Button
              key={c}
              size="sm"
              variant={cat === c ? "default" : "outline"}
              onClick={() => setCat(c)}
              className="capitalize"
            >
              {c}
            </Button>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((g) => <GameCard key={g.code} game={g} />)}
        </div>
      </div>
    </SiteLayout>
  );
}
