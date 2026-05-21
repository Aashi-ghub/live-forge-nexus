import { motion } from "framer-motion";

export function WaitingCard({ email }: { email: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="glass-strong mx-auto w-full max-w-md rounded-3xl p-8 text-center"
    >
      <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-primary/30" />
        <span className="absolute inset-2 rounded-full bg-primary/20" />
        <span
          className="relative h-10 w-10 rounded-full"
          style={{ background: "var(--gradient-purple)", boxShadow: "var(--shadow-glow-sm)" }}
        />
      </div>
      <h2 className="mt-6 font-display text-xl font-semibold">Awaiting approval</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Your registration request for <span className="text-foreground">{email}</span> has been
        submitted. This page will unlock the moment an admin approves you — no refresh needed.
      </p>
      <div className="mt-6 flex items-center justify-center gap-2 text-[11px] uppercase tracking-widest text-primary-glow">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary-glow" />
        Listening for approval
      </div>
    </motion.div>
  );
}
