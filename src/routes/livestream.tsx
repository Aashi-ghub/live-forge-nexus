import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { LivestreamPlayer } from "@/components/LivestreamPlayer";
import { supabase } from "@/integrations/supabase/client";
import { getEmbedUrl } from "@/lib/utils";

export const Route = createFileRoute("/livestream")({
  head: () => ({
    meta: [{ title: "Watch Live — E-Cell CGC" }],
  }),
  component: LivestreamView,
});

function toWatchUrl(embed: string | null) {
  if (!embed) return null;
  // embed may be https://www.youtube.com/embed/<id>
  const m = embed.match(/embed\/([a-zA-Z0-9_-]+)/);
  if (m && m[1]) return `https://www.youtube.com/watch?v=${m[1]}`;
  return embed;
}

function LivestreamView() {
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const savedEmail = typeof window !== "undefined" ? localStorage.getItem("ecell_email") : null;
    const savedName = typeof window !== "undefined" ? localStorage.getItem("ecell_name") : null;
    if (savedEmail) setEmail(savedEmail);
    if (savedName) setName(savedName);

    let active = true;
    supabase
      .from("livestream_config")
      .select("embed_url")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setEmbedUrl(data?.embed_url || null);
      });

    const ch = supabase
      .channel("livestream_config_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "livestream_config" },
        (payload) => {
          if (payload.new) setEmbedUrl((payload.new as { embed_url: string | null }).embed_url || null);
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(ch);
    };
  }, []);

  const finalEmbed = getEmbedUrl(embedUrl);
  const watchUrl = toWatchUrl(finalEmbed);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-30" />
      <SiteHeader />

      <main className="relative z-10 mx-auto max-w-4xl px-4 pt-32 pb-20 sm:pt-36">
        <h1 className="font-display text-3xl font-bold text-center">Live session</h1>

        <div className="mt-8">
          {/* Poster / player */}
          <div className="mx-auto max-w-3xl">
            
              <div className="aspect-video w-full overflow-hidden rounded-3xl border border-primary/40 bg-black">
                <img
                  src="/assets/image.png"
                  alt="Session poster"
                  className="h-full w-full object-cover"
                />
              </div>
            

            <div className="mt-4 flex items-center justify-center gap-3">
              <a
                href={watchUrl || "#"}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl px-6 py-3 text-sm font-semibold text-primary-foreground"
                style={{ background: "var(--gradient-purple)" }}
              >
                Join livestream
              </a>
            </div>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              {name || email ? (
                <>
                  Watching as <span className="font-medium text-foreground">{name ?? email}</span>
                </>
              ) : (
                <>Enter your name and email on the home page to persist your details.</>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
