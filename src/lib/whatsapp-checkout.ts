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
 * Opens WhatsApp in a new tab with a pre-filled checkout message.
 * Records analytics + a pending subscription for signed-in users.
 */
export function startWhatsAppCheckout({ plan, user, profileName, billing = "monthly" }: Args) {
  const planLabel = plan === "pro" ? "Pro Plan" : "Business Plan";
  const name = profileName || user?.email?.split("@")[0] || "";
  const email = user?.email || "";

  // Exact message text required by spec.
  const message = `Hello, I want to subscribe to the ${planLabel}`;

  if (user) {
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

  const url = `https://api.whatsapp.com/send/?phone=${WHATSAPP_PHONE}&text=${encodeURIComponent(
    message,
  )}&type=phone_number&app_absent=0&wame_ctl=1`;

  // Always open in a new tab/window per spec.
  if (typeof window !== "undefined") {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}
