import { supabase } from "@/integrations/supabase/client";

export type Comment = {
  id: string;
  article_id: string;
  user_id: string;
  body: string;
  created_at: string;
  author_name?: string;
};

export async function listComments(articleId: string): Promise<Comment[]> {
  const { data, error } = await (supabase.from as any)("comments")
    .select("id, article_id, user_id, body, created_at")
    .eq("article_id", articleId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });
  if (error) throw error;
  const rows = (data ?? []) as Comment[];
  if (rows.length === 0) return rows;
  const ids = [...new Set(rows.map((r) => r.user_id))];
  const { data: profiles } = await supabase.from("profiles").select("id, display_name").in("id", ids);
  const names = new Map((profiles ?? []).map((p) => [p.id, p.display_name ?? "Pioneer"]));
  return rows.map((r) => ({ ...r, author_name: names.get(r.user_id) ?? "Pioneer" }));
}

export async function addComment(articleId: string, body: string, userId: string): Promise<void> {
  const { error } = await (supabase.from as any)("comments").insert({
    article_id: articleId,
    user_id: userId,
    body: body.trim(),
  });
  if (error) throw error;
}

export async function toggleArticleLike(articleId: string, userId: string, liked: boolean): Promise<void> {
  if (liked) {
    await (supabase.from as any)("article_likes").delete().match({ article_id: articleId, user_id: userId });
  } else {
    await (supabase.from as any)("article_likes").insert({ article_id: articleId, user_id: userId });
  }
}

export async function getArticleLikeCount(articleId: string): Promise<number> {
  const { count } = await (supabase.from as any)("article_likes")
    .select("article_id", { count: "exact", head: true })
    .eq("article_id", articleId);
  return count ?? 0;
}

export async function userLikedArticle(articleId: string, userId: string): Promise<boolean> {
  const { data } = await (supabase.from as any)("article_likes")
    .select("article_id")
    .match({ article_id: articleId, user_id: userId })
    .maybeSingle();
  return !!data;
}
