import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  email: z.string().trim().email("Enter a valid email").max(160),
});

export function RegistrationForm({ onSubmitted }: { onSubmitted: (email: string) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ name, email });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const normalizedEmail = parsed.data.email.toLowerCase();
    // Upsert-like: insert; if email exists, just continue
    const { error } = await supabase
      .from("registrations")
      .insert({ name: parsed.data.name, email: normalizedEmail });
    setLoading(false);
    if (error && !error.message.toLowerCase().includes("duplicate")) {
      toast.error(error.message);
      return;
    }
    localStorage.setItem("ecell_email", normalizedEmail);
    onSubmitted(normalizedEmail);
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="glass-strong mx-auto w-full max-w-md rounded-3xl p-6 sm:p-8"
    >
      <h2 className="font-display text-2xl font-semibold">Request access</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Drop your details — admin will let you in.
      </p>

      <div className="mt-6 space-y-4">
        <div>
          <label className="text-xs uppercase tracking-widest text-muted-foreground">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Aarav Sharma"
            className="mt-2 w-full rounded-xl border border-border bg-input/50 px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest text-muted-foreground">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@cgc.edu.in"
            className="mt-2 w-full rounded-xl border border-border bg-input/50 px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="group relative mt-6 w-full overflow-hidden rounded-xl px-5 py-3.5 text-sm font-semibold text-primary-foreground transition-all hover:scale-[1.01] disabled:opacity-60"
        style={{ background: "var(--gradient-purple)", boxShadow: "var(--shadow-glow-sm)" }}
      >
        <span className="relative z-10">{loading ? "Submitting…" : "Register for the session"}</span>
      </button>
      <p className="mt-3 text-center text-[11px] text-muted-foreground">
        You'll be auto-admitted on this page once approved.
      </p>
    </motion.form>
  );
}
