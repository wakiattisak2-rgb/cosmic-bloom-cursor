import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

const STATIC_PATHS = [
  "/",
  "/auth",
  "/legal/privacy",
  "/legal/terms",
  "/legal/cookies",
];

export const buildSitemap = createServerFn({ method: "GET" }).handler(async () => {
  const base = process.env.VITE_SITE_URL || "https://aetros.app";
  let articleUrls: string[] = [];

  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await (supabaseAdmin.from as any)("knowledge_articles")
      .select("slug")
      .eq("is_published", true)
      .is("deleted_at", null)
      .limit(500);
    articleUrls = (data ?? []).map((a: { slug: string }) => `/knowledge/${a.slug}`);
  } catch {
    articleUrls = [];
  }

  const urls = [...STATIC_PATHS, ...articleUrls];
  const lastmod = new Date().toISOString().slice(0, 10);

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (path) => `  <url>
    <loc>${base}${path}</loc>
    <lastmod>${lastmod}</lastmod>
  </url>`,
  )
  .join("\n")}
</urlset>`;
});

export const Route = createFileRoute("/sitemap.xml")({
  loader: () => buildSitemap(),
  component: SitemapRoute,
});

function SitemapRoute() {
  const xml = Route.useLoaderData();
  return (
    <pre className="whitespace-pre-wrap break-all p-4 font-mono text-xs text-foreground">{xml}</pre>
  );
}
