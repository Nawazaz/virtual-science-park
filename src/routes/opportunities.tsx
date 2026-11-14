import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { useMemo, useState } from 'react';
import { RefreshCw, Sparkles, Bookmark, BookmarkCheck, ThumbsUp, ThumbsDown, Target } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ParkShell, PageHeader, EmptyState } from '@/components/park-shell';
import { companiesQuery, companyQuery, matchesQuery, opportunitiesQuery, sourcesQuery } from '@/lib/company-queries';
import { refreshSourcesFn, rescoreFn, setFeedback } from '@/lib/opportunities.functions';
import { runMatchClient } from '@/lib/build-profile-client';
import { useViewingAs } from '@/hooks/use-viewing-as';
import { OpportunityCard } from '@/components/park/opportunity-card';
import { HowMadeLink } from '@/components/park/how-made';
import { FloatingAsk } from '@/components/park/chat-panel';
import { fmtDate } from '@/components/park/evidence';
import { keyDate, daysUntil } from '@/lib/park-rules';
import { PrivateNotice } from '@/components/park/access';
const types=['all','funding','event','testing','news','saved'] as const;type T=typeof types[number];
const labels:Record<T,string>={all:'All',funding:'Funding',event:'Events',testing:'Testing',news:'News & trends',saved:'Saved'};
export const Route=createFileRoute('/opportunities')({
 validateSearch:(s:Record<string,unknown>):{type?:T}=>(types as readonly string[]).includes(s['type'] as string)?{type:s['type'] as T}:{},
 head:()=>({meta:[{title:'Opportunities | Virtual Science Park'},{name:'description',content:'Funding calls, events, testbeds and trends ranked as possible matches for a member company.'},{property:'og:title',content:'Opportunities | Virtual Science Park'},{property:'og:description',content:'Possible matches from Vinnova, EU Funding & Tenders and Blue Science Park.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),
 loader:({context})=>Promise.all([context.queryClient.ensureQueryData(companiesQuery),context.queryClient.ensureQueryData(opportunitiesQuery)]),
 component:Opportunities,
});
const sel='h-9 rounded-lg border bg-card px-2 text-sm';
function Opportunities(){
 const {type='all'}=Route.useSearch();const navigate=useNavigate({from:'/opportunities'});const {selected,companyId,isOwner,canSeePrivate}=useViewingAs();const qc=useQueryClient();
 const {data:opps=[]}=useQuery(opportunitiesQuery);const {data:sources=[]}=useQuery(sourcesQuery);
 const {data:m}=useQuery({...matchesQuery(companyId??''),enabled:!!companyId});const {data:company}=useQuery({...companyQuery(companyId??''),enabled:!!companyId});
 const refreshFn=useServerFn(refreshSourcesFn);const fbFn=useServerFn(setFeedback);const [busy,setBusy]=useState('');
 const [days,setDays]=useState('any');const [loc,setLoc]=useState('any');const [source,setSource]=useState('any');const [hideSim,setHideSim]=useState(false);const [sort,setSort]=useState<'match'|'deadline'>('match');
 const fb=(id:string)=>m?.feedback.find(f=>f.opportunity_id===id);
 const rematch=async(msg='Rankings updated')=>{if(!companyId)return;setBusy('Ranking possible matches…');try{await runMatchClient(companyId,setBusy);await Promise.all([qc.invalidateQueries({queryKey:['matches',companyId]}),qc.invalidateQueries({queryKey:['dashboard',companyId]})]);toast.success(msg);}catch(e){toast.error(e instanceof Error?e.message:'Matching failed');}finally{setBusy('');}};
 const refresh=async()=>{setBusy('Checking sources…');try{const r=await refreshFn();await Promise.all([qc.invalidateQueries({queryKey:['opportunities']}),qc.invalidateQueries({queryKey:['sources']})]);toast.success(r.map(x=>`${x.source}: ${x.found}`).join(' · '));}catch(e){toast.error(e instanceof Error?e.message:'Refresh failed');}finally{setBusy('');}};
 const rescore=useServerFn(rescoreFn);
 // Votes change only the code part of the score: re-rank instantly from stored AI scores; run the AI only if none are stored yet.
 const rerankByCode=async()=>{if(!companyId)return;try{const r=await rescore({data:{company_id:companyId}});if(r.needsAi)return rematch('Thanks, rankings updated');await Promise.all([qc.invalidateQueries({queryKey:['matches',companyId]}),qc.invalidateQueries({queryKey:['dashboard',companyId]})]);toast.success('Thanks, rankings updated');}catch(e){toast.error(e instanceof Error?e.message:'Re-ranking failed');}};
 const send=async(id:string,saved:boolean,vote:'up'|'down'|null,rerank:boolean)=>{if(!companyId)return;try{await fbFn({data:{company_id:companyId,opportunity_id:id,saved,vote}});await qc.invalidateQueries({queryKey:['matches',companyId]});if(rerank)void rerankByCode();}catch(e){toast.error(e instanceof Error?e.message:'Could not save');}};
 const items=company?.profile_items??[];
 const rows=useMemo(()=>{const byId=new Map((m?.matches??[]).filter(x=>x.opportunity).map(x=>[x.opportunity_id,x]));
  let list=opps.map(o=>({o,match:byId.get(o.id)}));
  if(type==='saved')list=list.filter(r=>fb(r.o.id)?.saved);else if(type!=='all')list=list.filter(r=>r.o.type===type);else list=list.filter(r=>r.match||r.o.type==='news');
  if(hideSim)list=list.filter(r=>!r.o.simulated);if(source!=='any')list=list.filter(r=>r.o.source_name===source);if(loc!=='any')list=list.filter(r=>r.o.location_mode===loc);
  if(days!=='any'){const n=Number(days);list=list.filter(r=>{const d=keyDate(r.o.deadline_or_date);return d!==null&&daysUntil(d)>=0&&daysUntil(d)<=n;});}
  const dk=(r:{o:{deadline_or_date:string|null}})=>keyDate(r.o.deadline_or_date)??'9999';
  return list.sort((a,b)=>sort==='deadline'?dk(a).localeCompare(dk(b)):(b.match?.score??-1)-(a.match?.score??-1));
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[opps,m,type,hideSim,source,loc,days,sort]);
 const allSources=[...new Set(opps.map(o=>o.source_name))].sort();
 const dot=(s:string)=>s==='ok'?{c:'bg-confirmed',l:'live'}:s==='empty'?{c:'bg-inferred',l:'empty → simulated'}:{c:'bg-simulated',l:'failed → simulated'};
 return <ParkShell>
  <PageHeader eyebrow={selected?`For ${selected.name}`:'Opportunities'} title="Opportunities" actions={<><Button variant="outline" disabled={!!busy} onClick={refresh}><RefreshCw/>Refresh sources</Button><Button disabled={!!busy||!companyId||!canSeePrivate} onClick={()=>rematch()}><Sparkles/>Re-run matching</Button></>}>Possible matches ranked from the company profile. Always check the call text yourself.</PageHeader>
  {busy&&<p role="status" className="mb-4 rounded-lg border bg-accent px-4 py-2 text-sm">{busy}</p>}
  <div className="surface mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 p-3 text-xs">{sources.map(s=>{const d=dot(s.status);return <span key={s.source_name} className="inline-flex items-center gap-1.5"><span className={`size-2 rounded-full ${d.c}`} aria-hidden/><span className="font-medium">{s.source_name}</span><span className="text-muted-foreground">{d.l} · checked {fmtDate(s.last_checked)} {new Date(s.last_checked).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}</span></span>;})}<span className="flex-1"/><HowMadeLink agent="Source scouts" companyId={null} label="How were sources checked?"/></div>
  <div role="tablist" aria-label="Opportunity type" className="mb-3 flex flex-wrap gap-1 rounded-lg border bg-card p-1">{types.map(t=><button role="tab" key={t} aria-selected={type===t} onClick={()=>navigate({search:p=>({...p,type:t})})} className={`rounded-md px-3 py-1.5 text-sm ${type===t?'bg-primary text-primary-foreground':'text-muted-foreground hover:text-foreground'}`}>{labels[t]}</button>)}</div>
  <div className="mb-6 flex flex-wrap items-center gap-2">
   <select aria-label="Deadline" className={sel} value={days} onChange={e=>setDays(e.target.value)}><option value="any">Any date</option><option value="30">Within 30 days</option><option value="90">Within 90 days</option></select>
   <select aria-label="Format" className={sel} value={loc} onChange={e=>setLoc(e.target.value)}><option value="any">Online or in person</option><option value="online">Online</option><option value="in_person">In person</option><option value="unknown">Not stated</option></select>
   <select aria-label="Source" className={sel} value={source} onChange={e=>setSource(e.target.value)}><option value="any">All sources</option>{allSources.map(s=><option key={s}>{s}</option>)}</select>
   <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={hideSim} onChange={e=>setHideSim(e.target.checked)} className="size-4 accent-[var(--primary)]"/>Hide simulated</label>
   <span className="flex-1"/><select aria-label="Sort" className={sel} value={sort} onChange={e=>setSort(e.target.value as 'match'|'deadline')}><option value="match">Sort: best match</option><option value="deadline">Sort: deadline</option></select>
  </div>
  {m?.locked&&selected&&<div className="mb-6"><PrivateNotice companyId={selected.id} name={selected.name}>Possible matches are ranked from the company's own profile, priorities and feedback, so only the company and park staff see them. The list below shows news only.</PrivateNotice></div>}
  {rows.length===0?<EmptyState icon={<Target/>} title={type==='saved'?'Nothing saved yet':'Nothing matches these filters'}>{type==='saved'?'Save opportunities to keep a shortlist.':companyId?'Loosen the filters, or build the profile and re-run matching.':'Choose a company in the top bar.'}</EmptyState>:
  <div className="space-y-3">{rows.map(({o,match})=>{const f=fb(o.id);const used=match?items.filter(i=>match.matched_profile_item_ids.includes(i.id)):undefined;
   return <OpportunityCard key={o.id} o={o} score={match?.score} reason={match?.reason} checkFirst={match?.check_first} nextStep={match?.next_step} companyId={companyId} usedItems={used} weakBasis={!!match&&(used?.length??0)===0} actions={isOwner?<><Button size="sm" variant={f?.saved?'default':'outline'} onClick={()=>send(o.id,!f?.saved,(f?.vote as 'up'|'down'|null)??null,false)}>{f?.saved?<BookmarkCheck/>:<Bookmark/>}{f?.saved?'Saved':'Save'}</Button><Button size="sm" variant={f?.vote==='up'?'default':'ghost'} aria-label="Helpful" aria-pressed={f?.vote==='up'} onClick={()=>send(o.id,!!f?.saved,f?.vote==='up'?null:'up',true)}><ThumbsUp/></Button><Button size="sm" variant={f?.vote==='down'?'default':'ghost'} aria-label="Not relevant" aria-pressed={f?.vote==='down'} onClick={()=>send(o.id,!!f?.saved,f?.vote==='down'?null:'down',true)}><ThumbsDown/></Button></>:undefined}/>;})}</div>}
  <FloatingAsk companyId={isOwner?companyId:null}/>
 </ParkShell>;
}
