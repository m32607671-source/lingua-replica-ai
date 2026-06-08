import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Game = {
  code: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  xp_reward: number;
  coin_reward: number;
  status: string;
};

const LIVE_ROUTES: Record<string, string> = {
  "word-catcher": "/games/word-catcher",
  "memory-match": "/games/memory-match",
  "hangman-translator": "/games/hangman",
};

export function GameCard({ game }: { game: Game }) {
  const live = game.status === "live";
  const href = LIVE_ROUTES[game.code];

  const inner = (
    <Card className="p-5 h-full flex flex-col gap-3 hover:shadow-elegant transition-all hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-2">
        <span className="text-4xl" aria-hidden>{game.icon}</span>
        {live ? (
          <Badge className="bg-gradient-primary text-white">Live</Badge>
        ) : (
          <Badge variant="secondary">Soon</Badge>
        )}
      </div>
      <div>
        <h3 className="font-semibold text-base leading-tight">{game.name}</h3>
        <p className="text-xs text-muted-foreground capitalize mt-0.5">{game.category}</p>
      </div>
      <p className="text-sm text-muted-foreground line-clamp-2 flex-1">{game.description}</p>
      <div className="flex items-center gap-3 text-xs font-medium pt-2 border-t border-border/40">
        <span className="text-primary">+{game.xp_reward} XP</span>
        <span className="text-amber-500">+{game.coin_reward} 🪙</span>
      </div>
    </Card>
  );

  if (live && href) {
    return <Link to={href} className="block h-full">{inner}</Link>;
  }
  return <div className="opacity-70 cursor-not-allowed h-full">{inner}</div>;
}
