import { createFileRoute, Link, notFound } from "@tanstack/react-router";

import { useQuery } from "@tanstack/react-query";

import { BadgeCheck, Calendar, Globe, Sparkles, Trophy } from "lucide-react";

import { SiteHeader } from "@/components/SiteHeader";

import { SiteFooter } from "@/components/SiteFooter";

import { ImpactConstellation } from "@/components/ImpactConstellation";

import { ImpactCounter } from "@/components/ImpactCounter";

import { TierBadge } from "@/components/TierBadge";

import { supabase } from "@/integrations/supabase/client";

import { useI18n } from "@/lib/i18n";

import type { ActionLogRow } from "@/lib/constellation";



export const Route = createFileRoute("/u/$handle")({

  head: ({ loaderData }) => {

    const name = loaderData?.profile.display_name ?? loaderData?.profile.handle ?? "Pioneer";

    const bio = loaderData?.profile.bio ?? "ESG community member on Aetros";

    return {

      meta: [

        { title: `${name} — Aetros` },

        { name: "description", content: bio.slice(0, 160) },

        { property: "og:title", content: `${name} on Aetros` },

        { property: "og:description", content: bio.slice(0, 160) },

        { property: "og:type", content: "profile" },

        ...(loaderData?.profile.avatar_url

          ? [{ property: "og:image", content: loaderData.profile.avatar_url }]

          : []),

      ],

    };

  },

  loader: async ({ params }) => {

    const { data: profile, error } = await supabase

      .from("profiles")

      .select("*")

      .eq("handle", params.handle)

      .eq("is_public", true)

      .maybeSingle();

    if (error) throw error;

    if (!profile) throw notFound();



    const { data: roles } = await (supabase.from as any)("user_roles")

      .select("role")

      .eq("user_id", profile.id);

    const isExpert = (roles ?? []).some((r: { role: string }) => r.role === "expert");



    return { profile, isExpert };

  },

  component: PublicProfile,

});



function PublicProfile() {

  const { profile, isExpert } = Route.useLoaderData();

  const { locale, tx } = useI18n();



  const content = useQuery({

    queryKey: ["public-profile", profile.id],

    queryFn: async () => {

      const [posts, articles, actions] = await Promise.all([

        supabase.from("posts").select("id, body, created_at").eq("user_id", profile.id).is("deleted_at", null).order("created_at", { ascending: false }).limit(10),

        (supabase.from as any)("knowledge_articles")

          .select("id, slug, title_en, title_th, published_at")

          .eq("author_id", profile.id)

          .eq("is_published", true)

          .order("published_at", { ascending: false })

          .limit(10),

        supabase

          .from("actions_log")

          .select("id, action_type, xp_awarded, credits_awarded, created_at")

          .eq("user_id", profile.id)

          .order("created_at", { ascending: false })

          .limit(50),

      ]);

      return { posts: posts.data ?? [], articles: articles.data ?? [], actions: (actions.data ?? []) as ActionLogRow[] };

    },

  });



  const joined = new Date(profile.created_at).toLocaleDateString(locale === "th" ? "th-TH" : "en-US", {

    year: "numeric",

    month: "long",

  });



  return (

    <div className="min-h-screen">

      <SiteHeader />

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">

        <div className="glass glow-border rounded-2xl p-6 sm:p-8">

          <div className="flex flex-wrap items-start justify-between gap-4">

            <div className="flex gap-4">

              {profile.avatar_url ? (

                <img

                  src={profile.avatar_url}

                  alt=""

                  className="h-16 w-16 shrink-0 rounded-full object-cover ring-2 ring-primary/40"

                />

              ) : (

                <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-primary/15 font-display text-2xl text-primary ring-2 ring-primary/30">

                  {(profile.display_name ?? profile.handle ?? "P").slice(0, 1).toUpperCase()}

                </div>

              )}

              <div>

                <p className="text-xs uppercase tracking-widest text-muted-foreground">@{profile.handle}</p>

                <div className="mt-1 flex flex-wrap items-center gap-2">

                  <h1 className="font-display text-3xl font-semibold">

                    {profile.display_name ?? "Pioneer"}

                  </h1>

                  {isExpert && (

                    <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">

                      <BadgeCheck className="h-3 w-3" />

                      {tx("Verified expert", "Verified expert")}

                    </span>

                  )}

                </div>

                {profile.bio && <p className="mt-3 text-sm text-muted-foreground">{profile.bio}</p>}

                <div className="mt-3">

                  <TierBadge xp={profile.xp ?? 0} locale={locale} />

                </div>

                <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">

                  {profile.country && (

                    <span className="inline-flex items-center gap-1">

                      <Globe className="h-3.5 w-3.5" /> {profile.country}

                    </span>

                  )}

                  <span className="inline-flex items-center gap-1">

                    <Calendar className="h-3.5 w-3.5" />

                    {tx(`Joined ${joined}`, `เข้าร่วม ${joined}`)}

                  </span>

                </div>

              </div>

            </div>

            <div className="grid grid-cols-2 gap-3 text-center">

              <Stat label="XP" value={profile.xp} icon={Sparkles} />

              <Stat label={tx("Credits", "เครดิต")} value={profile.carbon_credits} icon={Trophy} />

            </div>

          </div>



          {(profile.interests?.length ?? 0) > 0 && (

            <div className="mt-6 flex flex-wrap gap-2">

              {profile.interests!.map((tag) => (

                <span

                  key={tag}

                  className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] capitalize text-primary"

                >

                  {tag.replace("_", " ")}

                </span>

              ))}

            </div>

          )}

        </div>



        <section className="mt-8">

          <h2 className="font-display text-lg">{tx("Impact Constellation", "กลุ่มดาว Impact")}</h2>

          <div className="mt-3 glass rounded-2xl p-4">

            <ImpactConstellation actions={content.data?.actions ?? []} width={280} height={280} />

          </div>

        </section>



        <section className="mt-8">

          <h2 className="font-display text-lg">{tx("Recent posts", "โพสต์ล่าสุด")}</h2>

          <div className="mt-3 space-y-3">

            {(content.data?.posts ?? []).length === 0 ? (

              <p className="text-sm text-muted-foreground">{tx("No posts yet.", "ยังไม่มีโพสต์")}</p>

            ) : (

              content.data!.posts.map((p: { id: string; body: string; created_at: string }) => (

                <div key={p.id} className="glass rounded-xl p-4 text-sm">

                  {p.body}

                </div>

              ))

            )}

          </div>

        </section>



        <section className="mt-8">

          <h2 className="font-display text-lg">{tx("Articles", "บทความ")}</h2>

          <div className="mt-3 space-y-2">

            {(content.data?.articles ?? []).length === 0 ? (

              <p className="text-sm text-muted-foreground">{tx("No articles yet.", "ยังไม่มีบทความ")}</p>

            ) : (

              content.data!.articles.map((a: { id: string; slug: string; title_en: string; title_th: string }) => (

                <Link

                  key={a.id}

                  to="/knowledge/$slug"

                  params={{ slug: a.slug }}

                  className="block glass rounded-xl px-4 py-3 text-sm hover:border-primary/40"

                >

                  {locale === "th" ? a.title_th || a.title_en : a.title_en}

                </Link>

              ))

            )}

          </div>

        </section>

      </main>

      <SiteFooter />

    </div>

  );

}



function Stat({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Sparkles }) {

  return (

    <div className="rounded-xl border border-border bg-background/40 px-4 py-3">

      <Icon className="mx-auto h-4 w-4 text-primary" />

      <div className="mt-1 font-display text-xl">

        <ImpactCounter value={value} />

      </div>

      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>

    </div>

  );

}

