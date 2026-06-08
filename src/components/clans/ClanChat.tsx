import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

type Message = { id: string; user_id: string; content: string; created_at: string };

export function ClanChat({ clanId }: { clanId: string }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mounted = true;
    supabase
      .from("clan_messages")
      .select("id, user_id, content, created_at")
      .eq("clan_id", clanId)
      .order("created_at", { ascending: true })
      .limit(100)
      .then(({ data }) => {
        if (mounted && data) setMessages(data);
      });

    const channel = supabase
      .channel(`clan-${clanId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "clan_messages", filter: `clan_id=eq.${clanId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      void supabase.removeChannel(channel);
    };
  }, [clanId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !user) return;
    setSending(true);
    const { error } = await supabase
      .from("clan_messages")
      .insert({ clan_id: clanId, user_id: user.id, content: text.trim() });
    if (error) toast.error(error.message);
    else setText("");
    setSending(false);
  }

  return (
    <div className="flex flex-col h-[500px] border border-border/40 rounded-xl overflow-hidden">
      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-card/30">
        {messages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">Say hi to your clan 👋</p>
        )}
        {messages.map((m) => {
          const mine = m.user_id === user?.id;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${mine ? "bg-gradient-primary text-white" : "bg-accent/20"}`}>
                {m.content}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <form onSubmit={send} className="flex gap-2 p-2 border-t border-border/40">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={user ? "Type a message…" : "Sign in to chat"}
          disabled={!user || sending}
          maxLength={1000}
        />
        <Button type="submit" disabled={!user || sending || !text.trim()}>Send</Button>
      </form>
    </div>
  );
}
