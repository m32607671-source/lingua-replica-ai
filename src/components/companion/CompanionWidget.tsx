import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/lib/auth";
import { useSubscription } from "@/lib/subscription";
import {
  sendCompanionMessage,
  getCompanionState,
  setCompanionCharacter,
} from "@/lib/companion.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Send, X, Sparkles, Crown, Loader2 } from "lucide-react";
import { Link } from "@tanstack/react-router";

type Character = "owl" | "fox" | "nova" | "panda";

const CHARACTERS: { id: Character; emoji: string; name: string; tag: string }[] = [
  { id: "owl", emoji: "🦉", name: "Scholar Owl", tag: "Wise & patient" },
  { id: "fox", emoji: "🦊", name: "Explorer Fox", tag: "Energetic" },
  { id: "nova", emoji: "🤖", name: "Robot Nova", tag: "Precise" },
  { id: "panda", emoji: "🐼", name: "Panda Buddy", tag: "Encouraging" },
];

interface Msg { role: "user" | "assistant" | "system"; content: string }

export function CompanionWidget() {
  const { user } = useAuth();
  const { activePlan, loading: planLoading, refresh: refreshSubscription, trackEvent } = useSubscription();
  const [open, setOpen] = useState(false);
  const [character, setCharacter] = useState<Character>("owl");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [used, setUsed] = useState(0);
  const [limit, setLimit] = useState(5);
  const [showPicker, setShowPicker] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const send = useServerFn(sendCompanionMessage);
  const loadState = useServerFn(getCompanionState);
  const saveChar = useServerFn(setCompanionCharacter);

  // Initial load + refresh whenever the active plan changes (so upgrades unlock instantly)
  useEffect(() => {
    if (!user) return;
    loadState().then((s) => {
      setCharacter((s.character as Character) ?? "owl");
      setUsed(s.used);
      setLimit(s.limit);
      setMessages((prev) => {
        const history = (s.history ?? []) as Msg[];
        if (history.length > 0) return history;
        if (prev.length > 0) return prev;
        setHasUnread(true);
        return [{
          role: "assistant",
          content: `Hi! I'm your AI companion. Ask me anything about translations, learning, or the platform. You have ${s.limit === -1 ? "unlimited" : s.limit - s.used} messages today.`,
        }];
      });
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, activePlan]);

  useEffect(() => {
    if (open) {
      setHasUnread(false);
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
      });
    }
  }, [open, messages]);

  if (!user) return null;

  const current = CHARACTERS.find((c) => c.id === character)!;
  const displayedLimit = activePlan === "business" ? -1 : activePlan === "pro" ? Math.max(limit, 100) : limit;
  const isUnlimited = displayedLimit === -1;
  const remaining = isUnlimited ? "∞" : Math.max(0, limit - used);
  const limitReached = !planLoading && !isUnlimited && used >= displayedLimit;
  const planColor =
    activePlan === "business"
      ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0"
      : activePlan === "pro"
      ? "bg-gradient-to-r from-primary to-primary/70 text-primary-foreground border-0"
      : "bg-muted text-muted-foreground";

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending || limitReached) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setSending(true);
    try {
      const res = await send({ data: { message: text, character } });
      if (res.ok) {
        setMessages((m) => [...m, { role: "assistant", content: res.reply }]);
        setUsed((u) => u + 1);
        if (res.plan && res.plan !== activePlan) void refreshSubscription();
      } else {
        setMessages((m) => [...m, { role: "assistant", content: res.message }]);
        if (res.error === "limit_reached") {
          trackEvent("incorrect_upgrade_prompt", { source: "companion", plan: activePlan, serverPlan: res.plan, limit: res.limit });
          setUsed(displayedLimit);
        }
      }
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Connection error. Please try again." }]);
    } finally {
      setSending(false);
    }
  };

  const pickCharacter = async (id: Character) => {
    setCharacter(id);
    setShowPicker(false);
    try { await saveChar({ data: { character: id } }); } catch {}
  };

  return (
    <>
      {/* Floating launcher */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 h-14 w-14 rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-xl shadow-primary/30 flex items-center justify-center text-2xl animate-scale-in hover:scale-110 transition-transform"
          aria-label="Open AI companion"
        >
          {current.emoji}
          {hasUnread && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
              1
            </span>
          )}
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <Card className="fixed bottom-5 right-5 z-50 w-[calc(100vw-2.5rem)] sm:w-96 h-[70vh] sm:h-[560px] max-h-[640px] flex flex-col overflow-hidden animate-scale-in shadow-2xl border-border/60">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b bg-gradient-to-r from-primary/10 to-primary/5">
            <button
              onClick={() => setShowPicker((v) => !v)}
              className="flex items-center gap-2 hover:bg-accent/50 px-2 py-1 rounded-md transition-colors"
            >
              <span className="text-2xl">{current.emoji}</span>
              <div className="text-left">
                <div className="text-sm font-semibold leading-tight">{current.name}</div>
                <div className="text-xs text-muted-foreground">{current.tag}</div>
              </div>
            </button>
            <div className="flex items-center gap-1.5">
              <Badge className={cn("text-[10px] uppercase tracking-wide px-1.5 py-0.5", planColor)}>
                {activePlan}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {planLoading ? "…" : isUnlimited ? "∞" : `${remaining}/${displayedLimit}`}
              </Badge>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Character picker */}
          {showPicker && (
            <div className="p-3 border-b grid grid-cols-2 gap-2 bg-muted/30 animate-fade-in">
              {CHARACTERS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => pickCharacter(c.id)}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-lg border text-left transition-all hover:scale-[1.02]",
                    c.id === character ? "border-primary bg-primary/10" : "border-border bg-card",
                  )}
                >
                  <span className="text-2xl">{c.emoji}</span>
                  <div className="min-w-0">
                    <div className="text-xs font-medium truncate">{c.name}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{c.tag}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Messages */}
          <ScrollArea className="flex-1" ref={scrollRef as never}>
            <div className="p-3 space-y-3">
              {messages.map((m, i) => (
                <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words animate-fade-in",
                      m.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted text-foreground rounded-bl-sm",
                    )}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl rounded-bl-sm px-3 py-2 text-sm flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" /> Thinking…
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Upgrade prompt when limit reached */}
          {limitReached && (
            <div className="px-3 py-2 border-t bg-gradient-to-r from-amber-500/10 to-primary/10 flex items-center gap-2 text-xs">
              <Crown className="h-4 w-4 text-amber-500" />
              <span className="flex-1">Daily limit reached.</span>
              <Link to="/pricing">
                <Button size="sm" className="h-7 text-xs">Upgrade</Button>
              </Link>
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder={limitReached ? "Upgrade to keep chatting…" : "Ask your companion…"}
              disabled={sending || limitReached}
              className="flex-1"
            />
            <Button
              onClick={handleSend}
              disabled={sending || !input.trim() || limitReached}
              size="icon"
              className="shrink-0"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          <div className="px-3 pb-2 text-[10px] text-muted-foreground flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> Plan: <strong className="capitalize">{activePlan}</strong>
          </div>
        </Card>
      )}
    </>
  );
}
