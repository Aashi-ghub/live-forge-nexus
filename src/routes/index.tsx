import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { RegistrationForm } from "@/components/RegistrationForm";
import { WaitingCard } from "@/components/WaitingCard";
import { LivestreamPlayer } from "@/components/LivestreamPlayer";
import { QAPanel } from "@/components/QAPanel";

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
  const [email, setEmail] = useState<string | null>(null);
  const [reg, setReg] = useState<Reg | null>(null);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  // Restore email from localStorage
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("ecell_email") : null;
    if (saved) setEmail(saved);
    setChecked(true);
  }, []);

  // Fetch registration + listen for approval changes
  useEffect(() => {
    if (!email) {
      setReg(null);
      return;
    }
    let active = true;

    async function fetchReg() {
      const { data } = await supabase
        .from("registrations")
        .select("id,name,email,approved")
        .eq("email", email!)
        .maybeSingle();
      if (active) setReg((data as Reg | null) ?? null);
    }
    fetchReg();

    const channel = supabase
      .channel(`reg_${email}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "registrations", filter: `email=eq.${email}` },
        (payload) => {
          if (payload.new) setReg(payload.new as Reg);
        },
      )
      .subscribe();

    // Poll fallback every 8s in case realtime drops
    const poll = setInterval(fetchReg, 8000);

    return () => {
      active = false;
      supabase.removeChannel(channel);
      clearInterval(poll);
    };
  }, [email]);

  // Livestream config + realtime
  useEffect(() => {
    if (!reg?.approved) return;
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("livestream_config")
        .select("embed_url")
        .eq("id", 1)
        .maybeSingle();
      if (active) setEmbedUrl(data?.embed_url || null);
    })();

    const channel = supabase
      .channel("config_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "livestream_config" },
        (payload) => {
          if (payload.new) setEmbedUrl((payload.new as { embed_url: string | null }).embed_url || null);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [reg?.approved]);

  function resetEmail() {
    localStorage.removeItem("ecell_email");
    setEmail(null);
    setReg(null);
  }

  const isApproved = reg?.approved === true;

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background flair */}
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-30" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-primary/20 blur-[140px]" />

      <SiteHeader />

      <main className="relative z-10 mx-auto max-w-6xl px-4 pt-32 pb-20 sm:pt-36">
        {/* HERO */}
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

        {/* CONTENT */}
        <section className="mt-14">
          {!checked ? null : !email || !reg ? (
            <RegistrationForm onSubmitted={(e) => setEmail(e)} />
          ) : !isApproved ? (
            <div className="space-y-4">
              <WaitingCard email={email} />
              <div className="text-center">
                <button
                  onClick={resetEmail}
                  className="text-[11px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
                >
                  Use a different email
                </button>
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="grid gap-6 lg:grid-cols-3 lg:items-stretch"
            >
              <div className="lg:col-span-2">
                <LivestreamPlayer embedUrl={embedUrl} />
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 px-1">
                  <div>
                    <div className="text-xs uppercase tracking-widest text-muted-foreground">
                      Watching as
                    </div>
                    <div className="font-display text-sm font-semibold">{reg.name}</div>
                  </div>
                  <button
                    onClick={resetEmail}
                    className="text-[11px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
                  >
                    Sign out
                  </button>
                </div>
              </div>
              <div className="lg:col-span-1 flex flex-col">
                <QAPanel name={reg.name} email={reg.email} />
              </div>
            </motion.div>
          )}
        </section>

        <footer className="mt-24 text-center text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
          © {new Date().getFullYear()} E-Cell CGC · Powered by Lovable
        </footer>
      </main>
    </div>
  );
}
