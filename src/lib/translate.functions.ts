import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const LANG_NAMES: Record<string, string> = {
  auto: "auto-detected source language",
  en: "English",
  ar: "Arabic",
  es: "Spanish",
  fr: "French",
  de: "German",
  zh: "Chinese",
  ja: "Japanese",
  ko: "Korean",
  ru: "Russian",
  pt: "Portuguese",
  it: "Italian",
  tr: "Turkish",
  hi: "Hindi",
  fa: "Persian",
  he: "Hebrew",
  ur: "Urdu",
};

const InputSchema = z.object({
  text: z.string().trim().min(1).max(5000),
  from: z.string().min(2).max(10),
  to: z.string().min(2).max(10),
});

const SYSTEM_PROMPT =
  "You are a professional translator. Translate the text accurately while preserving meaning, tone, and context. Return only the translation without explanations.";

export const translateText = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      throw new Error("Translation service is not configured.");
    }

    const fromName = LANG_NAMES[data.from] ?? data.from;
    const toName = LANG_NAMES[data.to] ?? data.to;
    const userPrompt =
      data.from === "auto"
        ? `Translate the following text into ${toName}:\n\n${data.text}`
        : `Translate the following text from ${fromName} into ${toName}:\n\n${data.text}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5-mini",
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
        return { translation: "", error: "AI credits exhausted. Please add credits in Lovable settings." };
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