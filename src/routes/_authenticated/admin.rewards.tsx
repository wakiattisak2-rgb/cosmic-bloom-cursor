import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Gift, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/admin/rewards")({
  component: AdminRewards,
});

type Reward = {
  id: string;
  title: string;
  title_th: string | null;
  description: string;
  cost: number;
  category: string;
  icon: string;
};

function AdminRewards() {
  const { locale } = useI18n();
  const isTH = locale === "th";
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Reward | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [titleTh, setTitleTh] = useState("");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState(100);

  const rewards = useQuery({
    queryKey: ["admin", "rewards"],
    queryFn: async () => {
      const { data, error } = await supabase.from("rewards").select("*").order("cost");
      if (error) throw error;
      return (data ?? []) as Reward[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase.rpc as any)("admin_upsert_reward", {
        p_id: editing?.id ?? null,
        p_title: title,
        p_title_th: titleTh || title,
        p_description: description,
        p_description_th: description,
        p_cost: cost,
        p_category: "badge",
        p_icon: "sparkles",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(isTH ? "บันทึกแล้ว" : "Saved");
      setEditing(null);
      setFormOpen(false);
      setTitle("");
      setTitleTh("");
      setDescription("");
      setCost(100);
      qc.invalidateQueries({ queryKey: ["admin", "rewards"] });
      qc.invalidateQueries({ queryKey: ["rewards"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.rpc as any)("admin_delete_reward", { p_id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(isTH ? "ลบแล้ว" : "Deleted");
      qc.invalidateQueries({ queryKey: ["admin", "rewards"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function startEdit(r?: Reward) {
    setFormOpen(true);
    if (r) {
      setEditing(r);
      setTitle(r.title);
      setTitleTh(r.title_th ?? "");
      setDescription(r.description);
      setCost(r.cost);
    } else {
      setEditing(null);
      setTitle("");
      setTitleTh("");
      setDescription("");
      setCost(100);
    }
  }

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-lg">
            <Gift className="h-5 w-5 text-primary" />
            {isTH ? "จัดการรางวัล" : "Reward catalog"}
          </h2>
          <button
            onClick={() => startEdit()}
            className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs hover:border-primary/40"
          >
            <Plus className="h-3.5 w-3.5" />
            {isTH ? "เพิ่ม" : "Add"}
          </button>
        </div>

        {(formOpen || editing) && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title EN" className="rounded-lg border border-border bg-background/60 px-3 py-2 text-sm" />
            <input value={titleTh} onChange={(e) => setTitleTh(e.target.value)} placeholder="Title TH" className="rounded-lg border border-border bg-background/60 px-3 py-2 text-sm" />
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" className="sm:col-span-2 rounded-lg border border-border bg-background/60 px-3 py-2 text-sm" />
            <input type="number" value={cost} onChange={(e) => setCost(Number(e.target.value))} placeholder="Cost" className="rounded-lg border border-border bg-background/60 px-3 py-2 text-sm" />
            <button
              onClick={() => save.mutate()}
              disabled={!title || !description || save.isPending}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {editing ? (isTH ? "อัปเดต" : "Update") : isTH ? "สร้าง" : "Create"}
            </button>
          </div>
        )}
      </div>

      <div className="glass overflow-hidden rounded-2xl">
        {(rewards.data ?? []).map((r) => (
          <div key={r.id} className="flex items-center gap-3 border-b border-border/60 px-4 py-3 text-sm last:border-0">
            <div className="min-w-0 flex-1">
              <div className="font-medium">{r.title}</div>
              <div className="text-xs text-muted-foreground">{r.cost} CC · {r.category}</div>
            </div>
            <button onClick={() => startEdit(r)} className="text-xs text-primary hover:underline">
              {isTH ? "แก้ไข" : "Edit"}
            </button>
            <button onClick={() => remove.mutate(r.id)} className="text-destructive hover:text-destructive/80">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
