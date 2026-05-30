import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { LANG_NAMES, FREE_CODES } from "@/lib/languages";

const InputSchema = z.object({
  text: z.string().trim().min(1).max(5000),
  from: z.string().min(2).max(10),
  to: z.string().min(2).max(10),
});

const SYSTEM_PROMPT =
  "You are a professional translator. Translate the text accurately while preserving meaning, tone, and context. Return only the translation without explanations.";

export const translateText = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Determine real-time subscription access from the database source of truth.
    const { data: accessRow } = await (
      supabase.rpc as unknown as (
        fn: string,
      ) => Promise<{ data: { current_plan?: string; unlimited_languages?: boolean } | null }>
    )("get_my_subscription_access");
    const plan = accessRow?.current_plan || "free";
    const unlimitedLanguages = accessRow?.unlimited_languages ?? plan !== "free";

    // Free-plan language gate (backend enforcement).
    if (!unlimitedLanguages) {
      const target = data.to.toLowerCase();
      const source = data.from === "auto" ? null : data.from.toLowerCase();
      if (!FREE_CODES.has(target) || (source && !FREE_CODES.has(source))) {
        await (
          supabase.rpc as unknown as (fn: string, args: Record<string, unknown>) => Promise<unknown>
        )("track_subscription_access_event", {
          _event_type: "language_access_block",
          _plan: plan,
          _details: { from: data.from, to: data.to },
        });
        return {
          translation: "",
          error: "This language requires Pro or Business. Please upgrade to unlock 100+ languages.",
        };
      }
    }

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { translation: "", error: "Translation service is not configured." };
    }

    const fromName = LANG_NAMES[data.from] ?? data.from;
    const toName = LANG_NAMES[data.to] ?? data.to;
    const userPrompt =
      data.from === "auto"
        ? `Translate the following text into ${toName}:\n\n${data.text}`
        : `Translate the following text from ${fromName} into ${toName}:\n\n${data.text}`;

    const model = plan === "business" ? "openai/gpt-5" : "openai/gpt-5-mini";

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!res.ok) {
      if (res.status === 429) {
        return { translation: "", error: "Rate limit reached. Please try again shortly." };
      }
      if (res.status === 402) {
        return {
          translation: "",
          error: "AI credits exhausted. Please add credits in Lovable settings.",
        };
      }
      const detail = await res.text().catch(() => "");
      console.error("Translation API error", res.status, detail);
      return { translation: "", error: "Translation failed. Please try again." };
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const translation = json.choices?.[0]?.message?.content?.trim() ?? "";
    return { translation, error: null as string | null };
  });
