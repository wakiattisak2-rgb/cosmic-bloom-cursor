
-- Killer Features MVP: receipts, compass, squads, expert lens

-- Materiality profile on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS materiality_profile JSONB;

-- Impact receipts
CREATE TABLE public.impact_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_log_id UUID NOT NULL REFERENCES public.actions_log(id) ON DELETE CASCADE,
  verification_id TEXT NOT NULL UNIQUE,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_impact_receipts_user ON public.impact_receipts (user_id, created_at DESC);

GRANT SELECT ON public.impact_receipts TO authenticated;
GRANT INSERT ON public.impact_receipts TO authenticated;
GRANT ALL ON public.impact_receipts TO service_role;

ALTER TABLE public.impact_receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "receipts read own" ON public.impact_receipts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "receipts insert own" ON public.impact_receipts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.create_impact_receipt()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.impact_receipts(user_id, action_log_id, verification_id, payload)
  VALUES (
    NEW.user_id,
    NEW.id,
    'AET-' || upper(substr(replace(NEW.id::text, '-', ''), 1, 12)),
    jsonb_build_object(
      'action_type', NEW.action_type,
      'xp_awarded', NEW.xp_awarded,
      'credits_awarded', NEW.credits_awarded,
      'note', NEW.note,
      'created_at', NEW.created_at
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_action_create_receipt ON public.actions_log;
CREATE TRIGGER on_action_create_receipt
  AFTER INSERT ON public.actions_log
  FOR EACH ROW EXECUTE FUNCTION public.create_impact_receipt();

-- Impact Squads
CREATE TABLE public.squads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Impact Squad',
  challenge_key TEXT NOT NULL DEFAULT 'weekly_impact',
  goal INTEGER NOT NULL DEFAULT 35,
  progress INTEGER NOT NULL DEFAULT 0,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.squad_members (
  squad_id UUID NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (squad_id, user_id)
);

GRANT SELECT ON public.squads TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.squads TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.squad_members TO authenticated;
GRANT ALL ON public.squads, public.squad_members TO service_role;

ALTER TABLE public.squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squad_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "squads read" ON public.squads FOR SELECT TO authenticated USING (true);
CREATE POLICY "squads insert" ON public.squads FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "squads update members" ON public.squads FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.squad_members sm WHERE sm.squad_id = id AND sm.user_id = auth.uid())
);

CREATE POLICY "squad_members read" ON public.squad_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "squad_members join self" ON public.squad_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "squad_members leave self" ON public.squad_members FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.join_impact_squad()
RETURNS public.squads
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_squad public.squads;
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  IF EXISTS (SELECT 1 FROM public.squad_members WHERE user_id = v_uid) THEN
    SELECT s.* INTO v_squad FROM public.squads s
    JOIN public.squad_members sm ON sm.squad_id = s.id
    WHERE sm.user_id = v_uid AND s.ends_at > now()
    ORDER BY s.created_at DESC LIMIT 1;
    RETURN v_squad;
  END IF;

  SELECT s.* INTO v_squad FROM public.squads s
  WHERE s.ends_at > now()
    AND (SELECT COUNT(*) FROM public.squad_members sm WHERE sm.squad_id = s.id) < 5
  ORDER BY s.created_at DESC LIMIT 1;

  IF v_squad.id IS NULL THEN
    INSERT INTO public.squads(name, challenge_key) VALUES ('Impact Squad', 'weekly_impact') RETURNING * INTO v_squad;
  END IF;

  INSERT INTO public.squad_members(squad_id, user_id) VALUES (v_squad.id, v_uid) ON CONFLICT DO NOTHING;
  RETURN v_squad;
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_impact_squad() TO authenticated;

CREATE OR REPLACE FUNCTION public.sync_squad_progress()
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE r RECORD;
  v_sum INT;
BEGIN
  FOR r IN
    SELECT s.id, s.starts_at, s.goal
    FROM public.squads s
    WHERE s.ends_at > now()
  LOOP
    SELECT COALESCE(SUM(al.xp_awarded), 0) INTO v_sum
    FROM public.squad_members sm
    JOIN public.actions_log al ON al.user_id = sm.user_id AND al.created_at >= r.starts_at
    WHERE sm.squad_id = r.id;

    UPDATE public.squads SET progress = LEAST(r.goal, v_sum) WHERE id = r.id;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.sync_squad_progress() TO authenticated;

-- Expert Lens
CREATE TABLE public.expert_lens_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expert_id TEXT NOT NULL REFERENCES public.experts(id) ON DELETE CASCADE,
  body TEXT NOT NULL DEFAULT '',
  attachment_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'answered', 'closed')),
  response_text TEXT,
  credits_cost INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  answered_at TIMESTAMPTZ
);

GRANT SELECT, INSERT ON public.expert_lens_requests TO authenticated;
GRANT UPDATE ON public.expert_lens_requests TO authenticated;
GRANT ALL ON public.expert_lens_requests TO service_role;

ALTER TABLE public.expert_lens_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lens read own or expert admin" ON public.expert_lens_requests
  FOR SELECT TO authenticated USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'expert')
  );

CREATE POLICY "lens insert own" ON public.expert_lens_requests
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "lens update expert admin" ON public.expert_lens_requests
  FOR UPDATE TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'expert')
  );

INSERT INTO storage.buckets (id, name, public)
VALUES ('lens-uploads', 'lens-uploads', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Lens uploads own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'lens-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Lens read own" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'lens-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);
