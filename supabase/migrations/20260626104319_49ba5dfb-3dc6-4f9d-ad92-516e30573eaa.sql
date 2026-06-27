
-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  locale TEXT NOT NULL DEFAULT 'en',
  xp INTEGER NOT NULL DEFAULT 0,
  carbon_credits INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles readable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles update own" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles insert own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, locale)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1)),
    COALESCE(NEW.raw_user_meta_data->>'locale', 'en')
  );
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ACTIONS LOG
CREATE TABLE public.actions_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  xp_awarded INTEGER NOT NULL DEFAULT 0,
  credits_awarded INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.actions_log TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.actions_log TO authenticated;
GRANT ALL ON public.actions_log TO service_role;
ALTER TABLE public.actions_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "actions readable by everyone" ON public.actions_log FOR SELECT USING (true);
CREATE POLICY "actions insert own" ON public.actions_log FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "actions delete own" ON public.actions_log FOR DELETE USING (auth.uid() = user_id);

-- Function to award action and update profile in single tx
CREATE OR REPLACE FUNCTION public.log_action(
  p_action_type TEXT, p_xp INTEGER, p_credits INTEGER, p_note TEXT DEFAULT NULL
) RETURNS public.actions_log
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_row public.actions_log;
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  INSERT INTO public.actions_log(user_id, action_type, xp_awarded, credits_awarded, note)
  VALUES (v_uid, p_action_type, GREATEST(p_xp,0), GREATEST(p_credits,0), p_note)
  RETURNING * INTO v_row;
  UPDATE public.profiles
    SET xp = xp + GREATEST(p_xp,0),
        carbon_credits = carbon_credits + GREATEST(p_credits,0)
    WHERE id = v_uid;
  RETURN v_row;
END; $$;

-- POSTS
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  tag TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT ALL ON public.posts TO service_role;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "posts readable by everyone" ON public.posts FOR SELECT USING (true);
CREATE POLICY "posts insert own" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "posts update own" ON public.posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "posts delete own" ON public.posts FOR DELETE USING (auth.uid() = user_id);

-- UPVOTES
CREATE TABLE public.post_upvotes (
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);
GRANT SELECT ON public.post_upvotes TO anon;
GRANT SELECT, INSERT, DELETE ON public.post_upvotes TO authenticated;
GRANT ALL ON public.post_upvotes TO service_role;
ALTER TABLE public.post_upvotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "upvotes readable" ON public.post_upvotes FOR SELECT USING (true);
CREATE POLICY "upvote own" ON public.post_upvotes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "unvote own" ON public.post_upvotes FOR DELETE USING (auth.uid() = user_id);

-- CHALLENGES
CREATE TABLE public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  title_th TEXT,
  description TEXT NOT NULL,
  description_th TEXT,
  goal INTEGER NOT NULL DEFAULT 7,
  xp_reward INTEGER NOT NULL DEFAULT 100,
  credits_reward INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.challenges TO anon, authenticated;
GRANT ALL ON public.challenges TO service_role;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "challenges public read" ON public.challenges FOR SELECT USING (true);

CREATE TABLE public.challenge_participants (
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  progress INTEGER NOT NULL DEFAULT 0,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (challenge_id, user_id)
);
GRANT SELECT ON public.challenge_participants TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.challenge_participants TO authenticated;
GRANT ALL ON public.challenge_participants TO service_role;
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "participants public read" ON public.challenge_participants FOR SELECT USING (true);
CREATE POLICY "participant join self" ON public.challenge_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "participant update self" ON public.challenge_participants FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "participant leave self" ON public.challenge_participants FOR DELETE USING (auth.uid() = user_id);

-- REWARDS
CREATE TABLE public.rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  title_th TEXT,
  description TEXT NOT NULL,
  description_th TEXT,
  cost INTEGER NOT NULL,
  category TEXT NOT NULL DEFAULT 'badge',
  icon TEXT NOT NULL DEFAULT 'sparkles',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.rewards TO anon, authenticated;
GRANT ALL ON public.rewards TO service_role;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rewards public read" ON public.rewards FOR SELECT USING (true);

CREATE TABLE public.redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES public.rewards(id) ON DELETE CASCADE,
  credits_spent INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.redemptions TO authenticated;
GRANT SELECT, INSERT ON public.redemptions TO authenticated;
GRANT ALL ON public.redemptions TO service_role;
ALTER TABLE public.redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "redemptions own read" ON public.redemptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "redemptions insert own" ON public.redemptions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Redeem function: atomic balance check + spend
CREATE OR REPLACE FUNCTION public.redeem_reward(p_reward_id UUID)
RETURNS public.redemptions
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_cost INTEGER;
  v_balance INTEGER;
  v_row public.redemptions;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT cost INTO v_cost FROM public.rewards WHERE id = p_reward_id;
  IF v_cost IS NULL THEN RAISE EXCEPTION 'reward not found'; END IF;
  SELECT carbon_credits INTO v_balance FROM public.profiles WHERE id = v_uid FOR UPDATE;
  IF v_balance < v_cost THEN RAISE EXCEPTION 'insufficient credits'; END IF;
  UPDATE public.profiles SET carbon_credits = carbon_credits - v_cost WHERE id = v_uid;
  INSERT INTO public.redemptions(user_id, reward_id, credits_spent)
  VALUES (v_uid, p_reward_id, v_cost) RETURNING * INTO v_row;
  RETURN v_row;
END; $$;
