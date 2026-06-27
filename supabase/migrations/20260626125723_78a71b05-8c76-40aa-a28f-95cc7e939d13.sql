
-- 1. App roles
CREATE TYPE public.app_role AS ENUM ('user', 'expert', 'moderator', 'admin');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  granted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "users read own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. Expand profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS handle TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS onboarded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Admin can read all profiles
DROP POLICY IF EXISTS "admins read all profiles" ON public.profiles;
CREATE POLICY "admins read all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 3. Activity log (immutable)
CREATE TABLE public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_log_user ON public.activity_log(user_id, created_at DESC);
CREATE INDEX idx_activity_log_event ON public.activity_log(event_type, created_at DESC);

GRANT SELECT, INSERT ON public.activity_log TO authenticated;
GRANT ALL ON public.activity_log TO service_role;

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own activity" ON public.activity_log
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "users insert own activity" ON public.activity_log
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- 4. Admin audit log
CREATE TABLE public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  target_user_id UUID REFERENCES auth.users(id),
  target_type TEXT,
  target_id TEXT,
  reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_admin_audit_admin ON public.admin_audit_log(admin_id, created_at DESC);

GRANT SELECT ON public.admin_audit_log TO authenticated;
GRANT ALL ON public.admin_audit_log TO service_role;

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "only admins read audit" ON public.admin_audit_log
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 5. log_activity RPC
CREATE OR REPLACE FUNCTION public.log_activity(
  p_event_type TEXT,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO public.activity_log(user_id, event_type, entity_type, entity_id, metadata)
  VALUES (auth.uid(), p_event_type, p_entity_type, p_entity_id, COALESCE(p_metadata, '{}'::jsonb))
  RETURNING id INTO v_id;
  -- update last_seen
  UPDATE public.profiles SET last_seen_at = now() WHERE id = auth.uid();
  RETURN v_id;
END $$;

-- 6. Bootstrap admin: first user to call gets admin (only if no admin exists)
CREATE OR REPLACE FUNCTION public.claim_first_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    RETURN false;
  END IF;
  INSERT INTO public.user_roles(user_id, role, granted_by) VALUES (v_uid, 'admin', v_uid)
    ON CONFLICT DO NOTHING;
  INSERT INTO public.admin_audit_log(admin_id, action, target_user_id, reason)
    VALUES (v_uid, 'bootstrap_admin', v_uid, 'first admin claim');
  RETURN true;
END $$;

-- 7. Admin: grant/revoke role with audit
CREATE OR REPLACE FUNCTION public.admin_grant_role(p_user_id UUID, p_role public.app_role, p_reason TEXT DEFAULT NULL)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  INSERT INTO public.user_roles(user_id, role, granted_by) VALUES (p_user_id, p_role, auth.uid())
    ON CONFLICT DO NOTHING;
  INSERT INTO public.admin_audit_log(admin_id, action, target_user_id, target_type, target_id, reason, metadata)
    VALUES (auth.uid(), 'grant_role', p_user_id, 'role', p_role::text, p_reason, jsonb_build_object('role', p_role));
END $$;

CREATE OR REPLACE FUNCTION public.admin_revoke_role(p_user_id UUID, p_role public.app_role, p_reason TEXT DEFAULT NULL)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  DELETE FROM public.user_roles WHERE user_id = p_user_id AND role = p_role;
  INSERT INTO public.admin_audit_log(admin_id, action, target_user_id, target_type, target_id, reason)
    VALUES (auth.uid(), 'revoke_role', p_user_id, 'role', p_role::text, p_reason);
END $$;

CREATE OR REPLACE FUNCTION public.admin_set_suspended(p_user_id UUID, p_suspend BOOLEAN, p_reason TEXT DEFAULT NULL)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.profiles SET suspended_at = CASE WHEN p_suspend THEN now() ELSE NULL END WHERE id = p_user_id;
  INSERT INTO public.admin_audit_log(admin_id, action, target_user_id, reason)
    VALUES (auth.uid(), CASE WHEN p_suspend THEN 'suspend_user' ELSE 'unsuspend_user' END, p_user_id, p_reason);
END $$;

-- 8. Update handle_new_user to also assign default 'user' role and log signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, locale)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(COALESCE(NEW.email,''),'@',1), 'Pioneer'),
    COALESCE(NEW.raw_user_meta_data->>'locale', 'en')
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;

  INSERT INTO public.activity_log(user_id, event_type, metadata)
  VALUES (NEW.id, 'signup', jsonb_build_object('is_anonymous', NEW.is_anonymous));

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. Admin stats view
CREATE OR REPLACE VIEW public.admin_user_stats
WITH (security_invoker=on) AS
SELECT
  p.id, p.display_name, p.handle, p.avatar_url, p.locale, p.country,
  p.xp, p.carbon_credits, p.suspended_at, p.last_seen_at, p.created_at,
  u.email, u.is_anonymous,
  COALESCE(array_agg(DISTINCT r.role) FILTER (WHERE r.role IS NOT NULL), '{}') AS roles,
  (SELECT COUNT(*) FROM public.activity_log WHERE user_id = p.id) AS event_count,
  (SELECT COUNT(*) FROM public.knowledge_articles WHERE author_id = p.id) AS article_count
FROM public.profiles p
LEFT JOIN auth.users u ON u.id = p.id
LEFT JOIN public.user_roles r ON r.user_id = p.id
GROUP BY p.id, u.email, u.is_anonymous;

GRANT SELECT ON public.admin_user_stats TO authenticated;
