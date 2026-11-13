ALTER TABLE public.companies ADD COLUMN member_page_url text;
CREATE POLICY "Shared prototype companies edit" ON public.companies FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
GRANT UPDATE ON public.companies TO anon, authenticated;

CREATE TABLE public.opportunities(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 external_key text NOT NULL UNIQUE,
 type text NOT NULL CHECK (type IN ('funding','event')),
 title text NOT NULL, summary text NOT NULL DEFAULT '',
 source_name text NOT NULL, source_url text,
 deadline_or_date text,
 location_mode text NOT NULL DEFAULT 'unknown' CHECK (location_mode IN ('online','in_person','unknown')),
 audience text, retrieved_at timestamptz NOT NULL DEFAULT now(),
 simulated boolean NOT NULL DEFAULT false);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.opportunities TO anon, authenticated;
GRANT ALL ON public.opportunities TO service_role;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Shared prototype opportunities" ON public.opportunities FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.source_checks(
 source_name text PRIMARY KEY, last_checked timestamptz NOT NULL DEFAULT now(),
 status text NOT NULL, message text, found integer NOT NULL DEFAULT 0);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.source_checks TO anon, authenticated;
GRANT ALL ON public.source_checks TO service_role;
ALTER TABLE public.source_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Shared prototype source checks" ON public.source_checks FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.matches(
 company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
 opportunity_id uuid NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
 score integer NOT NULL CHECK (score BETWEEN 0 AND 100),
 reason text NOT NULL, check_first text NOT NULL, next_step text NOT NULL,
 matched_profile_item_ids uuid[] NOT NULL DEFAULT '{}',
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(company_id, opportunity_id));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.matches TO anon, authenticated;
GRANT ALL ON public.matches TO service_role;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Shared prototype matches" ON public.matches FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.feedback(
 company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
 opportunity_id uuid NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
 saved boolean NOT NULL DEFAULT false,
 vote text CHECK (vote IN ('up','down')),
 PRIMARY KEY(company_id, opportunity_id));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.feedback TO anon, authenticated;
GRANT ALL ON public.feedback TO service_role;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Shared prototype feedback" ON public.feedback FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);