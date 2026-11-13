import { ArrowRight, CalendarDays, MapPin, Wifi, HelpCircle, Users, AlertTriangle } from 'lucide-react';
import { typeLabels } from '@/lib/opportunity-rules';
import { keyDate, daysUntil } from '@/lib/park-rules';
import { EvidenceBadge, MatchScore, SourceChip, kindOf, fmtDate } from './evidence';
import { HowMadeLink } from './how-made';
import { fieldLabels } from '@/lib/profile-rules';
import type { ReactNode } from 'react';
export type OppLite={id:string;type:string;title:string;deadline_or_date:string|null;source_name:string;source_url:string|null;simulated:boolean;summary?:string|undefined;purpose?:string|null|undefined;key_requirements?:string|null|undefined;next_step_url?:string|null|undefined;retrieved_at?:string|undefined;location_mode?:string|undefined;audience?:string|null|undefined};
type UsedItem={id:string;field:string;value:string;kind:string;confirmed_by_user:boolean};
export function TypePill({type}:{type:string}){return <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-foreground">{typeLabels[type]??type}</span>;}
function Location({mode}:{mode?:string|undefined}){const m=mode==='online'?{I:Wifi,l:'Online'}:mode==='in_person'?{I:MapPin,l:'In person'}:{I:HelpCircle,l:'Not stated'};return <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><m.I size={13} aria-hidden/>{m.l}</span>;}
function KeyDate({text}:{text:string|null}){if(!text)return null;const iso=keyDate(text);const d=iso?daysUntil(iso):null;const urgent=d!==null&&d>=0&&d<14;
 return <span className={`inline-flex items-center gap-1 text-xs ${urgent?'font-semibold text-destructive':'text-muted-foreground'}`}><CalendarDays size={13} aria-hidden/>{text}{urgent&&` · ${d} day${d===1?'':'s'} left`}</span>;}
const Block=({title,children,tone}:{title:string;children:ReactNode;tone?:'check'})=><div className={tone==='check'?'rounded-lg border border-inferred/50 bg-inferred/5 p-3':''}><p className={`text-xs font-semibold ${tone==='check'?'ink-inferred':'text-foreground'}`}>{title}</p><div className="text-sm text-muted-foreground">{children}</div></div>;
export function OpportunityCard({o,score,reason,nextStep,checkFirst,companyId,usedItems,actions,compact}:{o:OppLite;score?:number|undefined;reason?:string|undefined;nextStep?:string|undefined;checkFirst?:string|undefined;companyId?:string|null|undefined;usedItems?:UsedItem[]|undefined;actions?:ReactNode;compact?:boolean}){
 const ranked=score!==undefined;
 return <article className="surface fade-in p-5">
  <div className="flex gap-4"><div className="min-w-0 flex-1 space-y-2">
   <div className="flex flex-wrap items-center gap-2"><TypePill type={o.type}/>{o.simulated&&<EvidenceBadge kind="simulated"/>}{o.type!=='news'&&<Location mode={o.location_mode}/>}</div>
   <h3 className="font-display text-lg leading-snug">{o.title}</h3>
   <div className="flex flex-wrap items-center gap-x-3 gap-y-1"><span className="text-xs text-muted-foreground">{o.source_name}</span><KeyDate text={o.deadline_or_date}/>{o.audience&&<span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Users size={13} aria-hidden/>Who it’s for: {o.audience}</span>}</div>
  </div>{ranked&&<MatchScore score={score}/>}</div>
  <div className="mt-3 space-y-3">
   {ranked&&<div><p className="text-xs font-semibold">Why it may fit</p>{reason&&<p className="text-sm">{compact?reason.split(/(?<=\.)\s/)[0]:reason}</p>}
    {!compact&&usedItems&&(usedItems.length?<div className="mt-2 flex flex-wrap gap-1.5">{usedItems.map(i=><span key={i.id} className="inline-flex max-w-full items-center gap-1.5 rounded-lg border bg-background/70 py-0.5 pl-2 pr-1 text-xs"><span className="truncate" title={`${fieldLabels[i.field]??i.field}: ${i.value}`}>{i.value.length>48?i.value.slice(0,47)+'…':i.value}</span><EvidenceBadge kind={kindOf(i)}/></span>)}</div>:<span className="mt-2 inline-flex items-center gap-1 rounded-full border border-missing/60 px-2 py-0.5 text-[11px] font-semibold ink-missing"><AlertTriangle size={12} aria-hidden/>Weak basis</span>)}</div>}
   {!compact&&o.type==='funding'&&<>{(o.purpose||o.summary)&&<Block title="Purpose">{o.purpose??o.summary}</Block>}{o.key_requirements&&<Block title="Key requirements to check">{o.key_requirements}</Block>}<p className="text-xs italic text-muted-foreground">Possible match, not confirmed eligibility.</p></>}
   {!compact&&o.type==='testing'&&<><Block title="What you could test">{o.purpose??o.summary}</Block><Block title="How to take the next step">{o.key_requirements?`${o.key_requirements}. `:''}{nextStep??'Contact the testbed host to discuss a booking.'}</Block></>}
   {!compact&&o.type==='news'&&<><Block title="What changed">{o.summary}</Block><Block title="Why it could matter">{reason??o.purpose??'Could shift demand or requirements in your markets.'}</Block></>}
   {!compact&&o.type==='event'&&o.summary&&!reason&&<p className="line-clamp-3 text-sm text-muted-foreground">{o.summary}</p>}
   {!compact&&checkFirst&&<Block title="Check first" tone="check">{checkFirst}</Block>}
   <div className="flex flex-wrap items-center gap-2 pt-1">
    {nextStep&&o.type!=='testing'&&(o.next_step_url??o.source_url?<a href={(o.next_step_url??o.source_url)!} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90" title={nextStep}><ArrowRight size={14} aria-hidden/>Next step</a>:<span className="inline-flex items-center gap-1 text-xs font-medium text-primary"><ArrowRight size={14}/>{nextStep}</span>)}
    <SourceChip url={o.source_url} retrieved={o.retrieved_at} label={o.source_name}/>{ranked&&companyId&&<HowMadeLink agent="Matcher" companyId={companyId} opportunityId={o.id}/>}
   </div>
   {nextStep&&o.type!=='testing'&&!compact&&<p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Next step:</span> {nextStep}</p>}
   {actions&&<div className="flex flex-wrap gap-2 border-t pt-3">{actions}</div>}
  </div>
 </article>;
}
export { fmtDate };
