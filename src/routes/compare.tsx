import { createFileRoute, Link } from '@tanstack/react-router';
import { useQueries, useSuspenseQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { ParkShell, PageHeader } from '@/components/park-shell';
import { companiesQuery, matchesQuery, companyQuery } from '@/lib/company-queries';
import { Ring, EvidenceBadge, kindOf } from '@/components/park/evidence';
import { TypePill } from '@/components/park/opportunity-card';
export const Route=createFileRoute('/compare')({
 head:()=>({meta:[{title:'Compare | Virtual Science Park'},{name:'description',content:'Same opportunities, different profiles, different rankings: compare member companies side by side.'},{property:'og:title',content:'Compare | Virtual Science Park'},{property:'og:description',content:'See how different company profiles get different opportunity rankings.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),
 loader:({context})=>context.queryClient.ensureQueryData(companiesQuery),
 component:Compare,
});
const defaults=['Njord X','WIP','Kingspan BAGA'];
function Compare(){
 const {data}=useSuspenseQuery(companiesQuery);const companies=[...data].sort((a,b)=>a.name.localeCompare(b.name));
 const init=defaults.map(n=>companies.find(c=>c.name===n)?.id).filter((x):x is string=>!!x);
 const [ids,setIds]=useState<string[]>(init.length>=2?init:companies.slice(0,3).map(c=>c.id));
 const matches=useQueries({queries:ids.map(id=>matchesQuery(id))});const profiles=useQueries({queries:ids.map(id=>companyQuery(id))});
 const tops=ids.map((_,i)=>(matches[i]?.data?.matches??[]).filter(m=>m.opportunity).slice(0,5));
 const fullRank=ids.map((_,i)=>new Map((matches[i]?.data?.matches??[]).map((m,r)=>[m.opportunity_id,r+1])));
 const count=new Map<string,number>();tops.forEach(t=>t.forEach(m=>count.set(m.opportunity_id,(count.get(m.opportunity_id)??0)+1)));
 return <ParkShell><PageHeader eyebrow="Compare" title="Same opportunities, different profiles, different rankings.">Pick two or three members. Highlighted items appear in more than one top 5; the rank shown for others is where each company ranked that same item.</PageHeader>
  <div className={`grid gap-4 ${ids.length===3?'lg:grid-cols-3':'lg:grid-cols-2'}`}>{ids.map((id,i)=>{const p=profiles[i]?.data;const tech=(p?.profile_items??[]).filter(x=>x.field==='technologies'&&x.kind!=='missing').slice(0,4);
   return <section key={i} className="surface p-4">
    <div className="mb-3 flex gap-2"><select aria-label={`Company ${i+1}`} className="h-10 min-w-0 flex-1 rounded-lg border bg-background px-3 text-sm" value={id} onChange={e=>setIds(ids.map((x,j)=>j===i?e.target.value:x))}>{companies.map(c=><option key={c.id} value={c.id} disabled={ids.includes(c.id)&&c.id!==id}>{c.name}</option>)}</select>{ids.length>2&&<button aria-label="Remove column" className="grid size-10 place-items-center rounded-lg border hover:border-primary" onClick={()=>setIds(ids.filter((_,j)=>j!==i))}><X size={16}/></button>}</div>
    <p className="eyebrow mb-2">Key technologies</p>{tech.length?<ul className="mb-4 space-y-1">{tech.map(t=><li key={t.id} className="flex items-start justify-between gap-2 text-sm"><span>{t.value}</span><EvidenceBadge kind={kindOf(t)}/></li>)}</ul>:<p className="mb-4 text-sm text-muted-foreground">No technologies found yet.</p>}
    <p className="eyebrow mb-2">Top 5 possible matches</p>
    {matches[i]?.isLoading?<p className="text-sm text-muted-foreground">Loading…</p>:tops[i]!.length===0?<p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">No possible matches yet. Run matching on Opportunities.</p>:
    <ol className="space-y-2">{tops[i]!.map((m,r)=>{const shared=(count.get(m.opportunity_id)??0)>1;const others=ids.map((_,j)=>j===i?null:fullRank[j]?.get(m.opportunity_id)).filter((x):x is number=>x!==null&&x!==undefined);
     return <li key={m.opportunity_id} className={`rounded-lg border p-3 ${shared?'border-primary bg-accent/60':'bg-background/60'}`}><div className="flex items-start gap-3"><span className="font-display text-xl text-muted-foreground">{r+1}</span><div className="min-w-0 flex-1"><div className="mb-1 flex flex-wrap gap-1"><TypePill type={m.opportunity!.type}/>{m.opportunity!.simulated&&<EvidenceBadge kind="simulated"/>}{shared&&<span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">Shared</span>}</div><p className="text-sm font-medium leading-snug">{m.opportunity!.title}</p><p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{m.reason}</p>{others.length>0&&<p className="mt-1 text-[11px] text-muted-foreground">Ranked {others.map(o=>`#${o}`).join(', ')} for the other{others.length>1?'s':''}</p>}</div><Ring value={m.score} size={42} stroke={4} label="Possible match"/></div></li>;})}</ol>}
    <Link to="/opportunities" search={{company:id}} className="mt-3 inline-block text-sm font-medium text-primary hover:underline">All possible matches</Link>
   </section>;})}</div>
  {ids.length<3&&companies.length>ids.length&&<button className="mt-4 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:border-primary" onClick={()=>setIds([...ids,companies.find(c=>!ids.includes(c.id))!.id])}><Plus size={15}/>Add a third company</button>}
 </ParkShell>;
}
