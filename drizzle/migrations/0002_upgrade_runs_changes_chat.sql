ALTER TABLE public.opportunities DROP CONSTRAINT IF EXISTS opportunities_type_check;
ALTER TABLE public.opportunities ADD CONSTRAINT opportunities_type_check CHECK (type IN ('funding','event','testing','news'));
ALTER TABLE public.opportunities ADD COLUMN purpose text, ADD COLUMN key_requirements text, ADD COLUMN next_step_url text;

CREATE TABLE public.agent_runs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 agent text NOT NULL,
 company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
 started_at timestamptz NOT NULL DEFAULT now(),
 duration_ms integer NOT NULL DEFAULT 0,
 sources_used text[] NOT NULL DEFAULT '{}',
 output text NOT NULL DEFAULT '',
 checks jsonb NOT NULL DEFAULT '[]'::jsonb,
 simulated boolean NOT NULL DEFAULT false
);
GRANT SELECT, INSERT ON public.agent_runs TO anon, authenticated;
GRANT ALL ON public.agent_runs TO service_role;
ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Shared prototype runs read" ON public.agent_runs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Shared prototype runs add" ON public.agent_runs FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE INDEX agent_runs_lookup ON public.agent_runs(agent, company_id, started_at DESC);

CREATE TABLE public.profile_changes (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
 field text NOT NULL,
 old_value text,
 new_value text,
 changed_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.profile_changes TO anon, authenticated;
GRANT ALL ON public.profile_changes TO service_role;
ALTER TABLE public.profile_changes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Shared prototype changes read" ON public.profile_changes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Shared prototype changes add" ON public.profile_changes FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE TABLE public.chat_messages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
 role text NOT NULL CHECK (role IN ('user','assistant')),
 content text NOT NULL,
 guard_class text,
 sources jsonb NOT NULL DEFAULT '[]'::jsonb,
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.chat_messages TO anon, authenticated;
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Shared prototype chat read" ON public.chat_messages FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Shared prototype chat add" ON public.chat_messages FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.replace_generated_profile(p_company_id uuid, p_items jsonb) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE had_items boolean;
BEGIN
PERFORM id FROM public.companies WHERE id=p_company_id FOR UPDATE;
SELECT EXISTS(SELECT 1 FROM public.profile_items WHERE company_id=p_company_id AND confirmed_by_user=false) INTO had_items;
CREATE TEMP TABLE IF NOT EXISTS _old_profile(field text, value text) ON COMMIT DROP;
DELETE FROM _old_profile;
INSERT INTO _old_profile SELECT field, string_agg(value, ' | ' ORDER BY value) FROM public.profile_items WHERE company_id=p_company_id AND confirmed_by_user=false GROUP BY field;
DELETE FROM public.profile_items WHERE company_id=p_company_id AND confirmed_by_user=false;
INSERT INTO public.profile_items (company_id,field,value,kind,evidence_quote,source_url,retrieved_at,confirmed_by_user)
SELECT p_company_id, x.field, x.value, x.kind, x.evidence_quote, x.source_url, now(), false FROM jsonb_to_recordset(p_items) AS x(field text,value text,kind text,evidence_quote text,source_url text)
WHERE NOT EXISTS (SELECT 1 FROM public.profile_items i WHERE i.company_id=p_company_id AND i.field=x.field AND i.confirmed_by_user=true);
IF had_items THEN
INSERT INTO public.profile_changes(company_id, field, old_value, new_value)
SELECT p_company_id, COALESCE(n.field,o.field), o.value, n.value FROM
 (SELECT field, string_agg(value, ' | ' ORDER BY value) AS value FROM public.profile_items WHERE company_id=p_company_id AND confirmed_by_user=false GROUP BY field) n
 FULL OUTER JOIN _old_profile o ON o.field=n.field
WHERE n.value IS DISTINCT FROM o.value;
END IF;
END $$;
REVOKE ALL ON FUNCTION public.replace_generated_profile(uuid,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.replace_generated_profile(uuid,jsonb) TO anon, authenticated, service_role;

INSERT INTO public.companies(name, website_url, member_page_url)
SELECT v.name, v.url, v.member FROM (VALUES
 ('Njord X','https://www.njordx.com','https://www.bluesciencepark.se/medlem/njord-x/'),
 ('WIP','https://www.wip.se','https://www.bluesciencepark.se/medlem/wip/'),
 ('Kingspan BAGA','https://www.kingspan.com/se/sv/affarsenheter/Kingspan-water-energy/kingspan-baga/','https://www.bluesciencepark.se/medlem/kingspan-baga/')
) AS v(name,url,member)
WHERE NOT EXISTS (SELECT 1 FROM public.companies c WHERE lower(c.name)=lower(v.name));

INSERT INTO public.opportunities(external_key,type,title,summary,purpose,key_requirements,source_name,source_url,next_step_url,deadline_or_date,location_mode,audience,simulated) VALUES
 ('simulated:testing:0','testing','Sample: Maritime sensor testbed in Karlskrona harbour','Simulated example of an open water testbed for sensors, autonomous vessels and underwater communication.','Validate maritime products in real sea conditions','Test plan, safety assessment, booking two weeks ahead','Sample testing catalogue',NULL,NULL,'Open booking','in_person','SMEs and research groups',true),
 ('simulated:testing:1','testing','Sample: 5G and edge computing lab','Simulated example of a lab with private 5G network and edge servers for prototyping connected products.','Prototype and measure connected devices','Device ready for lab integration','Sample testing catalogue',NULL,NULL,'Open booking','in_person','Tech companies',true),
 ('simulated:testing:2','testing','Sample: Water treatment pilot environment','Simulated example of a pilot site for testing stormwater, wastewater and water reuse solutions at small scale.','Run pilots on water and environmental technology','Pilot proposal and environmental permit check','Sample testing catalogue',NULL,NULL,'Applications reviewed monthly','in_person','Water and cleantech companies',true),
 ('simulated:testing:3','testing','Sample: Digital twin and visualisation studio','Simulated example of a studio for building digital twins, VR walkthroughs and simulation of physical systems.','Demonstrate and simulate products before building','Data or CAD models of the system','Sample testing catalogue',NULL,NULL,'Open booking','online','Industry and public sector',true),
 ('simulated:news:0','news','Sample: Baltic blue economy investments rising','Simulated trend note: regional investments in ocean technology and sustainable shipping are increasing.',NULL,NULL,'Sample trend digest',NULL,NULL,'2026-11-10','unknown',NULL,true),
 ('simulated:news:1','news','Sample: New EU rules on water reuse take effect','Simulated news item: stricter requirements on water reuse create demand for monitoring and treatment solutions.',NULL,NULL,'Sample trend digest',NULL,NULL,'2026-11-05','unknown',NULL,true),
 ('simulated:news:2','news','Sample: Defence and security tech clusters expand','Simulated news item: Nordic defence innovation programmes are seeking dual-use technology partners.',NULL,NULL,'Sample trend digest',NULL,NULL,'2026-10-28','unknown',NULL,true)
ON CONFLICT (external_key) DO NOTHING;