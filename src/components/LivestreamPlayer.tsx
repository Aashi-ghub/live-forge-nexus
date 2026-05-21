import { motion } from "framer-motion";
import { getEmbedUrl } from "@/lib/utils";

export function LivestreamPlayer({ embedUrl }: { embedUrl: string | null }) {
  const finalEmbedUrl = getEmbedUrl(embedUrl);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative w-full"
    >
      <div
        className="relative overflow-hidden rounded-3xl border border-primary/40 bg-black"
        style={{ boxShadow: "var(--shadow-glow)" }}
      >
        <div className="aspect-video w-full">
          {finalEmbedUrl ? (
            <iframe
              src={finalEmbedUrl}
              title="E-Cell CGC Livestream"
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-8 text-center">
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary-glow" />
              <p className="font-display text-lg font-semibold">Stream starts shortly</p>
              <p className="text-sm text-muted-foreground">
                Admin hasn't set the stream URL yet. This will go live automatically.
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
