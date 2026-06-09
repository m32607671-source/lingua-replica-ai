import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

type Msg = { id: string; user_id: string; content: string; created_at: string };

export function TeamChat({ teamId }: { teamId: string }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [names, setNames] = useState<Record<string, string>>({});
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await (supabase as any)
        .from("team_chat_messages")
        .select("id, user_id, content, created_at")
        .eq("team_id", teamId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (!active) return;
      setMessages(((data ?? []) as Msg[]).reverse());
    })();

    const ch = supabase
      .channel(`team-chat-${teamId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "team_chat_messages", filter: `team_id=eq.${teamId}` },
        (payload) => setMessages((p) => [...p, payload.new as Msg]))
      .subscribe();
    return () => { active = false; void supabase.removeChannel(ch); };
  }, [teamId]);

  useEffect(() => {
    const missing = [...new Set(messages.map((m) => m.user_id))].filter((id) => !(id in names));
    if (missing.length === 0) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("id, full_name").in("id", missing);
      const map: Record<string, string> = {};
      (data ?? []).forEach((p: any) => { map[p.id] = p.full_name || "Anon"; });
      setNames((prev) => ({ ...prev, ...map }));
    })();
  }, [messages, names]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !draft.trim()) return;
    setSending(true);
    const { error } = await (supabase as any).from("team_chat_messages")
      .insert({ team_id: teamId, user_id: user.id, content: draft.trim().slice(0, 1000) });
    setSending(false);
    if (error) return;
    setDraft("");
  }

  return (
    <div className="flex flex-col h-[480px] border border-border/40 rounded-lg overflow-hidden">
      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-background/40">
        {messages.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No messages yet — say hi 👋</p>}
        {messages.map((m) => {
          const mine = m.user_id === user?.id;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-lg px-3 py-1.5 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-accent/20"}`}>
                {!mine && <p className="text-[10px] opacity-70 mb-0.5">{names[m.user_id] || "…"}</p>}
                <p className="whitespace-pre-wrap break-words">{m.content}</p>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <form onSubmit={send} className="flex gap-2 p-2 border-t border-border/40">
        <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Message your team…" maxLength={1000} />
        <Button type="submit" disabled={sending || !draft.trim()} size="icon"><Send className="w-4 h-4" /></Button>
      </form>
    </div>
  );
}
