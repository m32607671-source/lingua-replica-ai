import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PLAN_LIMITS: Record<string, number> = { free: 5, pro: 100, business: -1 };

const CHARACTER_PERSONAS: Record<string, string> = {
  owl: "You are Scholar Owl, a wise and patient language tutor. Explain things clearly with academic depth, but stay friendly.",
  fox: "You are Explorer Fox, an energetic adventurer who makes language learning feel like an exciting journey. Use vivid examples.",
  nova: "You are Robot Nova, a precise AI assistant. Give structured, concise, fact-based answers with clear steps.",
  panda: "You are Panda Buddy, a warm and encouraging companion. Celebrate progress and keep learners motivated.",
};

const PLAN_CAPABILITIES: Record<string, string> = {
  free: "You help with: platform guidance, FAQ, navigation, basic grammar, beginner tips, game suggestions. Keep replies short.",
  pro: "You help with everything in Free, plus: translation explanations, grammar correction, synonyms, vocabulary coaching, writing improvement, personalized exercises, translation quality analysis, learning paths.",
  business: "You help with everything in Pro, plus: advanced linguistic analysis, industry terminology (legal, medical), business writing, team learning, workflow optimization.",
};

export const sendCompanionMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      message: z.string().min(1).max(2000),
      character: z.enum(["owl", "fox", "nova", "panda"]).default("owl"),
      context: z.string().max(4000).optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Determine real-time subscription access from the database source of truth.
    const { data: accessRow } = await (supabase.rpc as unknown as (fn: string) => Promise<{ data: { current_plan?: string; ai_limit?: number; ai_used_today?: number } | null }>)
      ("get_my_subscription_access");
    const plan = accessRow?.current_plan || "free";
    const limit = accessRow?.ai_limit ?? PLAN_LIMITS[plan] ?? 5;

    // Daily quota
    if (limit !== -1) {
      const used = accessRow?.ai_used_today ?? 0;
      if (used >= limit) {
        await (supabase.rpc as unknown as (fn: string, args: Record<string, unknown>) => Promise<unknown>)(
          "track_subscription_access_event",
          { _event_type: "ai_limit_block", _plan: plan, _details: { used, limit, character: data.character } },
        );
        return {
          ok: false as const,
          error: "limit_reached",
          plan,
          used,
          limit,
          message: plan === "free"
            ? "You've reached your 5 daily messages. Upgrade to Pro for 100 messages/day or Business for unlimited."
            : "Daily message limit reached. Upgrade to Business for unlimited messages.",
        };
      }
    }

    // Load recent context (last 8 messages)
    const { data: history } = await supabase
      .from("companion_messages")
      .select("role, content")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(8);
    const prior = (history ?? []).reverse();

    // Load profile for personalization
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, native_language, learning_language, level, xp, coins, streak")
      .eq("id", userId)
      .maybeSingle();

    const persona = CHARACTER_PERSONAS[data.character];
    const caps = PLAN_CAPABILITIES[plan] ?? PLAN_CAPABILITIES.free;
    const userInfo = profile
      ? `User profile — name: ${profile.full_name ?? "Learner"}, native: ${profile.native_language}, learning: ${profile.learning_language}, level: ${profile.level}, XP: ${profile.xp}, coins: ${profile.coins}, streak: ${profile.streak} days.`
      : "";

    const systemPrompt = [
      persona,
      caps,
      userInfo,
      data.context ? `Current context: ${data.context}` : "",
      "Keep responses concise (under 180 words) and actionable. Use markdown when helpful.",
    ].filter(Boolean).join("\n\n");

    // Log the user message
    await supabase.from("companion_messages").insert({
      user_id: userId, role: "user", content: data.message,
    });

    // Call Lovable AI Gateway
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { ok: false as const, error: "ai_not_configured", message: "AI service is not configured." };
    }

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...prior.map((m) => ({ role: m.role, content: m.content })),
          { role: "user", content: data.message },
        ],
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) {
        return { ok: false as const, error: "rate_limited", message: "Too many requests. Try again in a moment." };
      }
      if (resp.status === 402) {
        return { ok: false as const, error: "credits", message: "AI credits exhausted. Please add credits in workspace usage settings." };
      }
      const t = await resp.text();
      console.error("AI gateway error", resp.status, t);
      return { ok: false as const, error: "ai_error", message: "AI service error. Please try again." };
    }

    const json = await resp.json() as { choices?: { message?: { content?: string } }[] };
    const reply = json.choices?.[0]?.message?.content?.trim() || "I'm not sure how to respond.";

    // Log assistant reply
    await supabase.from("companion_messages").insert({
      user_id: userId, role: "assistant", content: reply,
    });

    return { ok: true as const, reply, plan, limit };
  });

export const getCompanionState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [{ data: prefs }, accessRes, { data: msgs }] = await Promise.all([
      supabase.from("companion_prefs").select("character").eq("user_id", userId).maybeSingle(),
      (supabase.rpc as unknown as (fn: string) => Promise<{ data: { current_plan?: string; ai_limit?: number; ai_used_today?: number } | null }>)
        ("get_my_subscription_access"),
      supabase.from("companion_messages").select("role, content, created_at")
        .eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
    ]);
    const plan = accessRes.data?.current_plan || "free";
    return {
      character: prefs?.character ?? "owl",
      plan,
      limit: accessRes.data?.ai_limit ?? PLAN_LIMITS[plan] ?? 5,
      used: accessRes.data?.ai_used_today ?? 0,
      history: (msgs ?? []).reverse(),
    };
  });

export const setCompanionCharacter = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ character: z.enum(["owl", "fox", "nova", "panda"]) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await supabase.from("companion_prefs").upsert({
      user_id: userId, character: data.character, updated_at: new Date().toISOString(),
    });
    return { ok: true };
  });
