import { supabase } from "@/integrations/supabase/client";

export const WHATSAPP_PHONE = "201022583151";

type Plan = "pro" | "business";

interface Args {
  plan: Plan;
  user: { id: string; email?: string | null } | null;
  profileName?: string | null;
  billing?: "monthly" | "yearly";
}

/**
 * Opens WhatsApp with a pre-filled checkout message and records the event.
 * - Mobile: redirects in the same tab so the WhatsApp app opens directly.
 * - Desktop: opens a new tab to api.whatsapp.com.
 */
export function startWhatsAppCheckout({ plan, user, profileName, billing = "monthly" }: Args) {
  const planLabel = plan === "pro" ? "Pro Plan" : "Business Plan";
  const name = profileName || user?.email?.split("@")[0] || "";
  const email = user?.email || "";

  const lines = user
    ? [
        "Hello Lingua AI Team,",
        "",
        `I would like to subscribe to the ${planLabel}.`,
        "",
        `Name: ${name}`,
        `Email: ${email}`,
        `Billing: ${billing}`,
        "",
        "Please help me complete my subscription.",
      ]
    : [
        "Hello Lingua AI Team,",
        "",
        `I would like to subscribe to the ${planLabel}.`,
        "",
        "Please help me complete my subscription.",
      ];

  const message = lines.join("\n");

  if (user) {
    // Fire-and-forget analytics + pending subscription
    void supabase.from("checkout_events").insert({
      user_id: user.id,
      plan,
      billing,
      channel: "whatsapp",
      user_email: email,
      user_name: name,
    });

    void supabase.from("subscriptions").insert({
      user_id: user.id,
      plan,
      status: "pending",
      payment_status: "pending",
      notes: `Awaiting payment via WhatsApp (${billing} billing)`,
    });
  }

  const url = `https://api.whatsapp.com/send/?phone=${WHATSAPP_PHONE}&text=${encodeURIComponent(message)}&type=phone_number&app_absent=0`;

  const isMobile =
    typeof navigator !== "undefined" &&
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  if (isMobile) {
    window.location.href = url;
  } else {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}
