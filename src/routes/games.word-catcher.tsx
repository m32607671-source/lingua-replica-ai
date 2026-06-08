import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { generateGameContent, submitGameScore } from "@/lib/games.functions";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/games/word-catcher")({
  component: WordCatcher,
  head: () => ({ meta: [{ title: "Word Catcher — Lingua AI" }] }),
  errorComponent: ({ error }) => <div className="p-8">Error: {error.message}</div>,
  notFoundComponent: () => <div className="p-8">Not found</div>,
});

type Pair = { source: string; target: string };
type Falling = { id: number; word: string; x: number; y: number; correct: boolean };

const ROUND_SECONDS = 60;

function WordCatcher() {
  const { user, profile } = useAuth();
  const gen = useServerFn(generateGameContent);
  const submit = useServerFn(submitGameScore);

  const [pairs, setPairs] = useState<Pair[]>([]);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [score, setScore] = useState(0);
  const [target, setTarget] = useState<Pair | null>(null);
  const [falling, setFalling] = useState<Falling[]>([]);
  const idRef = useRef(1);

  const learning = profile?.learning_language || "es";
  const native = profile?.native_language || "en";

  async function start() {
    setLoading(true);
    try {
      const res = await gen({ data: { game: "word-catcher", from: native, to: learning, count: 10 } });
      const p = ("pairs" in res ? res.pairs : []) as Pair[];
      if (!p.length) throw new Error("No content");
      setPairs(p);
      setScore(0);
      setTimeLeft(ROUND_SECONDS);
      setFalling([]);
      setTarget(p[Math.floor(Math.random() * p.length)]);
      setPlaying(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to start");
    } finally {
      setLoading(false);
    }
  }

  // Timer
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [playing]);

  // End round
  useEffect(() => {
    if (!playing || timeLeft > 0) return;
    setPlaying(false);
    if (user) {
      submit({ data: { game: "word-catcher", score, duration_seconds: ROUND_SECONDS } })
        .then((r) => {
          if (r.ok) toast.success(`+${r.xp_earned} XP · +${r.coins_earned} 🪙`);
          else if (r.error) toast.error(r.error);
        })
        .catch(() => toast.error("Failed to save score"));
    }
  }, [playing, timeLeft, score, submit, user]);

  // Spawn falling words
  useEffect(() => {
    if (!playing || !target || !pairs.length) return;
    const spawner = setInterval(() => {
      setFalling((prev) => {
        // Spawn either the correct target or a distractor
        const showCorrect = Math.random() < 0.4;
        const pair = showCorrect ? target : pairs[Math.floor(Math.random() * pairs.length)];
        return [
          ...prev,
          {
            id: idRef.current++,
            word: pair.target,
            x: 5 + Math.random() * 85,
            y: 0,
            correct: pair.target === target.target,
          },
        ];
      });
    }, 900);
    return () => clearInterval(spawner);
  }, [playing, target, pairs]);

  // Animate falling words
  useEffect(() => {
    if (!playing) return;
    const ticker = setInterval(() => {
      setFalling((prev) => prev.map((f) => ({ ...f, y: f.y + 2 })).filter((f) => f.y < 100));
    }, 80);
    return () => clearInterval(ticker);
  }, [playing]);

  function tap(f: Falling) {
    if (f.correct) {
      setScore((s) => s + 5);
      setTarget(pairs[Math.floor(Math.random() * pairs.length)]);
    } else {
      setScore((s) => Math.max(0, s - 2));
    }
    setFalling((prev) => prev.filter((x) => x.id !== f.id));
  }

  const progress = useMemo(() => (timeLeft / ROUND_SECONDS) * 100, [timeLeft]);

  return (
    <SiteLayout>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">🪂 Word Catcher</h1>
            <p className="text-sm text-muted-foreground">Tap the falling word that matches the target.</p>
          </div>
          <Link to="/games"><Button variant="ghost" size="sm">← All games</Button></Link>
        </div>

        {!playing && !loading && (
          <Card className="p-8 text-center space-y-4">
            <p>Translate from <strong>{native}</strong> → <strong>{learning}</strong></p>
            {!user && <p className="text-sm text-amber-500">Sign in to earn XP &amp; coins.</p>}
            <Button onClick={start} size="lg" className="bg-gradient-primary text-white">Start round</Button>
            {score > 0 && <p className="text-lg">Last score: <strong>{score}</strong></p>}
          </Card>
        )}

        {loading && <Card className="p-8 text-center">Generating words…</Card>}

        {playing && target && (
          <>
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm">Score: <strong className="text-lg">{score}</strong></div>
              <div className="text-sm">Time: <strong>{timeLeft}s</strong></div>
            </div>
            <Progress value={progress} className="mb-3" />
            <Card className="p-4 mb-4 text-center">
              <p className="text-xs text-muted-foreground">Catch the translation of</p>
              <p className="text-2xl font-bold text-primary">{target.source}</p>
            </Card>
            <div className="relative h-[400px] rounded-xl border border-border/40 bg-card/50 overflow-hidden">
              {falling.map((f) => (
                <button
                  key={f.id}
                  onClick={() => tap(f)}
                  className="absolute px-3 py-1.5 rounded-lg bg-accent/20 hover:bg-accent/40 border border-border text-sm font-medium transition-colors"
                  style={{ left: `${f.x}%`, top: `${f.y}%` }}
                >
                  {f.word}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </SiteLayout>
  );
}
