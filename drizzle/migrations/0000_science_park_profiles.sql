CREATE TABLE public.companies (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL CHECK (length(name) BETWEEN 1 AND 120), website_url text NOT NULL CHECK (length(website_url) <= 2048 AND website_url ~ '^https?://'), created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT ON public.companies TO anon, authenticated; GRANT ALL ON public.companies TO service_role;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Shared prototype companies read" ON public.companies FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Shared prototype companies add" ON public.companies FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE TABLE public.profile_items (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE, field text NOT NULL CHECK (field IN ('what_it_does','products_services','technologies','application_areas','markets_customers','geography','projects_collaborations','possible_interests')), value text NOT NULL CHECK (length(value) <= 5000), kind text NOT NULL CHECK (kind IN ('fact','inferred','missing')), evidence_quote text, source_url text, retrieved_at timestamptz NOT NULL DEFAULT now(), confirmed_by_user boolean NOT NULL DEFAULT false);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile_items TO anon, authenticated; GRANT ALL ON public.profile_items TO service_role;
ALTER TABLE public.profile_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Shared prototype profile read" ON public.profile_items FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Shared prototype profile add" ON public.profile_items FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Shared prototype profile edit" ON public.profile_items FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Shared prototype profile delete" ON public.profile_items FOR DELETE TO anon, authenticated USING (true);
CREATE INDEX profile_items_company_idx ON public.profile_items(company_id);
CREATE TABLE public.company_priorities (company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE, priority text NOT NULL CHECK (priority IN ('funding','events','testing','partners')), PRIMARY KEY (company_id, priority));
GRANT SELECT, INSERT, DELETE ON public.company_priorities TO anon, authenticated; GRANT ALL ON public.company_priorities TO service_role;
ALTER TABLE public.company_priorities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Shared prototype priorities read" ON public.company_priorities FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Shared prototype priorities add" ON public.company_priorities FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Shared prototype priorities delete" ON public.company_priorities FOR DELETE TO anon, authenticated USING (true);
CREATE TABLE public.ai_access_state (id text PRIMARY KEY, blocked boolean NOT NULL DEFAULT false, reason text);
GRANT ALL ON public.ai_access_state TO service_role;
ALTER TABLE public.ai_access_state ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.replace_generated_profile(p_company_id uuid, p_items jsonb) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$ BEGIN
PERFORM id FROM public.companies WHERE id=p_company_id FOR UPDATE;
DELETE FROM public.profile_items WHERE company_id=p_company_id AND confirmed_by_user=false;
INSERT INTO public.profile_items (company_id,field,value,kind,evidence_quote,source_url,retrieved_at,confirmed_by_user)
SELECT p_company_id, x.field, x.value, x.kind, x.evidence_quote, x.source_url, now(), false FROM jsonb_to_recordset(p_items) AS x(field text,value text,kind text,evidence_quote text,source_url text)
WHERE NOT EXISTS (SELECT 1 FROM public.profile_items i WHERE i.company_id=p_company_id AND i.field=x.field AND i.confirmed_by_user=true);
END $$;
REVOKE ALL ON FUNCTION public.replace_generated_profile(uuid,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.replace_generated_profile(uuid,jsonb) TO anon, authenticated, service_role;