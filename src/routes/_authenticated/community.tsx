import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowBigUp, Flag, Send, Trophy, Target, Users } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { canPerformActions, memberRequiredMessage } from "@/lib/member";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/community")({
  head: () => ({ meta: [{ title: "Community — Aetros" }] }),
  component: Community,
});

function Community() {
  const { t } = useI18n();
  const [tab, setTab] = useState<"feed" | "challenges" | "squads">("feed");
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="mb-6 inline-flex rounded-full border border-border p-1">
          <TabBtn active={tab === "feed"} onClick={() => setTab("feed")}>
            {t("community.feed")}
          </TabBtn>
          <TabBtn active={tab === "challenges"} onClick={() => setTab("challenges")}>
            {t("community.challenges")}
          </TabBtn>
          <TabBtn active={tab === "squads"} onClick={() => setTab("squads")}>
            {t("community.squads")}
          </TabBtn>
        </div>
        {tab === "feed" ? <Feed /> : tab === "challenges" ? <Challenges /> : <Squads />}
      </main>
      <SiteFooter />
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-5 py-1.5 text-sm font-medium transition-all ${
        active
          ? "bg-primary text-primary-foreground shadow-[0_0_16px_rgba(0,255,102,0.45)]"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function Feed() {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const qc = useQueryClient();
  const [body, setBody] = useState("");

  const posts = useQuery({
    queryKey: ["posts"],
    queryFn: async () => {
      const [{ data: p }, { data: votes }, { data: profs }] = await Promise.all([
        supabase.from("posts").select("*").is("deleted_at", null).order("created_at", { ascending: false }).limit(30),
        supabase.from("post_upvotes").select("post_id,user_id"),
        supabase.from("profiles").select("id,display_name"),
      ]);
      const voteByPost = new Map<string, number>();
      const mineByPost = new Map<string, boolean>();
      (votes ?? []).forEach((v) => {
        voteByPost.set(v.post_id, (voteByPost.get(v.post_id) ?? 0) + 1);
        if (user && v.user_id === user.id) mineByPost.set(v.post_id, true);
      });
      const nameById = new Map((profs ?? []).map((x) => [x.id, x.display_name]));
      return (p ?? []).map((row) => ({
        ...row,
        author: nameById.get(row.user_id) ?? "Pioneer",
        votes: voteByPost.get(row.id) ?? 0,
        upvoted: mineByPost.get(row.id) ?? false,
      }));
    },
  });

  const post = useMutation({
    mutationFn: async () => {
      if (!canPerformActions(user)) throw new Error(memberRequiredMessage(locale));
      const { data, error } = await supabase
        .from("posts")
        .insert({ user_id: user!.id, body })
        .select("id")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (row) => {
      void logActivity("post_create", { entityType: "post", entityId: row.id });
      setBody("");
      qc.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleVote = useMutation({
    mutationFn: async ({ id, upvoted }: { id: string; upvoted: boolean }) => {
      if (upvoted) {
        await supabase.from("post_upvotes").delete().match({ post_id: id, user_id: user!.id });
      } else {
        await supabase.from("post_upvotes").insert({ post_id: id, user_id: user!.id });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["posts"] }),
  });

  const report = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await (supabase.from as any)("post_reports").insert({
        post_id: postId,
        user_id: user!.id,
        reason: "community_report",
      });
      if (error) throw error;
    },
    onSuccess: () => toast.success(locale === "th" ? "รายงานแล้ว" : "Report submitted"),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (body.trim()) post.mutate();
        }}
        className="glass glow-border rounded-2xl p-4"
      >
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t("community.post.placeholder")}
          rows={3}
          className="w-full resize-none bg-transparent text-sm placeholder:text-muted-foreground/60 focus:outline-none"
        />
        <div className="mt-2 flex justify-end">
          <button
            type="submit"
            disabled={!body.trim() || post.isPending}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
            {t("community.post.submit")}
          </button>
        </div>
      </form>

      {posts.data?.map((p) => (
        <article key={p.id} className="glass rounded-2xl p-5">
          <div className="mb-2 flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
            <span className="text-primary">@{p.author}</span>
            <span>{new Date(p.created_at).toLocaleDateString()}</span>
          </div>
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground">{p.body}</p>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => toggleVote.mutate({ id: p.id, upvoted: p.upvoted })}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-all ${
                p.upvoted
                  ? "border-primary/60 bg-primary/15 text-primary shadow-[0_0_12px_rgba(0,255,102,0.4)]"
                  : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary"
              }`}
            >
              <ArrowBigUp className="h-3.5 w-3.5" />
              {p.votes}
            </button>
            <button
              onClick={() => report.mutate(p.id)}
              disabled={report.isPending}
              className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:border-destructive/40 hover:text-destructive"
              aria-label={locale === "th" ? "รายงาน" : "Report"}
            >
              <Flag className="h-3.5 w-3.5" />
            </button>
          </div>
        </article>
      ))}
      {!posts.isLoading && (posts.data?.length ?? 0) === 0 && (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Be the first to share.
        </p>
      )}
    </div>
  );
}

function Challenges() {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const qc = useQueryClient();

  const data = useQuery({
    queryKey: ["challenges", user?.id],
    queryFn: async () => {
      if (user) {
        try {
          await (supabase.rpc as any)("sync_challenge_progress", { p_user_id: user.id });
        } catch {
          /* migration may not be applied yet */
        }
      }
      const [{ data: chs }, { data: parts }] = await Promise.all([
        supabase.from("challenges").select("*").order("created_at"),
        supabase.from("challenge_participants").select("*"),
      ]);
      const partsByChallenge = new Map<string, typeof parts>();
      (parts ?? []).forEach((p) => {
        const arr = partsByChallenge.get(p.challenge_id) ?? [];
        arr.push(p);
        partsByChallenge.set(p.challenge_id, arr);
      });
      return (chs ?? []).map((c) => ({
        ...c,
        participants: partsByChallenge.get(c.id) ?? [],
        mine: (partsByChallenge.get(c.id) ?? []).find((p) => p.user_id === user?.id) ?? null,
      }));
    },
  });

  const join = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("challenge_participants")
        .insert({ challenge_id: id, user_id: user!.id, progress: 0 });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["challenges"] }),
    onError: (e: any) => toast.error(e.message),
  });

  const bump = useMutation({
    mutationFn: async ({ id, progress }: { id: string; progress: number }) => {
      const { error } = await supabase
        .from("challenge_participants")
        .update({ progress })
        .match({ challenge_id: id, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["challenges"] }),
  });

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {data.data?.map((c) => {
        const pct = c.mine ? Math.min(100, Math.round((c.mine.progress / c.goal) * 100)) : 0;
        return (
          <article key={c.id} className="glass glow-border rounded-2xl p-5">
            <div className="flex items-center gap-2 text-xs text-primary">
              <Target className="h-3.5 w-3.5" />
              <span className="font-mono uppercase tracking-wider">
                +{c.xp_reward} XP · +{c.credits_reward} CC
              </span>
            </div>
            <h3 className="mt-2 font-display text-xl font-semibold">
              {locale === "th" && c.title_th ? c.title_th : c.title}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {locale === "th" && c.description_th ? c.description_th : c.description}
            </p>

            {c.mine ? (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono uppercase text-muted-foreground">
                  <span>{t("community.progress")}</span>
                  <span>{c.mine.progress}/{c.goal}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary shadow-[0_0_8px_rgba(0,255,102,0.7)] transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <button
                  disabled={c.mine.progress >= c.goal || bump.isPending}
                  onClick={() => bump.mutate({ id: c.id, progress: (c.mine!.progress + 1) })}
                  className="mt-1 w-full rounded-full border border-primary/40 px-4 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 disabled:opacity-50"
                >
                  +1 day
                </button>
              </div>
            ) : (
              <button
                onClick={() => join.mutate(c.id)}
                disabled={join.isPending}
                className="mt-4 w-full rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground neon-glow disabled:opacity-50"
              >
                {t("community.join")}
              </button>
            )}

            <div className="mt-4 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Trophy className="h-3 w-3 text-primary" />
              {c.participants.length} pioneers
            </div>
          </article>
        );
      })}
    </div>
  );
}

type SquadRow = {
  id: string;
  name: string;
  goal: number;
  progress: number;
  ends_at: string;
  member_count?: number;
};

function Squads() {
  const { user } = useAuth();
  const { tx } = useI18n();
  const qc = useQueryClient();

  const squad = useQuery({
    queryKey: ["squad", user?.id],
    enabled: !!user,
    queryFn: async () => {
      try {
        await (supabase.rpc as any)("sync_squad_progress");
      } catch {
        /* migration may not be applied */
      }
      const { data: membership } = await (supabase.from as any)("squad_members")
        .select("squad_id")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (!membership?.squad_id) return null;

      const [{ data: s }, { count }] = await Promise.all([
        (supabase.from as any)("squads").select("*").eq("id", membership.squad_id).single(),
        (supabase.from as any)("squad_members")
          .select("*", { count: "exact", head: true })
          .eq("squad_id", membership.squad_id),
      ]);
      if (!s) return null;
      return { ...s, member_count: count ?? 0 } as SquadRow;
    },
  });

  const join = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase.rpc as any)("join_impact_squad");
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(tx("Joined squad!", "เข้าร่วม squad แล้ว!"));
      qc.invalidateQueries({ queryKey: ["squad"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const s = squad.data;
  const pct = s ? Math.min(100, Math.round((s.progress / s.goal) * 100)) : 0;
  const daysLeft = s
    ? Math.max(0, Math.ceil((new Date(s.ends_at).getTime() - Date.now()) / 86400000))
    : 7;

  return (
    <div className="glass glow-border rounded-2xl p-6">
      <div className="flex items-center gap-2 text-primary">
        <Users className="h-5 w-5" />
        <h2 className="font-display text-xl">{tx("Impact Squads", "Impact Squads")}</h2>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        {tx("Team of 5 · 7-day challenge · log actions together.", "ทีม 5 คน · ท้า 7 วัน · บันทึกร่วมกัน")}
      </p>

      {!s ? (
        <button
          type="button"
          onClick={() => join.mutate()}
          disabled={join.isPending}
          className="mt-6 w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {tx("Join a squad", "เข้าร่วม squad")}
        </button>
      ) : (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">{s.name}</span>
            <span className="text-xs text-muted-foreground">
              {s.member_count}/5 · {daysLeft}d {tx("left", "เหลือ")}
            </span>
          </div>
          <div className="relative mx-auto h-36 w-36">
            <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/30" />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${pct * 2.64} 264`}
                className="text-primary drop-shadow-[0_0_8px_rgba(0,255,102,0.6)]"
              />
            </svg>
            <div className="absolute inset-0 grid place-items-center">
              <span className="font-display text-2xl text-primary">{pct}%</span>
            </div>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            {s.progress}/{s.goal} XP {tx("team total", "รวมทีม")}
          </p>
          <Link
            to="/dashboard"
            className="block w-full rounded-full border border-primary/40 py-2 text-center text-xs font-medium text-primary hover:bg-primary/10"
          >
            {tx("Log action for your squad", "บันทึกเพื่อทีม")}
          </Link>
        </div>
      )}
    </div>
  );
}
