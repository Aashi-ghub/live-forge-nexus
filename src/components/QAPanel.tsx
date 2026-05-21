import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send } from "lucide-react";

type Msg = {
  id: string;
  name: string;
  email: string;
  question: string;
  created_at: string;
};

export function QAPanel({ name, email }: { name: string; email: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("qa_messages")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(200);
      if (active && data) setMessages(data as Msg[]);
    })();

    const channel = supabase
      .channel("qa_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "qa_messages" },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Msg]);
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const q = text.trim();
    if (!q) return;
    if (q.length > 500) {
      toast.error("Keep it under 500 characters");
      return;
    }
    setSending(true);
    const { error } = await supabase.from("qa_messages").insert({ name, email, question: q });
    setSending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setText("");
  }

  return (
    <div className="glass-strong flex h-[520px] flex-col rounded-3xl">
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
        <div>
          <h3 className="font-display text-base font-semibold">Live Q&amp;A</h3>
          <p className="text-xs text-muted-foreground">Ask anything — speakers will pick from here</p>
        </div>
        <span className="rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-[10px] uppercase tracking-widest text-primary-glow">
          {messages.length}
        </span>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center text-center text-xs text-muted-foreground">
            No questions yet. Be the first to ask.
          </div>
        )}
        <AnimatePresence initial={false}>
          {messages.map((m) => {
            const mine = m.email === email;
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    mine
                      ? "bg-primary/20 border border-primary/40 text-foreground"
                      : "glass text-foreground"
                  }`}
                >
                  <div className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                    {mine ? "You" : m.name}
                  </div>
                  <div className="leading-relaxed">{m.question}</div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <form onSubmit={send} className="flex gap-2 border-t border-border/60 p-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type your question…"
          maxLength={500}
          className="flex-1 rounded-xl border border-border bg-input/40 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
        />
        <button
          type="submit"
          disabled={sending}
          className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:scale-[1.02] disabled:opacity-60"
          style={{ background: "var(--gradient-purple)", boxShadow: "var(--shadow-glow-sm)" }}
        >
          <Send className="h-3.5 w-3.5" />
          Send
        </button>
      </form>
    </div>
  );
}
