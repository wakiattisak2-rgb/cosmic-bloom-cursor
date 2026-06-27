import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/legal/privacy")({
  head: () => ({ meta: [{ title: "Privacy Policy — Aetros" }] }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1 className="font-display text-3xl font-semibold">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground">Last updated: June 2026</p>
      <section className="mt-8 space-y-4 text-sm text-muted-foreground">
        <p>
          Aetros (&quot;we&quot;) processes personal data to operate the ESG community platform:
          account management, impact logging, community posts, and knowledge articles.
        </p>
        <h2 className="font-display text-lg text-foreground">Data we collect</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Account: email, display name, profile fields you provide</li>
          <li>Activity: eco actions, XP, posts, articles, activity log events</li>
          <li>Technical: session tokens, IP (in activity log when available)</li>
        </ul>
        <h2 className="font-display text-lg text-foreground">Your rights (GDPR)</h2>
        <p>
          You may export or delete your data from{" "}
          <Link to="/settings/export" className="text-primary hover:underline">
            Settings → Export
          </Link>{" "}
          and Account settings. Contact us for data subject requests.
        </p>
        <h2 className="font-display text-lg text-foreground">Storage</h2>
        <p>Data is stored in Supabase (PostgreSQL) with row-level security. We do not sell personal data.</p>
      </section>
    </article>
  );
}
