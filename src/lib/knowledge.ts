import { supabase } from "@/integrations/supabase/client";

export type Category = "environment" | "social" | "governance" | "reporting";
export type Level = "beginner" | "practitioner" | "strategist";
export type Framework = "GRI" | "SASB" | "TCFD" | "CSRD" | "ONEREPORT";

export interface KnowledgeArticle {
  id: string;
  slug: string;
  title_en: string;
  title_th: string;
  excerpt_en: string;
  excerpt_th: string;
  body_en: string;
  body_th: string;
  category: Category;
  level: Level;
  framework: Framework | null;
  tags: string[];
  cover_url: string | null; // storage path inside knowledge-covers bucket
  author_name: string;
  read_minutes: number;
  is_published: boolean;
  published_at: string;
  created_at: string;
  updated_at: string;
}

export const COVERS_BUCKET = "knowledge-covers";

const TABLE = "knowledge_articles";

// table not in generated types yet — use loose client
const db = supabase as unknown as {
  from: (t: string) => any;
};

export async function listArticles(): Promise<KnowledgeArticle[]> {
  const { data, error } = await db
    .from(TABLE)
    .select("*")
    .eq("is_published", true)
    .is("deleted_at", null)
    .order("published_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as KnowledgeArticle[];
}

export async function getArticleBySlug(
  slug: string,
): Promise<KnowledgeArticle | null> {
  const { data, error } = await db
    .from(TABLE)
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as KnowledgeArticle) ?? null;
}

export async function createArticle(
  input: Omit<KnowledgeArticle, "id" | "created_at" | "updated_at" | "published_at"> & {
    published_at?: string;
  },
): Promise<KnowledgeArticle> {
  const { data, error } = await db.from(TABLE).insert(input as never).select().single();
  if (error) throw error;
  return data as unknown as KnowledgeArticle;
}

// ---------------- Helpers ----------------

export function slugify(s: string): string {
  const base = s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
  const suffix = Math.random().toString(36).slice(2, 7);
  return base ? `${base}-${suffix}` : suffix;
}

// Deterministic gradient from string — used when no cover image
export function gradientFor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const a = h % 360;
  const b = (a + 60 + (h % 80)) % 360;
  return `linear-gradient(135deg, hsl(${a} 80% 22%) 0%, hsl(${b} 85% 14%) 100%)`;
}

export function estimateReadMinutes(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

// ---------------- Storage (cover images) ----------------

export async function uploadCover(file: File): Promise<string> {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage
    .from(COVERS_BUCKET)
    .upload(path, file, { cacheControl: "31536000", upsert: false });
  if (error) throw error;
  return path;
}

export async function getCoverSignedUrl(
  path: string,
  expiresIn = 60 * 60,
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(COVERS_BUCKET)
    .createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}
