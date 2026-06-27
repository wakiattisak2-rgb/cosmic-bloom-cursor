
-- Global tier: comments, avatars, rate limits, reward stock

-- Comments on knowledge articles
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.knowledge_articles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_comments_article ON public.comments (article_id, created_at DESC)
  WHERE deleted_at IS NULL;

GRANT SELECT ON public.comments TO anon, authenticated;
GRANT INSERT, UPDATE ON public.comments TO authenticated;
GRANT ALL ON public.comments TO service_role;

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comments public read" ON public.comments
  FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "comments insert own" ON public.comments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "comments soft delete own" ON public.comments
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "admins read all comments" ON public.comments
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Article likes
CREATE TABLE public.article_likes (
  article_id UUID NOT NULL REFERENCES public.knowledge_articles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (article_id, user_id)
);

GRANT SELECT ON public.article_likes TO anon, authenticated;
GRANT INSERT, DELETE ON public.article_likes TO authenticated;
ALTER TABLE public.article_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "likes public read" ON public.article_likes FOR SELECT USING (true);
CREATE POLICY "like own" ON public.article_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "unlike own" ON public.article_likes FOR DELETE USING (auth.uid() = user_id);

-- Avatars bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Rate limit posts: max 10 per hour
CREATE OR REPLACE FUNCTION public.check_post_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count FROM public.posts
    WHERE user_id = NEW.user_id AND created_at > now() - interval '1 hour' AND deleted_at IS NULL;
  IF v_count >= 10 THEN
    RAISE EXCEPTION 'rate limit: max 10 posts per hour';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS posts_rate_limit ON public.posts;
CREATE TRIGGER posts_rate_limit
  BEFORE INSERT ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.check_post_rate_limit();

-- Reward stock
ALTER TABLE public.rewards
  ADD COLUMN IF NOT EXISTS stock INTEGER,
  ADD COLUMN IF NOT EXISTS stock_remaining INTEGER;

-- Redeem logs activity via trigger
CREATE OR REPLACE FUNCTION public.log_reward_redeem_activity()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.activity_log(user_id, event_type, entity_type, entity_id, metadata)
  VALUES (NEW.user_id, 'reward_redeem', 'reward', NEW.reward_id::text,
    jsonb_build_object('credits_spent', NEW.credits_spent));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_redemption_activity ON public.redemptions;
CREATE TRIGGER on_redemption_activity
  AFTER INSERT ON public.redemptions
  FOR EACH ROW EXECUTE FUNCTION public.log_reward_redeem_activity();

-- Admin stats view: daily active users (last 30 days)
CREATE OR REPLACE VIEW public.admin_daily_active
WITH (security_invoker=on) AS
SELECT
  date_trunc('day', created_at)::date AS day,
  COUNT(DISTINCT user_id) AS dau
FROM public.activity_log
WHERE user_id IS NOT NULL AND created_at > now() - interval '30 days'
GROUP BY 1
ORDER BY 1 DESC;

GRANT SELECT ON public.admin_daily_active TO authenticated;
