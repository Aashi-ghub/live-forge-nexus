import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";

export function SiteHeader() {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 inset-x-0 z-50"
    >
      <div className="mx-auto mt-4 max-w-6xl px-4">
        <div className="glass flex items-center justify-between rounded-full px-5 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-primary glow-border-sm" />
            <span className="font-display text-sm font-semibold tracking-wide">
              E-CELL <span className="text-accent-glow">CGC</span>
            </span>
          </Link>
          <nav className="hidden gap-6 text-xs text-muted-foreground sm:flex">
            <a href="https://ecellcgc.in" className="transition-colors hover:text-foreground">Main site</a>
            <Link to="/" className="transition-colors hover:text-foreground">Live</Link>
          </nav>
          <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-primary-glow">
            <span className="mr-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-primary-glow" />
            Live
          </span>
        </div>
      </div>
    </motion.header>
  );
}
