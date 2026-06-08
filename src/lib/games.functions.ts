import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { LANG_NAMES } from "@/lib/languages";

const GAME_CODES = ["word-catcher", "memory-match", "hangman-translator"] as const;

const ContentInput = z.object({
  game: z.enum(GAME_CODES),
  from: z.string().min(2).max(10).default("en"),
  to: z.string().min(2).max(10).default("es"),
  count: z.number().int().min(4).max(20).default(10),
});

type WordPair = { source: string; target: string };

async function callAI(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("AI not configured");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) {
    if (res.status === 429) throw new Error("Rate limited — try again shortly");
    if (res.status === 402) throw new Error("AI credits exhausted");
    throw new Error(`AI error ${res.status}`);
  }
  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return json.choices?.[0]?.message?.content ?? "{}";
}

function safeParseJson<T>(raw: string, fallback: T): T {
  try {
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
    return JSON.parse(cleaned) as T;
  } catch {
    return fallback;
  }
}

export const generateGameContent = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => ContentInput.parse(d))
  .handler(async ({ data }) => {
    const fromName = LANG_NAMES[data.from] ?? data.from;
    const toName = LANG_NAMES[data.to] ?? data.to;

    if (data.game === "hangman-translator") {
      const userPrompt = `Pick one common ${toName} word (single word, 4-10 letters, lowercase, no accents requiring special chars beyond ${toName} alphabet). Return JSON: {"word":"<the ${toName} word>","hint":"<short ${fromName} translation/definition (max 6 words)>"}`;
      const raw = await callAI(
        "You are a language tutor that returns strict JSON only.",
        userPrompt,
      );
      const parsed = safeParseJson<{ word?: string; hint?: string }>(raw, {});
      return {
        word: (parsed.word || "hello").toLowerCase().replace(/[^a-zà-žα-ω]/gi, ""),
        hint: parsed.hint || "a greeting",
        from: data.from,
        to: data.to,
      };
    }

    // word-catcher and memory-match share a vocabulary pair list
    const userPrompt = `Give ${data.count} common everyday vocabulary pairs translated from ${fromName} to ${toName}. Mix nouns, verbs, adjectives. Single words only, no phrases. Return JSON: {"pairs":[{"source":"<${fromName} word>","target":"<${toName} word>"}, ...]}`;
    const raw = await callAI(
      "You are a language tutor. Return strict JSON with simple single-word translations.",
      userPrompt,
    );
    const parsed = safeParseJson<{ pairs?: WordPair[] }>(raw, { pairs: [] });
    const pairs = (parsed.pairs || [])
      .filter((p) => p?.source && p?.target)
      .slice(0, data.count);
    return { pairs, from: data.from, to: data.to };
  });

const ScoreInput = z.object({
  game: z.enum(GAME_CODES),
  score: z.number().int().min(0).max(500),
  duration_seconds: z.number().int().min(1).max(3600).optional(),
});

export const submitGameScore = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ScoreInput.parse(d))
  .handler(async ({ data, context }) => {
    const { data: result, error } = await context.supabase.rpc("submit_game_score", {
      _game_code: data.game,
      _score: data.score,
      _duration_seconds: data.duration_seconds ?? undefined,
    });
    if (error) return { ok: false, error: error.message };
    return result as { ok: boolean; xp_earned?: number; coins_earned?: number; error?: string };
  });
