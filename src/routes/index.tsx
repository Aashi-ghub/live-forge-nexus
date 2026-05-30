import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { SiteHeader } from "@/components/SiteHeader";
import { RegistrationForm } from "@/components/RegistrationForm";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Live Session — E-Cell CGC" },
      { name: "description", content: "Exclusive E-Cell CGC live session. Interact. Learn. Build." },
    ],
  }),
  component: LivestreamPage,
});

type Reg = { id: string; name: string; email: string; approved: boolean };

function LivestreamPage() {
  useEffect(() => {
    // no-op just to keep page semantics; nothing to restore here
  }, []);

  function onSubmitted(email: string) {
    // RegistrationForm already stores email/local and inserts to DB; navigate to livestream
    if (typeof window !== "undefined") window.location.href = "/livestream";
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-30" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-primary/20 blur-[140px]" />

      <SiteHeader />

      <main className="relative z-10 mx-auto max-w-6xl px-4 pt-32 pb-20 sm:pt-36">
        <section className="text-center">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-[11px] uppercase tracking-[0.2em] text-primary-glow"
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary-glow" />
            Exclusive E-Cell CGC Live Session
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="mt-6 font-display text-5xl font-bold leading-[1.05] tracking-tight text-gradient sm:text-7xl"
          >
            LIVE SESSION
            <br />
            EXPERIENCE
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-5 text-base text-muted-foreground sm:text-lg"
          >
            Interact. Learn. Build.
          </motion.p>
        </section>

        <section className="mt-14">
          <RegistrationForm onSubmitted={onSubmitted} />
        </section>

        <footer className="mt-24 text-center text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
          © {new Date().getFullYear()} E-Cell CGC · Powered by Lovable
        </footer>
      </main>
    </div>
  );
}
