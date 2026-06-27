import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FileText, MessageSquare, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/admin/content")({
  component: AdminContent,
});

function AdminContent() {
  const { locale } = useI18n();
  const isTH = locale === "th";
  const qc = useQueryClient();

  const articles = useQuery({
    queryKey: ["admin", "content", "articles"],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)("knowledge_articles")
        .select("id, slug, title_en, status, is_published, deleted_at, created_at, author_name")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  const posts = useQuery({
    queryKey: ["admin", "content", "posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("id, body, user_id, deleted_at, created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  const softDelete = useMutation({
    mutationFn: async (vars: { table: "posts" | "knowledge_articles"; id: string }) => {
      const { error } = await (supabase.rpc as any)("admin_soft_delete_content", {
        p_table: vars.table,
        p_id: vars.id,
        p_reason: "admin moderation",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(isTH ? "ซ่อนเนื้อหาแล้ว" : "Content hidden");
      qc.invalidateQueries({ queryKey: ["admin", "content"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-8">
      <section className="glass overflow-hidden rounded-2xl">
        <header className="flex items-center gap-2 border-b border-border px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground">
          <FileText className="h-4 w-4" />
          {isTH ? "บทความ" : "Articles"}
        </header>
        {(articles.data ?? []).map((a: any) => (
          <div key={a.id} className="flex items-center gap-3 border-b border-border/60 px-4 py-3 text-sm last:border-0">
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">{a.title_en}</div>
              <div className="text-[11px] text-muted-foreground">
                {a.status} · {a.deleted_at ? (isTH ? "ซ่อนแล้ว" : "hidden") : (isTH ? "เผยแพร่" : "live")}
              </div>
            </div>
            {!a.deleted_at && (
              <button
                onClick={() => softDelete.mutate({ table: "knowledge_articles", id: a.id })}
                className="inline-flex items-center gap-1 rounded-lg border border-destructive/40 px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-3 w-3" />
                {isTH ? "ซ่อน" : "Hide"}
              </button>
            )}
          </div>
        ))}
      </section>

      <section className="glass overflow-hidden rounded-2xl">
        <header className="flex items-center gap-2 border-b border-border px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground">
          <MessageSquare className="h-4 w-4" />
          {isTH ? "โพสต์ชุมชน" : "Community posts"}
        </header>
        {(posts.data ?? []).map((p: any) => (
          <div key={p.id} className="flex items-center gap-3 border-b border-border/60 px-4 py-3 text-sm last:border-0">
            <div className="min-w-0 flex-1 truncate">{p.body}</div>
            {!p.deleted_at && (
              <button
                onClick={() => softDelete.mutate({ table: "posts", id: p.id })}
                className="inline-flex items-center gap-1 rounded-lg border border-destructive/40 px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-3 w-3" />
                {isTH ? "ซ่อน" : "Hide"}
              </button>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
