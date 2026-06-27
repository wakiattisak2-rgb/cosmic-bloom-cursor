import { supabase } from "@/integrations/supabase/client";
import { EXPERTS, type Expert, type ExpertPortfolio, type ExpertReview, type ExpertService } from "@/lib/experts";

type ExpertRow = {
  id: string;
  name_en: string;
  name_th: string;
  role_en: string;
  role_th: string;
  bio_en: string;
  bio_th: string;
  long_bio_en: string;
  long_bio_th: string;
  certs: string[];
  specialties: string[];
  rate: number;
  rating: number;
  reviews: number;
  projects: number;
  years: number;
  response_time_en: string;
  response_time_th: string;
  languages: string[];
  location: string;
  format_en: string;
  format_th: string;
  industries_en: string[];
  industries_th: string[];
  avatar_seed: string;
  details: {
    services?: ExpertService[];
    portfolio?: ExpertPortfolio[];
    reviewsList?: ExpertReview[];
  };
};

function rowToExpert(row: ExpertRow): Expert {
  return {
    id: row.id,
    name_en: row.name_en,
    name_th: row.name_th,
    role_en: row.role_en,
    role_th: row.role_th,
    bio_en: row.bio_en,
    bio_th: row.bio_th,
    long_bio_en: row.long_bio_en,
    long_bio_th: row.long_bio_th,
    certs: row.certs ?? [],
    specialties: (row.specialties ?? []) as Expert["specialties"],
    rate: row.rate,
    rating: Number(row.rating),
    reviews: row.reviews,
    projects: row.projects,
    years: row.years,
    responseTime_en: row.response_time_en,
    responseTime_th: row.response_time_th,
    languages: row.languages ?? [],
    location: row.location,
    format_en: row.format_en,
    format_th: row.format_th,
    industries_en: row.industries_en ?? [],
    industries_th: row.industries_th ?? [],
    avatarSeed: row.avatar_seed,
    services: row.details?.services ?? [],
    portfolio: row.details?.portfolio ?? [],
    reviewsList: row.details?.reviewsList ?? [],
  };
}

export async function listExperts(): Promise<Expert[]> {
  const { data, error } = await (supabase.from as any)("experts")
    .select("*")
    .eq("is_published", true)
    .order("rating", { ascending: false });

  if (error || !data?.length) return [];
  return (data as ExpertRow[]).map(rowToExpert);
}

export async function getExpertById(id: string): Promise<Expert | null> {
  const { data, error } = await (supabase.from as any)("experts")
    .select("*")
    .eq("id", id)
    .eq("is_published", true)
    .maybeSingle();

  if (error || !data) return null;
  return rowToExpert(data as ExpertRow);
}

export async function seedExpertsIfEmpty(): Promise<number> {
  const { count } = await (supabase.from as any)("experts").select("id", { count: "exact", head: true });
  if ((count ?? 0) > 0) return 0;

  const rows = EXPERTS.map((e) => ({
    id: e.id,
    name_en: e.name_en,
    name_th: e.name_th,
    role_en: e.role_en,
    role_th: e.role_th,
    bio_en: e.bio_en,
    bio_th: e.bio_th,
    long_bio_en: e.long_bio_en,
    long_bio_th: e.long_bio_th,
    certs: e.certs,
    specialties: e.specialties,
    rate: e.rate,
    rating: e.rating,
    reviews: e.reviews,
    projects: e.projects,
    years: e.years,
    response_time_en: e.responseTime_en,
    response_time_th: e.responseTime_th,
    languages: e.languages,
    location: e.location,
    format_en: e.format_en,
    format_th: e.format_th,
    industries_en: e.industries_en,
    industries_th: e.industries_th,
    avatar_seed: e.avatarSeed,
    details: { services: e.services, portfolio: e.portfolio, reviewsList: e.reviewsList },
    is_published: true,
  }));

  const { error } = await (supabase.from as any)("experts").insert(rows);
  if (error) throw error;
  return rows.length;
}
