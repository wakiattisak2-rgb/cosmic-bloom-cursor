import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/legal/terms")({
  head: () => ({ meta: [{ title: "Terms of Service — Aetros" }] }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1 className="font-display text-3xl font-semibold">Terms of Service</h1>
      <p className="text-sm text-muted-foreground">Last updated: June 2026 · Free Beta</p>
      <section className="mt-8 space-y-4 text-sm text-muted-foreground">
        <p>
          By using Aetros you agree to these terms. The platform is provided during Beta at no charge.
          Features and tiers may change with notice.
        </p>
        <h2 className="font-display text-lg text-foreground">Acceptable use</h2>
        <p>
          Do not post illegal content, spam, or misrepresent ESG impact. We may moderate or remove content
          and suspend accounts that violate community standards.
        </p>
        <h2 className="font-display text-lg text-foreground">Impact & rewards</h2>
        <p>
          XP and carbon credits are community gamification metrics, not financial instruments or certified
          carbon offsets unless explicitly stated for a specific reward.
        </p>
        <h2 className="font-display text-lg text-foreground">Experts</h2>
        <p>
          Verified experts are independent professionals. Aetros facilitates discovery; engagements are
          between users and experts directly.
        </p>
      </section>
    </article>
  );
}
