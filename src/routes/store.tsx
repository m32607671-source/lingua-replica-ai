import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useCallback } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Coins, Crown, Sparkles, Check, Loader2, Lock, Star, Zap, Gem } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/store")({
  component: StorePage,
  head: () => ({
    meta: [
      { title: "Companion Store — Lingua AI" },
      { name: "description", content: "Unlock premium companion skins with coins earned from learning." },
    ],
    links: [{ rel: "canonical", href: "/store" }],
  }),
});

type Rarity = "common" | "rare" | "epic" | "legendary";
type Character = "owl" | "fox" | "nova" | "panda";

interface Skin {
  id: string;
  code: string;
  character: Character;
  name: string;
  description: string | null;
  emoji: string;
  gradient: string;
  rarity: Rarity;
  price_coins: number;
  featured: boolean;
  limited: boolean;
  available: boolean;
}

interface Owned { skin_id: string; acquired_at: string }
interface Equipped { character: Character; skin_id: string }

const CHARACTERS: { id: Character; label: string; emoji: string }[] = [
  { id: "owl", label: "Scholar Owl", emoji: "🦉" },
  { id: "fox", label: "Explorer Fox", emoji: "🦊" },
  { id: "nova", label: "Robot Nova", emoji: "🤖" },
  { id: "panda", label: "Panda Buddy", emoji: "🐼" },
];

const RARITY_META: Record<Rarity, { label: string; icon: typeof Star; className: string }> = {
  common:    { label: "Common",    icon: Star,   className: "bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-500/30" },
  rare:      { label: "Rare",      icon: Zap,    className: "bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-500/30" },
  epic:      { label: "Epic",      icon: Gem,    className: "bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/30" },
  legendary: { label: "Legendary", icon: Crown,  className: "bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30" },
};

// Cast loose where the auto-generated types file hasn't been regenerated yet.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

