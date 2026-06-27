
CREATE TABLE public.knowledge_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title_en TEXT NOT NULL,
  title_th TEXT NOT NULL DEFAULT '',
  excerpt_en TEXT NOT NULL DEFAULT '',
  excerpt_th TEXT NOT NULL DEFAULT '',
  body_en TEXT NOT NULL DEFAULT '',
  body_th TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'reporting',
  level TEXT NOT NULL DEFAULT 'beginner',
  framework TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  cover_url TEXT,
  author_name TEXT NOT NULL DEFAULT 'Anonymous',
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  read_minutes INT NOT NULL DEFAULT 5,
  is_published BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'approved',
  author_role TEXT NOT NULL DEFAULT 'guest',
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_knowledge_articles_published ON public.knowledge_articles (is_published, published_at DESC);
CREATE INDEX idx_knowledge_articles_category ON public.knowledge_articles (category);
CREATE INDEX idx_knowledge_articles_level ON public.knowledge_articles (level);
CREATE INDEX idx_knowledge_articles_framework ON public.knowledge_articles (framework);

GRANT SELECT ON public.knowledge_articles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.knowledge_articles TO authenticated;
GRANT ALL ON public.knowledge_articles TO service_role;

ALTER TABLE public.knowledge_articles ENABLE ROW LEVEL SECURITY;

-- Anyone can read published articles
CREATE POLICY "Published articles are public"
  ON public.knowledge_articles FOR SELECT
  USING (is_published = true);

-- Authors (and any authenticated user during Phase 1) can read their drafts too
CREATE POLICY "Authenticated can read all articles"
  ON public.knowledge_articles FOR SELECT
  TO authenticated
  USING (true);

-- Phase 1: any signed-in user can create/edit/delete
-- TODO Phase 2: restrict to has_role(auth.uid(), 'editor') OR has_role(auth.uid(), 'expert')
CREATE POLICY "Authenticated can insert articles"
  ON public.knowledge_articles FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update articles"
  ON public.knowledge_articles FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated can delete articles"
  ON public.knowledge_articles FOR DELETE
  TO authenticated
  USING (true);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.knowledge_articles_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER knowledge_articles_updated_at
  BEFORE UPDATE ON public.knowledge_articles
  FOR EACH ROW EXECUTE FUNCTION public.knowledge_articles_set_updated_at();
