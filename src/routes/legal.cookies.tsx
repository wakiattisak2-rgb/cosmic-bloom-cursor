import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/legal/cookies")({
  head: () => ({ meta: [{ title: "Cookie Policy — Aetros" }] }),
  component: CookiesPage,
});

function CookiesPage() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1 className="font-display text-3xl font-semibold">Cookie Policy</h1>
      <section className="mt-8 space-y-4 text-sm text-muted-foreground">
        <p>We use essential cookies and local storage for:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Authentication session (Supabase Auth)</li>
          <li>Language preference (aetros.locale)</li>
          <li>Cookie consent choice (aetros.cookie.consent)</li>
        </ul>
        <p>We do not use third-party advertising cookies. Analytics may be added with updated consent.</p>
      </section>
    </article>
  );
}
