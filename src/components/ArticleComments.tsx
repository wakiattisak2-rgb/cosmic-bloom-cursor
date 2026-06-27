import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MessageSquare, Send } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { canPerformActions, memberRequiredMessage } from "@/lib/member";
import { addComment, listComments } from "@/lib/comments";
import { logActivity } from "@/lib/activity";

export function ArticleComments({ articleId }: { articleId: string }) {
  const { user } = useAuth();
  const { locale } = useI18n();
  const qc = useQueryClient();
  const [body, setBody] = useState("");

  const comments = useQuery({
    queryKey: ["comments", articleId],
    queryFn: () => listComments(articleId),
  });

  const post = useMutation({
    mutationFn: async () => {
      if (!canPerformActions(user)) throw new Error(memberRequiredMessage(locale));
      await addComment(articleId, body, user.id);
      await logActivity("comment_create", { entityType: "article", entityId: articleId });
    },
    onSuccess: () => {
      setBody("");
      qc.invalidateQueries({ queryKey: ["comments", articleId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="glass rounded-3xl p-6">
      <h2 className="flex items-center gap-2 font-display text-lg">
        <MessageSquare className="h-5 w-5 text-primary" />
        {locale === "th" ? "ความคิดเห็น" : "Discussion"}
      </h2>
      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (body.trim()) post.mutate();
        }}
      >
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={locale === "th" ? "แชร์มุมมองของคุณ…" : "Share your perspective…"}
          className="flex-1 rounded-xl border border-border bg-background/40 px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
        <button
          type="submit"
          disabled={post.isPending || !body.trim()}
          className="rounded-xl bg-primary px-3 py-2 text-primary-foreground disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
      <ul className="mt-6 space-y-4">
        {(comments.data ?? []).map((c) => (
          <li key={c.id} className="border-b border-border/50 pb-4 last:border-0">
            <div className="text-xs font-medium text-primary">{c.author_name}</div>
            <p className="mt-1 text-sm text-muted-foreground">{c.body}</p>
          </li>
        ))}
        {(comments.data ?? []).length === 0 && !comments.isLoading && (
          <p className="text-sm text-muted-foreground">
            {locale === "th" ? "ยังไม่มีความคิดเห็น — เป็นคนแรก" : "No comments yet — start the discussion."}
          </p>
        )}
      </ul>
    </section>
  );
}
