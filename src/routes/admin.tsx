import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { Check, Search, Trash2, X, Radio, LogOut } from "lucide-react";
import { getEmbedUrl } from "@/lib/utils";


export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin · E-Cell CGC Live" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminPage,
});

type Reg = {
  id: string;
  name: string;
  email: string;
  approved: boolean;
  created_at: string;
};

function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setIsAdmin(null);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();
      setIsAdmin(!!data);
    })();
  }, [session]);

  if (loading) return <FullCenter>Loading…</FullCenter>;
  if (!session) return <AuthScreen />;
  if (isAdmin === null) return <FullCenter>Checking access…</FullCenter>;
  if (!isAdmin) return <NotAdminScreen email={session.user.email ?? ""} />;
  return <AdminDashboard email={session.user.email ?? ""} />;
}

function FullCenter({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

function AuthScreen() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
      if (error) toast.error(error.message);
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password: pw,
        options: { emailRedirectTo: `${window.location.origin}/admin` },
      });
      if (error) toast.error(error.message);
      else toast.success("Account created. Ask an existing admin to grant you access.");
    }
    setBusy(false);
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-primary/20 blur-[140px]" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-strong relative w-full max-w-md rounded-3xl p-8"
      >
        <div className="mb-6 flex items-center gap-2">
          <Radio className="h-4 w-4 text-primary-glow" />
          <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
            E-Cell CGC · Admin
          </span>
        </div>
        <h1 className="font-display text-3xl font-bold text-gradient">
          {mode === "signin" ? "Admin sign in" : "Create admin"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Restricted area. Granted admins only.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@ecellcgc.in"
            required
            className="w-full rounded-xl border border-border bg-input/50 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
          />
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="••••••••"
            required
            minLength={6}
            className="w-full rounded-xl border border-border bg-input/50 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            style={{ background: "var(--gradient-purple)", boxShadow: "var(--shadow-glow-sm)" }}
          >
            {busy ? "Working…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-foreground"
        >
          {mode === "signin" ? "Need an account? Create one" : "Have an account? Sign in"}
        </button>
      </motion.div>
    </div>
  );
}

function NotAdminScreen({ email }: { email: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="font-display text-2xl font-semibold">Not an admin</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        <span className="text-foreground">{email}</span> is signed in but doesn't have admin
        access. An existing admin must grant your role.
      </p>
      <button
        onClick={() => supabase.auth.signOut()}
        className="rounded-full border border-border bg-card px-5 py-2 text-xs uppercase tracking-widest"
      >
        Sign out
      </button>
    </div>
  );
}

function AdminDashboard({ email }: { email: string }) {
  const [regs, setRegs] = useState<Reg[]>([]);
  const [search, setSearch] = useState("");
  const [embedUrl, setEmbedUrl] = useState("");
  const [savingUrl, setSavingUrl] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      const { data } = await supabase
        .from("registrations")
        .select("*")
        .order("created_at", { ascending: false });
      if (active && data) setRegs(data as Reg[]);
    }
    load();

    supabase
      .from("livestream_config")
      .select("embed_url")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setEmbedUrl(data?.embed_url || "");
      });

    const ch = supabase
      .channel("admin_regs")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "registrations" },
        () => load(),
      )
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(ch);
    };
  }, []);

  async function setApproved(id: string, approved: boolean) {
    const { error } = await supabase.from("registrations").update({ approved }).eq("id", id);
    if (error) toast.error(error.message);
    else toast.success(approved ? "Approved" : "Revoked");
  }
  async function remove(id: string) {
    const { error } = await supabase.from("registrations").delete().eq("id", id);
    if (error) toast.error(error.message);
  }
  async function saveUrl() {
    const formattedUrl = getEmbedUrl(embedUrl) || "";
    setSavingUrl(true);
    const { error } = await supabase
      .from("livestream_config")
      .update({ embed_url: formattedUrl, updated_at: new Date().toISOString() })
      .eq("id", 1);
    setSavingUrl(false);
    if (error) {
      toast.error(error.message);
    } else {
      setEmbedUrl(formattedUrl);
      toast.success("Stream URL updated");
    }
  }

  const filtered = regs.filter(
    (r) =>
      r.email.toLowerCase().includes(search.toLowerCase()) ||
      r.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute -top-40 right-0 h-[500px] w-[700px] rounded-full bg-primary/15 blur-[140px]" />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-4 py-6">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-primary-glow" />
          <span className="font-display text-sm font-semibold">E-Cell CGC · Admin</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-muted-foreground sm:inline">{email}</span>
          <button
            onClick={() => supabase.auth.signOut()}
            className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs"
          >
            <LogOut className="h-3 w-3" /> Sign out
          </button>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl space-y-8 px-4 pb-20">
        {/* Stream URL */}
        <section className="glass-strong rounded-3xl p-6">
          <h2 className="font-display text-lg font-semibold">Stream embed URL</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            YouTube/Zoom/Airmeet embed URL. Approved users see this live.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input
              value={embedUrl}
              onChange={(e) => setEmbedUrl(e.target.value)}
              placeholder="https://www.youtube.com/embed/…"
              className="flex-1 rounded-xl border border-border bg-input/50 px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
            <button
              onClick={saveUrl}
              disabled={savingUrl}
              className="rounded-xl px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              style={{ background: "var(--gradient-purple)" }}
            >
              {savingUrl ? "Saving…" : "Save"}
            </button>
          </div>
        </section>

        {/* Registrations */}
        <section className="glass-strong rounded-3xl p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold">Registrations</h2>
              <p className="text-xs text-muted-foreground">
                {regs.length} total · {regs.filter((r) => r.approved).length} approved
              </p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email"
                className="w-full rounded-xl border border-border bg-input/50 py-2 pl-9 pr-3 text-sm outline-none focus:border-primary sm:w-72"
              />
            </div>
          </div>

          <div className="mt-5 overflow-x-auto rounded-2xl border border-border/60">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary/40 text-[10px] uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-xs text-muted-foreground">
                      No registrations
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => (
                    <tr key={r.id} className="border-t border-border/60 hover:bg-secondary/20">
                      <td className="px-4 py-3 font-medium">{r.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{r.email}</td>
                      <td className="px-4 py-3">
                        {r.approved ? (
                          <span className="rounded-full border border-primary/40 bg-primary/10 px-2.5 py-0.5 text-[10px] uppercase tracking-widest text-primary-glow">
                            Approved
                          </span>
                        ) : (
                          <span className="rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          {r.approved ? (
                            <button
                              onClick={() => setApproved(r.id, false)}
                              className="flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-[11px] hover:border-destructive/50"
                            >
                              <X className="h-3 w-3" /> Revoke
                            </button>
                          ) : (
                            <button
                              onClick={() => setApproved(r.id, true)}
                              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-primary-foreground"
                              style={{ background: "var(--gradient-purple)" }}
                            >
                              <Check className="h-3 w-3" /> Approve
                            </button>
                          )}
                          <button
                            onClick={() => remove(r.id)}
                            className="flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-[11px] hover:border-destructive/50 hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-[11px] text-muted-foreground">
            To grant admin to another account: open backend → user_roles table → insert row with
            user_id and role=admin.
          </p>
        </section>
      </main>
    </div>
  );
}