function StorePage() {
  const { user, profile, refresh } = useAuth() as ReturnType<typeof useAuth> & { refresh?: () => Promise<void> };
  const navigate = useNavigate();

  const [skins, setSkins] = useState<Skin[]>([]);
  const [owned, setOwned] = useState<Owned[]>([]);
  const [equipped, setEquipped] = useState<Equipped[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Character | "featured" | "limited">("featured");
  const [confirm, setConfirm] = useState<Skin | null>(null);
  const [busy, setBusy] = useState(false);
  const [coins, setCoins] = useState<number>(profile?.coins ?? 0);

  useEffect(() => { if (!user) navigate({ to: "/login" }); }, [user, navigate]);
  useEffect(() => { setCoins(profile?.coins ?? 0); }, [profile?.coins]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [skinsRes, ownedRes, equipRes, profRes] = await Promise.all([
      sb.from("companion_skins").select("*").eq("available", true).order("price_coins", { ascending: true }),
      sb.from("owned_skins").select("skin_id, acquired_at").eq("user_id", user.id),
      sb.from("equipped_skins").select("character, skin_id").eq("user_id", user.id),
      sb.from("profiles").select("coins").eq("id", user.id).maybeSingle(),
    ]);
    setSkins((skinsRes.data ?? []) as Skin[]);
    setOwned((ownedRes.data ?? []) as Owned[]);
    setEquipped((equipRes.data ?? []) as Equipped[]);
    if (profRes.data?.coins != null) setCoins(profRes.data.coins as number);
    setLoading(false);
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  const ownedIds = useMemo(() => new Set(owned.map((o) => o.skin_id)), [owned]);
  const equippedMap = useMemo(() => {
    const m = new Map<Character, string>();
    for (const e of equipped) m.set(e.character, e.skin_id);
    return m;
  }, [equipped]);

  const filtered = useMemo(() => {
    if (tab === "featured") return skins.filter((s) => s.featured);
    if (tab === "limited") return skins.filter((s) => s.limited);
    return skins.filter((s) => s.character === tab);
  }, [skins, tab]);

  const purchase = async (skin: Skin) => {
    if (!user) return;
    setBusy(true);
    const { data, error } = await sb.rpc("purchase_skin", { _skin_id: skin.id });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    const res = data as { ok: boolean; error?: string; balance?: number; price?: number };
    if (!res?.ok) {
      const msg =
        res?.error === "insufficient_coins" ? `Not enough coins. You need ${res.price}, you have ${res.balance}.`
        : res?.error === "already_owned" ? "You already own this skin."
        : res?.error === "unauthenticated" ? "Please sign in again."
        : "Purchase failed.";
      toast.error(msg);
      return;
    }
    toast.success(`Unlocked ${skin.name} — ${skin.emoji}`);
    if (typeof res.balance === "number") setCoins(res.balance);
    setConfirm(null);
    await Promise.all([load(), refresh?.()]);
  };

  const equip = async (skin: Skin) => {
    if (!user) return;
    const { error } = await sb.from("equipped_skins").upsert({
      user_id: user.id, character: skin.character, skin_id: skin.id, equipped_at: new Date().toISOString(),
    });
    if (error) { toast.error(error.message); return; }
    toast.success(`Equipped ${skin.name}`);
    void load();
  };

  if (!user) return null;

  return (
    <SiteLayout>
      <section className="px-4 py-8 sm:py-12">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight flex items-center gap-2">
                <Sparkles className="w-7 h-7 text-primary" /> Companion Store
              </h1>
              <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                Spend coins to unlock premium skins for your AI companion.
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-500/30 self-start sm:self-auto">
              <Coins className="w-5 h-5 text-amber-500" />
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Balance</div>
                <div className="text-lg font-bold leading-none">{coins.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="w-full">
            <TabsList className="w-full overflow-x-auto justify-start gap-1 h-auto p-1">
              <TabsTrigger value="featured" className="gap-1.5"><Star className="w-3.5 h-3.5" /> Featured</TabsTrigger>
              <TabsTrigger value="limited" className="gap-1.5"><Crown className="w-3.5 h-3.5" /> Limited</TabsTrigger>
              {CHARACTERS.map((c) => (
                <TabsTrigger key={c.id} value={c.id} className="gap-1.5">
                  <span>{c.emoji}</span> <span className="hidden sm:inline">{c.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={tab} className="mt-6">
              {loading ? (
                <div className="py-16 grid place-items-center text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground">No skins in this category yet.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.map((skin) => {
                    const isOwned = ownedIds.has(skin.id);
                    const isEquipped = equippedMap.get(skin.character) === skin.id;
                    const canAfford = coins >= skin.price_coins;
                    const rarity = RARITY_META[skin.rarity];
                    const RIcon = rarity.icon;
                    return (
                      <Card
                        key={skin.id}
                        className={cn(
                          "overflow-hidden border-2 transition-all hover:-translate-y-0.5 hover:shadow-xl",
                          isEquipped ? "border-primary shadow-glow" : "border-border/60",
                        )}
                      >
                        <div className={cn("relative h-40 grid place-items-center text-7xl bg-gradient-to-br", skin.gradient)}>
                          <span className="drop-shadow-lg">{skin.emoji}</span>
                          {skin.limited && (
                            <Badge className="absolute top-2 left-2 bg-black/60 text-white border-0 backdrop-blur">
                              <Crown className="w-3 h-3 mr-1" /> Limited
                            </Badge>
                          )}
                          {isEquipped && (
                            <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground border-0">
                              <Check className="w-3 h-3 mr-1" /> Equipped
                            </Badge>
                          )}
                          {!isOwned && !canAfford && (
                            <div className="absolute inset-0 bg-background/40 backdrop-blur-[2px] grid place-items-center">
                              <Lock className="w-8 h-8 text-foreground/70" />
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="font-semibold truncate">{skin.name}</div>
                              <div className="text-xs text-muted-foreground capitalize">{skin.character}</div>
                            </div>
                            <Badge variant="outline" className={cn("shrink-0 gap-1", rarity.className)}>
                              <RIcon className="w-3 h-3" /> {rarity.label}
                            </Badge>
                          </div>
                          {skin.description && (
                            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{skin.description}</p>
                          )}
                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center gap-1.5 font-bold">
                              <Coins className="w-4 h-4 text-amber-500" />
                              {skin.price_coins.toLocaleString()}
                            </div>
                            {isOwned ? (
                              isEquipped ? (
                                <Button size="sm" variant="secondary" disabled>Equipped</Button>
                              ) : (
                                <Button size="sm" onClick={() => void equip(skin)}>Equip</Button>
                              )
                            ) : (
                              <Button
                                size="sm"
                                disabled={!canAfford}
                                onClick={() => setConfirm(skin)}
                                className={canAfford ? "bg-gradient-to-r from-primary to-primary/70 text-primary-foreground" : ""}
                              >
                                {canAfford ? "Buy" : "Need more"}
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Earn-coins hint */}
          <div className="mt-10 rounded-2xl border bg-gradient-to-r from-primary/5 to-amber-500/5 p-4 sm:p-6 text-sm">
            <div className="font-semibold mb-1 flex items-center gap-2"><Coins className="w-4 h-4 text-amber-500" /> How to earn coins</div>
            <p className="text-muted-foreground">
              Translate text, complete daily challenges, unlock achievements, and keep your streak alive to earn more coins.
              {" "}
              <Link to="/translate" className="text-primary hover:underline">Start translating →</Link>
            </p>
          </div>
        </div>
      </section>

      {/* Purchase confirmation */}
      <Dialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <DialogContent className="w-[calc(100vw-1rem)] sm:w-full sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Confirm purchase</DialogTitle>
          </DialogHeader>
          {confirm && (
            <div className="space-y-4">
              <div className={cn("h-32 rounded-xl grid place-items-center text-6xl bg-gradient-to-br", confirm.gradient)}>
                {confirm.emoji}
              </div>
              <div className="text-center">
                <div className="font-bold text-lg">{confirm.name}</div>
                <div className="text-sm text-muted-foreground">{confirm.description}</div>
              </div>
              <div className="rounded-lg bg-muted/40 p-3 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Your balance</span>
                <span className="font-semibold flex items-center gap-1"><Coins className="w-4 h-4 text-amber-500" /> {coins.toLocaleString()}</span>
              </div>
              <div className="rounded-lg bg-muted/40 p-3 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Price</span>
                <span className="font-semibold flex items-center gap-1"><Coins className="w-4 h-4 text-amber-500" /> {confirm.price_coins.toLocaleString()}</span>
              </div>
              <div className="rounded-lg bg-primary/10 border border-primary/30 p-3 flex items-center justify-between text-sm">
                <span>After purchase</span>
                <span className="font-bold flex items-center gap-1">
                  <Coins className="w-4 h-4 text-amber-500" /> {Math.max(0, coins - confirm.price_coins).toLocaleString()}
                </span>
              </div>
            </div>
          )}
          <DialogFooter className="flex-row gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setConfirm(null)}>Cancel</Button>
            <Button
              className="flex-1 bg-gradient-to-r from-primary to-primary/70 text-primary-foreground"
              disabled={busy || !confirm}
              onClick={() => confirm && void purchase(confirm)}
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SiteLayout>
  );
}
