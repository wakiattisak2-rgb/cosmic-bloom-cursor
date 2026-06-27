import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { ArrowLeft, Image as ImageIcon, Upload, X, Eye } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Starfield } from "@/components/Starfield";
import { MarkdownView } from "@/components/MarkdownView";
import { useI18n } from "@/lib/i18n";
import {
  createArticle,
  estimateReadMinutes,
  gradientFor,
  slugify,
  uploadCover,
  type Category,
  type Framework,
  type Level,
} from "@/lib/knowledge";

export const Route = createFileRoute("/_authenticated/knowledge/new")({
  component: NewArticle,
});

const CATEGORIES: Category[] = ["environment", "social", "governance", "reporting"];
const LEVELS: Level[] = ["beginner", "practitioner", "strategist"];
const FRAMEWORKS: (Framework | "")[] = ["", "GRI", "SASB", "TCFD", "CSRD", "ONEREPORT"];

const MAX_BYTES = 2 * 1024 * 1024;

function NewArticle() {
  const { t, locale } = useI18n();
  const navigate = useNavigate();

  const [tab, setTab] = useState<"en" | "th">("en");
  const [titleEn, setTitleEn] = useState("");
  const [titleTh, setTitleTh] = useState("");
  const [excerptEn, setExcerptEn] = useState("");
  const [excerptTh, setExcerptTh] = useState("");
  const [bodyEn, setBodyEn] = useState("");
  const [bodyTh, setBodyTh] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState<Category>("environment");
  const [level, setLevel] = useState<Level>("beginner");
  const [framework, setFramework] = useState<Framework | "">("");
  const [tags, setTags] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const readMin = useMemo(
    () => estimateReadMinutes(bodyEn || bodyTh || ""),
    [bodyEn, bodyTh],
  );

  function handleFile(f: File | null) {
    setError(null);
    if (!f) {
      setCoverFile(null);
      setCoverPreview(null);
      return;
    }
    if (f.size > MAX_BYTES) {
      setError(t("kn.form.too_large"));
      return;
    }
    if (!/^image\//.test(f.type)) return;
    setCoverFile(f);
    const url = URL.createObjectURL(f);
    setCoverPreview(url);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!titleEn.trim() || !bodyEn.trim()) {
      setError(t("kn.form.required"));
      return;
    }
    setSaving(true);
    try {
      let coverPath: string | null = null;
      if (coverFile) coverPath = await uploadCover(coverFile);

      const slug = slugify(titleEn);
      const tagList = tags
        .split(",")
        .map((x) => x.trim().toLowerCase())
        .filter(Boolean);

      const article = await createArticle({
        slug,
        title_en: titleEn.trim(),
        title_th: titleTh.trim() || titleEn.trim(),
        excerpt_en: excerptEn.trim(),
        excerpt_th: excerptTh.trim() || excerptEn.trim(),
        body_en: bodyEn,
        body_th: bodyTh || bodyEn,
        category,
        level,
        framework: framework || null,
        tags: tagList,
        cover_url: coverPath,
        author_name: author.trim() || (locale === "th" ? "ผู้ร่วมเขียน" : "Contributor"),
        read_minutes: readMin,
        is_published: true,
      });

      navigate({ to: "/knowledge/$slug", params: { slug: article.slug } });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to publish";
      setError(message);
      setSaving(false);
    }
  }

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <Starfield />
      </div>
      <SiteHeader />

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <Link
          to="/knowledge"
          className="mb-6 inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-3 w-3" />
          {t("kn.back")}
        </Link>

        <div className="mb-6 flex items-end justify-between gap-4">
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("kn.form.title")}
          </h1>
          <button
            type="button"
            onClick={() => setShowPreview((v) => !v)}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-mono uppercase tracking-wider text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
          >
            <Eye className="h-3.5 w-3.5" />
            {t("kn.preview")}
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          {/* Cover uploader */}
          <section className="glass glow-border rounded-2xl p-5">
            <Label>{t("kn.form.cover")}</Label>

            {coverPreview ? (
              <div className="relative mt-2 overflow-hidden rounded-xl">
                <img
                  src={coverPreview}
                  alt=""
                  className="aspect-[16/8] w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleFile(null)}
                  className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-background/80 px-3 py-1 text-xs backdrop-blur hover:bg-background"
                >
                  <X className="h-3 w-3" />
                  {t("kn.form.cover_remove")}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="mt-2 grid aspect-[16/6] w-full place-items-center rounded-xl border-2 border-dashed border-border bg-background/30 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                style={{ background: gradientFor(titleEn || "preview") }}
              >
                <div className="rounded-2xl bg-background/70 px-5 py-3 text-center backdrop-blur">
                  <Upload className="mx-auto mb-1 h-5 w-5" />
                  <div className="text-sm font-medium">{t("kn.form.cover_drop")}</div>
                </div>
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              hidden
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
            <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <ImageIcon className="h-3 w-3" />
              {t("kn.form.cover_hint")}
            </p>
          </section>

          {/* Bilingual content tabs */}
          <section className="glass rounded-2xl p-5">
            <div className="mb-4 inline-flex rounded-full border border-border bg-background/30 p-1">
              {(["en", "th"] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setTab(lang)}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                    tab === lang
                      ? "bg-primary text-primary-foreground shadow-[0_0_16px_rgba(0,255,102,0.45)]"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {lang === "en" ? t("kn.form.tab_en") : t("kn.form.tab_th")}
                </button>
              ))}
            </div>

            {tab === "en" ? (
              <div className="space-y-4">
                <Field label={t("kn.form.title_label")}>
                  <Input value={titleEn} onChange={setTitleEn} placeholder="The Universe Begins Within You" />
                </Field>
                <Field label={t("kn.form.excerpt_label")}>
                  <TextArea value={excerptEn} onChange={setExcerptEn} rows={2} />
                </Field>
                <Field label={t("kn.form.body_label")}>
                  <TextArea value={bodyEn} onChange={setBodyEn} rows={14} mono />
                </Field>
              </div>
            ) : (
              <div className="space-y-4">
                <Field label={t("kn.form.title_label")}>
                  <Input value={titleTh} onChange={setTitleTh} placeholder="จักรวาลเริ่มต้นที่ตัวคุณ" />
                </Field>
                <Field label={t("kn.form.excerpt_label")}>
                  <TextArea value={excerptTh} onChange={setExcerptTh} rows={2} />
                </Field>
                <Field label={t("kn.form.body_label")}>
                  <TextArea value={bodyTh} onChange={setBodyTh} rows={14} mono />
                </Field>
              </div>
            )}
          </section>

          {/* Meta */}
          <section className="glass rounded-2xl p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("kn.form.author")}>
                <Input value={author} onChange={setAuthor} placeholder="Anya Chen" />
              </Field>
              <Field label={t("kn.form.tags")}>
                <Input value={tags} onChange={setTags} placeholder="scope-3, carbon, gri" />
              </Field>
              <Field label={t("kn.form.category")}>
                <Select value={category} onChange={(v) => setCategory(v as Category)} options={CATEGORIES} />
              </Field>
              <Field label={t("kn.form.level")}>
                <Select value={level} onChange={(v) => setLevel(v as Level)} options={LEVELS} />
              </Field>
              <Field label={t("kn.form.framework")}>
                <Select
                  value={framework}
                  onChange={(v) => setFramework(v as Framework | "")}
                  options={FRAMEWORKS}
                  emptyLabel="—"
                />
              </Field>
              <div className="flex items-end">
                <div className="rounded-xl border border-border bg-background/30 px-3 py-2 text-xs text-muted-foreground">
                  {locale === "th" ? "เวลาอ่านโดยประมาณ" : "Est. read time"}:{" "}
                  <span className="text-primary">{readMin} min</span>
                </div>
              </div>
            </div>
          </section>

          {showPreview && (bodyEn || bodyTh) && (
            <section className="glass rounded-2xl p-6">
              <div className="mb-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                {t("kn.preview")}
              </div>
              <h2 className="mb-4 font-display text-2xl font-semibold">
                {tab === "th" ? titleTh || titleEn : titleEn || titleTh}
              </h2>
              <MarkdownView>{tab === "th" ? bodyTh || bodyEn : bodyEn || bodyTh}</MarkdownView>
            </section>
          )}

          {error && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <Link
              to="/knowledge"
              className="rounded-full border border-border px-5 py-2.5 text-sm text-muted-foreground hover:text-foreground"
            >
              {locale === "th" ? "ยกเลิก" : "Cancel"}
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_0_24px_rgba(0,255,102,0.45)] transition-all hover:scale-[1.03] hover:shadow-[0_0_32px_rgba(0,255,102,0.6)] disabled:opacity-60"
            >
              {saving ? t("kn.form.saving") : t("kn.form.publish")}
            </button>
          </div>
        </form>
      </main>

      <SiteFooter />
    </div>
  );
}

// ---------------- Form primitives ----------------

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1 block text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
      {children}
    </label>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border border-border bg-background/40 px-3 py-2 text-sm backdrop-blur transition-colors focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/40"
    />
  );
}

function TextArea({
  value,
  onChange,
  rows,
  mono,
}: {
  value: string;
  onChange: (v: string) => void;
  rows: number;
  mono?: boolean;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      className={`w-full resize-y rounded-xl border border-border bg-background/40 px-3 py-2 text-sm backdrop-blur transition-colors focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/40 ${
        mono ? "font-mono text-[13px] leading-relaxed" : ""
      }`}
    />
  );
}

function Select({
  value,
  onChange,
  options,
  emptyLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  emptyLabel?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-border bg-background/40 px-3 py-2 text-sm capitalize backdrop-blur transition-colors focus:border-primary/60 focus:outline-none"
    >
      {options.map((o) => (
        <option key={o || "_"} value={o}>
          {o === "" ? (emptyLabel ?? "—") : o === "ONEREPORT" ? "One Report" : o}
        </option>
      ))}
    </select>
  );
}
