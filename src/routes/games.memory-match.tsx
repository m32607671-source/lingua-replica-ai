import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { generateGameContent, submitGameScore } from "@/lib/games.functions";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/games/memory-match")({
  component: MemoryMatch,
  head: () => ({ meta: [{ title: "Memory Match — Lingua AI" }] }),
  errorComponent: ({ error }) => <div className="p-8">Error: {error.message}</div>,
  notFoundComponent: () => <div className="p-8">Not found</div>,
});

type Card = { id: number; text: string; pair: number; flipped: boolean; matched: boolean };

const PAIRS = 8;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function MemoryMatch() {
  const { user, profile } = useAuth();
  const gen = useServerFn(generateGameContent);
  const submit = useServerFn(submitGameScore);

  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  const learning = profile?.learning_language || "es";
  const native = profile?.native_language || "en";

  async function start() {
    setLoading(true);
    setDone(false);
    try {
      const res = await gen({ data: { game: "memory-match", from: native, to: learning, count: PAIRS } });
      const pairs = ("pairs" in res ? res.pairs : []) as Array<{ source: string; target: string }>;
      if (pairs.length < PAIRS) throw new Error("Not enough content");
      const list: Card[] = [];
      pairs.slice(0, PAIRS).forEach((p, i) => {
        list.push({ id: i * 2, text: p.source, pair: i, flipped: false, matched: false });
        list.push({ id: i * 2 + 1, text: p.target, pair: i, flipped: false, matched: false });
      });
      setCards(shuffle(list));
      setFlipped([]);
      setMoves(0);
      setMatches(0);
      setStartedAt(Date.now());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to start");
    } finally {
      setLoading(false);
    }
  }

  function tap(id: number) {
    if (flipped.length >= 2) return;
    const c = cards.find((x) => x.id === id);
    if (!c || c.matched || c.flipped) return;
    setCards((cs) => cs.map((x) => (x.id === id ? { ...x, flipped: true } : x)));
    setFlipped((f) => [...f, id]);
  }

  useEffect(() => {
    if (flipped.length !== 2) return;
    setMoves((m) => m + 1);
    const [a, b] = flipped.map((id) => cards.find((c) => c.id === id)!);
    if (a.pair === b.pair) {
      setTimeout(() => {
        setCards((cs) => cs.map((x) => (x.id === a.id || x.id === b.id ? { ...x, matched: true } : x)));
        setMatches((m) => m + 1);
        setFlipped([]);
      }, 400);
    } else {
      setTimeout(() => {
        setCards((cs) => cs.map((x) => (x.id === a.id || x.id === b.id ? { ...x, flipped: false } : x)));
        setFlipped([]);
      }, 900);
    }
  }, [flipped, cards]);

  useEffect(() => {
    if (matches !== PAIRS || done) return;
    setDone(true);
    const duration = startedAt ? Math.round((Date.now() - startedAt) / 1000) : 60;
    const score = Math.max(10, Math.round((PAIRS * 20) - moves - duration / 2));
    if (user) {
      submit({ data: { game: "memory-match", score, duration_seconds: duration } })
        .then((r) => {
          if (r.ok) toast.success(`Solved in ${moves} moves · +${r.xp_earned} XP · +${r.coins_earned} 🪙`);
          else if (r.error) toast.error(r.error);
        })
        .catch(() => toast.error("Failed to save score"));
    } else {
      toast.success(`Solved in ${moves} moves!`);
    }
  }, [matches, done, moves, startedAt, submit, user]);

  return (
    <SiteLayout>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">🧠 Memory Match</h1>
            <p className="text-sm text-muted-foreground">Match words with their translations.</p>
          </div>
          <Link to="/games"><Button variant="ghost" size="sm">← All games</Button></Link>
        </div>

        {cards.length === 0 && !loading && (
          <Card className="p-8 text-center space-y-4">
            <p>Translate from <strong>{native}</strong> → <strong>{learning}</strong></p>
            {!user && <p className="text-sm text-amber-500">Sign in to earn XP &amp; coins.</p>}
            <Button onClick={start} size="lg" className="bg-gradient-primary text-white">Start</Button>
          </Card>
        )}
        {loading && <Card className="p-8 text-center">Generating cards…</Card>}

        {cards.length > 0 && (
          <>
            <div className="flex justify-between mb-3 text-sm">
              <span>Moves: <strong>{moves}</strong></span>
              <span>Matched: <strong>{matches}/{PAIRS}</strong></span>
              <Button size="sm" variant="ghost" onClick={start}>Restart</Button>
            </div>
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {cards.map((c) => (
                <button
                  key={c.id}
                  onClick={() => tap(c.id)}
                  disabled={c.matched}
                  className={cn(
                    "aspect-[3/4] rounded-lg border border-border text-xs sm:text-sm font-medium transition-all p-2 grid place-items-center",
                    c.flipped || c.matched ? "bg-gradient-primary text-white" : "bg-card hover:bg-accent/20",
                    c.matched && "opacity-50",
                  )}
                >
                  {(c.flipped || c.matched) ? c.text : "?"}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </SiteLayout>
  );
}
