import { z } from 'zod';
export const fields = ['what_it_does','products_services','technologies','application_areas','markets_customers','geography','projects_collaborations','possible_interests'] as const;
export const fieldLabels: Record<string,string> = {what_it_does:'What it does',products_services:'Offerings',technologies:'Technologies & expertise',application_areas:'Application areas',markets_customers:'Markets & customers',geography:'Geography',projects_collaborations:'Projects, priorities & collaborations',possible_interests:'Possibly relevant topics'};
export const priorities = ['funding','events','testing','partners'] as const;
export type Field = typeof fields[number];
export type GeneratedItem = {field: Field; value: string; kind:'fact'|'inferred'|'missing'; evidence_quote:string|null; source_url:string|null};
export type PageText = {url:string;text:string};
export const companySchema = z.object({name:z.string().trim().min(1).max(120),website_url:z.string().url().max(2048).refine(v=>['http:','https:'].includes(new URL(v).protocol),'Use an http or https website'),member_page_url:z.string().url().max(2048).refine(v=>['http:','https:'].includes(new URL(v).protocol),'Use an http or https page').optional()});
export const itemSchema = z.object({id:z.string().uuid().optional(),company_id:z.string().uuid(),field:z.enum(fields),value:z.string().trim().min(1).max(5000)});
export function validateEvidence(items: GeneratedItem[], pages:PageText[]): GeneratedItem[] {
 const checked = items.map(item=> {
  if(item.field==='possible_interests') return {...item,kind:'inferred' as const};
  if(item.kind!=='fact') return item;
  const page=pages.find(p=>p.url===item.source_url);
  const quote=item.evidence_quote?.trim();
  const valid=quote && quote.split(/\s+/).length<=25 && page?.text.includes(quote);
  return valid? item : {...item,kind:'inferred' as const};
 });
 for(const field of fields) if(!checked.some(i=>i.field===field)) checked.push({field,value:'Not found on the reviewed pages.',kind:field==='possible_interests'?'inferred':'missing',evidence_quote:null,source_url:null});
 return checked;
}
/** A company save. If the text changed, the old quote and link no longer support it, so they are dropped ("Added by company"). */
export function confirmedItemUpdate(field:Field,newValue:string,old:{value:string}|null){
 const changed=!old||old.value.trim()!==newValue.trim();
 return {field,value:newValue,confirmed_by_user:true,kind:'fact' as const,...(changed?{evidence_quote:null,source_url:null}:{})};
}
export function mergeConfirmed(generated:GeneratedItem[], confirmed:{field:string;confirmed_by_user:boolean}[]) { return generated.filter(item=>!confirmed.some(c=>c.confirmed_by_user&&c.field===item.field)); }

/** Deterministic checks reported to agent_runs after a profile build. */
export function evidenceChecks(raw:GeneratedItem[],checked:GeneratedItem[]){
 const rawFacts=raw.filter(i=>i.kind==='fact'&&i.field!=='possible_interests').length;
 const kept=checked.filter(i=>i.kind==='fact').length;const downgraded=rawFacts-kept;
 const filled=checked.length-raw.length;
 return [
  {name:'Quotes found on source page',passed:true,detail:`${kept} of ${rawFacts} facts had an exact quote on the cited page`},
  {name:'Unverified facts downgraded to Inferred',passed:true,detail:downgraded?`${downgraded} item${downgraded===1?'':'s'} downgraded`:'No downgrades needed'},
  {name:'Missing fields filled',passed:true,detail:filled?`${filled} field${filled===1?'':'s'} marked Missing`:'All fields had content'},
 ];
}
