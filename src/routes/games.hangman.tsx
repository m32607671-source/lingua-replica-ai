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

export const Route = createFileRoute("/games/hangman")({
  component: Hangman,
  head: () => ({ meta: [{ title: "Hangman Translator — Lingua AI" }] }),
  errorComponent: ({ error }) => <div className="p-8">Error: {error.message}</div>,
  notFoundComponent: () => <div className="p-8">Not found</div>,
});

const MAX_WRONG = 7;

function Hangman() {
  const { user, profile } = useAuth();
  const gen = useServerFn(generateGameContent);
  const submit = useServerFn(submitGameScore);

  const [loading, setLoading] = useState(false);
  const [word, setWord] = useState("");
  const [hint, setHint] = useState("");
  const [guessed, setGuessed] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState(0);
  const [done, setDone] = useState(false);

  const learning = profile?.learning_language || "es";
  const native = profile?.native_language || "en";

  async function start() {
    setLoading(true);
    setDone(false);
    try {
      const res = await gen({ data: { game: "hangman-translator", from: native, to: learning } });
      const w = ("word" in res ? res.word : "") as string;
      const h = ("hint" in res ? res.hint : "") as string;
      if (!w || w.length < 3) throw new Error("Bad word");
      setWord(w.toLowerCase());
      setHint(h);
      setGuessed(new Set());
      setWrong(0);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to start");
    } finally {
      setLoading(false);
    }
  }

  const letters = "abcdefghijklmnopqrstuvwxyz".split("");
  const display = word.split("").map((ch) => (guessed.has(ch) ? ch : "_"));
  const won = word && display.every((c) => c !== "_");
  const lost = wrong >= MAX_WRONG;

  function guess(l: string) {
    if (!word || done || guessed.has(l)) return;
    const next = new Set(guessed);
    next.add(l);
    setGuessed(next);
    if (!word.includes(l)) setWrong((w) => w + 1);
  }

  useEffect(() => {
    if (!word || done || (!won && !lost)) return;
    setDone(true);
    if (won) {
      const score = Math.max(5, (MAX_WRONG - wrong) * 10);
      if (user) {
        submit({ data: { game: "hangman-translator", score } })
          .then((r) => {
            if (r.ok) toast.success(`You won! +${r.xp_earned} XP · +${r.coins_earned} 🪙`);
          })
          .catch(() => {});
      } else {
        toast.success("You won!");
      }
    } else {
      toast.error(`The word was: ${word}`);
    }
  }, [won, lost, done, word, wrong, submit, user]);

  return (
    <SiteLayout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">🪢 Hangman Translator</h1>
            <p className="text-sm text-muted-foreground">Guess the {learning} word.</p>
          </div>
          <Link to="/games"><Button variant="ghost" size="sm">← All games</Button></Link>
        </div>

        {!word && !loading && (
          <Card className="p-8 text-center space-y-4">
            {!user && <p className="text-sm text-amber-500">Sign in to earn XP &amp; coins.</p>}
            <Button onClick={start} size="lg" className="bg-gradient-primary text-white">Start</Button>
          </Card>
        )}
        {loading && <Card className="p-8 text-center">Picking a word…</Card>}

        {word && (
          <Card className="p-6 space-y-6">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Hint ({native})</p>
              <p className="text-base font-medium">{hint}</p>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-5xl font-mono tracking-widest">
                {display.join(" ")}
              </div>
              <p className="text-sm mt-3 text-muted-foreground">Wrong guesses: {wrong} / {MAX_WRONG}</p>
            </div>
            <div className="grid grid-cols-7 sm:grid-cols-9 gap-1.5">
              {letters.map((l) => (
                <button
                  key={l}
                  onClick={() => guess(l)}
                  disabled={guessed.has(l) || done}
                  className={cn(
                    "h-9 rounded-md text-sm font-semibold border border-border transition-colors",
                    guessed.has(l)
                      ? word.includes(l)
                        ? "bg-primary text-primary-foreground"
                        : "bg-destructive/20 text-destructive"
                      : "bg-card hover:bg-accent/20",
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
            {done && (
              <div className="text-center">
                <Button onClick={start}>New word</Button>
              </div>
            )}
          </Card>
        )}
      </div>
    </SiteLayout>
  );
}
