CREATE OR REPLACE FUNCTION public.replace_generated_profile(p_company_id uuid, p_items jsonb) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE old_map jsonb; had_items boolean;
BEGIN
PERFORM id FROM public.companies WHERE id=p_company_id FOR UPDATE;
SELECT COALESCE(jsonb_object_agg(field, v), '{}'::jsonb) INTO old_map FROM (SELECT field, string_agg(value, ' | ' ORDER BY value) AS v FROM public.profile_items WHERE company_id=p_company_id AND confirmed_by_user=false GROUP BY field) s;
had_items := old_map <> '{}'::jsonb;
DELETE FROM public.profile_items WHERE company_id=p_company_id AND confirmed_by_user=false;
INSERT INTO public.profile_items (company_id,field,value,kind,evidence_quote,source_url,retrieved_at,confirmed_by_user)
SELECT p_company_id, x.field, x.value, x.kind, x.evidence_quote, x.source_url, now(), false FROM jsonb_to_recordset(p_items) AS x(field text,value text,kind text,evidence_quote text,source_url text)
WHERE NOT EXISTS (SELECT 1 FROM public.profile_items i WHERE i.company_id=p_company_id AND i.field=x.field AND i.confirmed_by_user=true);
IF had_items THEN
INSERT INTO public.profile_changes(company_id, field, old_value, new_value)
SELECT p_company_id, COALESCE(n.field,o.key), o.value, n.v FROM
 (SELECT field, string_agg(value, ' | ' ORDER BY value) AS v FROM public.profile_items WHERE company_id=p_company_id AND confirmed_by_user=false GROUP BY field) n
 FULL OUTER JOIN jsonb_each_text(old_map) o ON o.key=n.field
WHERE n.v IS DISTINCT FROM o.value;
END IF;
END $$;
REVOKE ALL ON FUNCTION public.replace_generated_profile(uuid,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.replace_generated_profile(uuid,jsonb) TO anon, authenticated, service_role;