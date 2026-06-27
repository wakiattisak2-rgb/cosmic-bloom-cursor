ALTER TABLE public.actions_log REPLICA IDENTITY FULL;
DO $$ BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.actions_log;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;