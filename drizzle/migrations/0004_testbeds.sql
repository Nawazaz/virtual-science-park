CREATE TABLE public.testbeds (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 name text NOT NULL CHECK (length(name) BETWEEN 1 AND 200),
 organisation text NOT NULL DEFAULT '',
 description text NOT NULL DEFAULT '',
 what_you_can_test text NOT NULL DEFAULT '',
 how_to_start text NOT NULL DEFAULT '',
 location text NOT NULL DEFAULT '',
 url text NOT NULL CHECK (url ~* '^https?://'),
 added_by text NOT NULL DEFAULT '',
 verified_on date NOT NULL DEFAULT current_date,
 active boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.testbeds TO anon, authenticated;
GRANT ALL ON public.testbeds TO service_role;
ALTER TABLE public.testbeds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Shared prototype testbeds read" ON public.testbeds FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Shared prototype testbeds add" ON public.testbeds FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Shared prototype testbeds edit" ON public.testbeds FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);