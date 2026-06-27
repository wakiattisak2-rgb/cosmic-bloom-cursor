
-- Post reports, notification outbox, challenge sync helper

CREATE TABLE public.post_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);

GRANT SELECT, INSERT ON public.post_reports TO authenticated;
GRANT ALL ON public.post_reports TO service_role;
ALTER TABLE public.post_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users report posts" ON public.post_reports
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admins read reports" ON public.post_reports
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.notification_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL DEFAULT 'email' CHECK (channel IN ('email')),
  template TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notification_outbox_pending ON public.notification_outbox (created_at)
  WHERE sent_at IS NULL;

GRANT INSERT ON public.notification_outbox TO authenticated;
GRANT ALL ON public.notification_outbox TO service_role;
ALTER TABLE public.notification_outbox ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users queue own notifications" ON public.notification_outbox
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admins read outbox" ON public.notification_outbox
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Sync challenge progress from distinct action days since join
CREATE OR REPLACE FUNCTION public.sync_challenge_progress(p_user_id UUID DEFAULT auth.uid())
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE r RECORD;
  v_days INT;
BEGIN
  IF p_user_id IS NULL OR p_user_id <> auth.uid() THEN
    IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  END IF;

  FOR r IN
    SELECT cp.challenge_id, cp.joined_at, c.goal
    FROM public.challenge_participants cp
    JOIN public.challenges c ON c.id = cp.challenge_id
    WHERE cp.user_id = p_user_id
  LOOP
    SELECT COUNT(DISTINCT date_trunc('day', al.created_at)::date) INTO v_days
    FROM public.actions_log al
    WHERE al.user_id = p_user_id AND al.created_at >= r.joined_at;

    UPDATE public.challenge_participants
      SET progress = LEAST(r.goal, v_days)
      WHERE challenge_id = r.challenge_id AND user_id = p_user_id;
  END LOOP;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.sync_challenge_progress(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sync_challenge_progress(UUID) TO authenticated;

-- Weekly active users view
CREATE OR REPLACE VIEW public.admin_weekly_active
WITH (security_invoker=on) AS
SELECT COUNT(DISTINCT user_id) AS wau
FROM public.activity_log
WHERE user_id IS NOT NULL AND created_at > now() - interval '7 days';

GRANT SELECT ON public.admin_weekly_active TO authenticated;
