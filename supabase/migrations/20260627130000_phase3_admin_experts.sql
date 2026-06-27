
-- Soft delete on content
ALTER TABLE public.knowledge_articles
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_knowledge_articles_not_deleted
  ON public.knowledge_articles (is_published, published_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_posts_not_deleted
  ON public.posts (created_at DESC)
  WHERE deleted_at IS NULL;

-- Expert applications
CREATE TABLE public.expert_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  headline TEXT NOT NULL DEFAULT '',
  bio TEXT NOT NULL DEFAULT '',
  certs TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id)
);

CREATE UNIQUE INDEX idx_expert_applications_one_pending
  ON public.expert_applications (user_id)
  WHERE status = 'pending';

CREATE INDEX idx_expert_applications_status ON public.expert_applications (status, created_at DESC);

GRANT SELECT, INSERT ON public.expert_applications TO authenticated;
GRANT ALL ON public.expert_applications TO service_role;

ALTER TABLE public.expert_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own applications" ON public.expert_applications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "users insert own application" ON public.expert_applications
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND status = 'pending');

CREATE POLICY "admins update applications" ON public.expert_applications
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Experts directory (JSON details for services/portfolio/reviews)
CREATE TABLE public.experts (
  id TEXT PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_th TEXT NOT NULL DEFAULT '',
  role_en TEXT NOT NULL DEFAULT '',
  role_th TEXT NOT NULL DEFAULT '',
  bio_en TEXT NOT NULL DEFAULT '',
  bio_th TEXT NOT NULL DEFAULT '',
  long_bio_en TEXT NOT NULL DEFAULT '',
  long_bio_th TEXT NOT NULL DEFAULT '',
  certs TEXT[] NOT NULL DEFAULT '{}',
  specialties TEXT[] NOT NULL DEFAULT '{}',
  rate INTEGER NOT NULL DEFAULT 0,
  rating NUMERIC(2,1) NOT NULL DEFAULT 5.0,
  reviews INTEGER NOT NULL DEFAULT 0,
  projects INTEGER NOT NULL DEFAULT 0,
  years INTEGER NOT NULL DEFAULT 0,
  response_time_en TEXT NOT NULL DEFAULT '',
  response_time_th TEXT NOT NULL DEFAULT '',
  languages TEXT[] NOT NULL DEFAULT '{EN}',
  location TEXT NOT NULL DEFAULT '',
  format_en TEXT NOT NULL DEFAULT 'Remote',
  format_th TEXT NOT NULL DEFAULT 'Remote',
  industries_en TEXT[] NOT NULL DEFAULT '{}',
  industries_th TEXT[] NOT NULL DEFAULT '{}',
  avatar_seed TEXT NOT NULL DEFAULT 'expert',
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.experts TO anon, authenticated;
GRANT ALL ON public.experts TO service_role;

ALTER TABLE public.experts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "published experts public read" ON public.experts
  FOR SELECT USING (is_published = true);

CREATE POLICY "admins manage experts" ON public.experts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Approve/reject expert application
CREATE OR REPLACE FUNCTION public.admin_review_expert_application(
  p_application_id UUID,
  p_approve BOOLEAN,
  p_reason TEXT DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_app public.expert_applications;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;

  SELECT * INTO v_app FROM public.expert_applications WHERE id = p_application_id FOR UPDATE;
  IF v_app.id IS NULL THEN RAISE EXCEPTION 'application not found'; END IF;
  IF v_app.status <> 'pending' THEN RAISE EXCEPTION 'application already reviewed'; END IF;

  UPDATE public.expert_applications
    SET status = CASE WHEN p_approve THEN 'approved' ELSE 'rejected' END,
        reviewed_at = now(),
        reviewed_by = auth.uid()
    WHERE id = p_application_id;

  IF p_approve THEN
    INSERT INTO public.user_roles(user_id, role, granted_by)
      VALUES (v_app.user_id, 'expert', auth.uid())
      ON CONFLICT DO NOTHING;
  END IF;

  INSERT INTO public.admin_audit_log(admin_id, action, target_user_id, target_type, target_id, reason)
    VALUES (
      auth.uid(),
      CASE WHEN p_approve THEN 'approve_expert_application' ELSE 'reject_expert_application' END,
      v_app.user_id,
      'expert_application',
      p_application_id::text,
      p_reason
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_review_expert_application(UUID, BOOLEAN, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_review_expert_application(UUID, BOOLEAN, TEXT) TO authenticated;

-- Prevent users from modifying their own roles
CREATE OR REPLACE FUNCTION public.prevent_self_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.user_id = auth.uid() AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'cannot grant roles to yourself';
  END IF;
  IF TG_OP = 'DELETE' AND OLD.user_id = auth.uid() AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'cannot revoke your own roles';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS prevent_self_role_change_trigger ON public.user_roles;
CREATE TRIGGER prevent_self_role_change_trigger
  BEFORE INSERT OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_self_role_change();

-- Admin soft-delete content
CREATE OR REPLACE FUNCTION public.admin_soft_delete_content(
  p_table TEXT,
  p_id UUID,
  p_reason TEXT DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;

  IF p_table = 'posts' THEN
    UPDATE public.posts SET deleted_at = now() WHERE id = p_id;
  ELSIF p_table = 'knowledge_articles' THEN
    UPDATE public.knowledge_articles SET deleted_at = now(), is_published = false WHERE id = p_id;
  ELSE
    RAISE EXCEPTION 'unsupported table';
  END IF;

  INSERT INTO public.admin_audit_log(admin_id, action, target_type, target_id, reason)
    VALUES (auth.uid(), 'soft_delete', p_table, p_id::text, p_reason);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_soft_delete_content(TEXT, UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_soft_delete_content(TEXT, UUID, TEXT) TO authenticated;

-- Admin rewards CRUD helpers
CREATE OR REPLACE FUNCTION public.admin_upsert_reward(
  p_id UUID,
  p_title TEXT,
  p_title_th TEXT,
  p_description TEXT,
  p_description_th TEXT,
  p_cost INTEGER,
  p_category TEXT DEFAULT 'badge',
  p_icon TEXT DEFAULT 'sparkles'
) RETURNS public.rewards
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_row public.rewards;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;

  IF p_id IS NULL THEN
    INSERT INTO public.rewards(title, title_th, description, description_th, cost, category, icon)
      VALUES (p_title, p_title_th, p_description, p_description_th, p_cost, p_category, p_icon)
      RETURNING * INTO v_row;
  ELSE
    UPDATE public.rewards
      SET title = p_title, title_th = p_title_th, description = p_description,
          description_th = p_description_th, cost = p_cost, category = p_category, icon = p_icon
      WHERE id = p_id RETURNING * INTO v_row;
  END IF;

  INSERT INTO public.admin_audit_log(admin_id, action, target_type, target_id)
    VALUES (auth.uid(), 'upsert_reward', 'reward', v_row.id::text);

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_reward(p_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  DELETE FROM public.rewards WHERE id = p_id;
  INSERT INTO public.admin_audit_log(admin_id, action, target_type, target_id)
    VALUES (auth.uid(), 'delete_reward', 'reward', p_id::text);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_upsert_reward(UUID, TEXT, TEXT, TEXT, TEXT, INTEGER, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_delete_reward(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_upsert_reward(UUID, TEXT, TEXT, TEXT, TEXT, INTEGER, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_reward(UUID) TO authenticated;

GRANT INSERT, UPDATE, DELETE ON public.rewards TO authenticated;

DROP POLICY IF EXISTS "admins manage rewards" ON public.rewards;
CREATE POLICY "admins manage rewards" ON public.rewards
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
