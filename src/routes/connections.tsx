import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { topicLabel } from '@/lib/knowledge-graph';
import { useQuery } from '@tanstack/react-query';
import { Network } from 'lucide-react';
import { ParkShell, PageHeader, EmptyState } from '@/components/park-shell';
import { allConnectionsQuery, connectionsQuery } from '@/lib/company-queries';
import { useViewingAs } from '@/hooks/use-viewing-as';
import { SourceChip, EvidenceBadge, kindOf } from '@/components/park/evidence';
export const Route=createFileRoute('/connections')({
 head:()=>({meta:[{title:'Connections | Virtual Science Park'},{name:'description',content:'Possible connections between member companies based on shared public topics.'},{property:'og:title',content:'Connections | Virtual Science Park'},{property:'og:description',content:'Which members share technologies, markets or application areas.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),
 component:Connections,
});
const note='Suggested on public information only. Neither company has expressed interest.';
type It={id:string;value:string;kind:string;confirmed_by_user:boolean};
const Items=({items}:{items:It[]})=><ul className="space-y-1.5">{items.map(i=><li key={i.id} className="flex items-start justify-between gap-2 text-xs"><span>{i.value.length>90?i.value.slice(0,89)+'…':i.value}</span><EvidenceBadge kind={kindOf(i)}/></li>)}</ul>;
type Neighbour={id:string;name:string;basis:string[];named:string[]};
const short=(s:string,n:number)=>s.length>n?s.slice(0,n-1)+'…':s;
/**
 * Knowledge graph around one company: the company in the middle, its topics on the inner ring, and its
 * best-connected members on the outer ring. A line from a member to a topic means both have that topic;
 * a dashed line straight to the middle means one profile names the other.
 */
function EgoGraph({name,topics,neighbours}:{name:string;topics:string[];neighbours:Neighbour[]}){
 const navigate=useNavigate();const W=680,H=460,cx=W/2,cy=H/2;
 const open=(id:string)=>navigate({to:'/companies/$companyId',params:{companyId:id},search:true});
 const tp=new Map(topics.map((t,i)=>{const a=(2*Math.PI*i)/Math.max(topics.length,1)-Math.PI/2;return [t,{x:cx+150*Math.cos(a),y:cy+92*Math.sin(a)}];}));
 const np=new Map(neighbours.map((n,i)=>{const a=(2*Math.PI*(i+0.5))/Math.max(neighbours.length,1)-Math.PI/2;return [n.id,{x:cx+275*Math.cos(a),y:cy+190*Math.sin(a)}];}));
 return <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Knowledge graph: ${name}, its topics and the members that share them`}>
  {topics.map(t=>{const p=tp.get(t)!;return <line key={'c'+t} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="var(--primary)" strokeOpacity={0.45} strokeWidth={1.5}/>;})}
  {neighbours.flatMap(n=>n.basis.filter(b=>tp.has(b)).map(b=>{const a=np.get(n.id)!,p=tp.get(b)!;return <line key={n.id+b} x1={a.x} y1={a.y} x2={p.x} y2={p.y} stroke="var(--border)" strokeWidth={1}/>;}))}
  {neighbours.filter(n=>n.named.length).map(n=>{const a=np.get(n.id)!;return <line key={'n'+n.id} x1={cx} y1={cy} x2={a.x} y2={a.y} stroke="var(--primary)" strokeWidth={2} strokeDasharray="5 4"/>;})}
  {topics.map(t=>{const p=tp.get(t)!;const label=short(t,24);const w=label.length*6.2+16;return <g key={t}><rect x={p.x-w/2} y={p.y-11} width={w} height={22} rx={11} fill="var(--accent)" stroke="var(--primary)" strokeOpacity={0.4}/><text x={p.x} y={p.y+4} textAnchor="middle" fontSize="11" fill="var(--foreground)">{label}</text></g>;})}
  {neighbours.map(n=>{const p=np.get(n.id)!;return <g key={n.id} role="link" tabIndex={0} aria-label={`Open ${n.name}`} className="cursor-pointer" onClick={()=>open(n.id)} onKeyDown={e=>{if(e.key==='Enter')open(n.id);}}>
   <circle cx={p.x} cy={p.y} r={9} fill="var(--card)" stroke="var(--primary)" strokeWidth={1.5}/>
   <text x={p.x} y={p.y+(p.y<cy?-14:22)} textAnchor="middle" fontSize="12" fill="var(--foreground)">{short(n.name,22)}</text></g>;})}
  <circle cx={cx} cy={cy} r={30} fill="var(--primary)"/>
  <text x={cx} y={cy+4} textAnchor="middle" fontSize="12" fontWeight={600} fill="var(--primary-foreground)">{short(name,12)}</text>
 </svg>;}
/** Every topic in the park, with the members that have it. Click a topic to list them. */
function TopicMap({topics,nodes}:{topics:{id:string;label:string;category:string;companies:string[]}[];nodes:{id:string;name:string}[]}){
 const [open,setOpen]=useState<string|null>(null);const nameOf=(id:string)=>nodes.find(n=>n.id===id)?.name??'';const sel=topics.find(t=>t.id===open);
 return <div>{(['technology','sector'] as const).map(cat=><div key={cat} className="mb-3"><p className="eyebrow mb-2">{cat==='technology'?'Technologies':'Sectors and markets'}</p><div className="flex flex-wrap gap-2">
   {topics.filter(t=>t.category===cat).sort((a,b)=>b.companies.length-a.companies.length).map(t=><button key={t.id} type="button" aria-pressed={open===t.id} onClick={()=>setOpen(open===t.id?null:t.id)} className={`rounded-full border px-3 py-1 text-xs hover:border-primary ${open===t.id?'border-primary bg-accent':'bg-card'}`}>{t.label} <span className="text-muted-foreground">{t.companies.length}</span></button>)}
  </div></div>)}
  {sel&&<p className="mt-2 rounded-lg bg-muted p-3 text-sm"><span className="font-medium">{sel.label}:</span> {sel.companies.map(nameOf).sort().join(', ')}</p>}</div>;}
function Connections(){const {selected,companyId}=useViewingAs();const {data:mine=[]}=useQuery({...connectionsQuery(companyId??''),enabled:!!companyId});const {data:all}=useQuery(allConnectionsQuery);
 const myTopics=(all?.nodes.find(n=>n.id===companyId)?.topics??[]).map(topicLabel);
 return <ParkShell><PageHeader eyebrow="Network" title="Possible connections">{note}</PageHeader>
  <section className="surface mb-6 p-4">{selected&&<EgoGraph name={selected.name} topics={myTopics} neighbours={mine.slice(0,8)}/>}<p className="mt-2 text-xs text-muted-foreground">Knowledge graph for {selected?.name??'…'}: its topics (inner ring) come from facts on its profile; members on the outer ring share those topics. A dashed line means one profile names the other. Click a member to open its profile.</p></section>
  <section className="surface mb-8 p-4"><h2 className="mb-3 font-display text-xl">Topics across the park</h2><TopicMap topics={all?.topics??[]} nodes={all?.nodes??[]}/></section>
  <section><h2 className="mb-4 font-display text-2xl">For {selected?.name??'…'}</h2>{mine.length===0?<EmptyState icon={<Network/>} title="No overlaps yet">Connections appear when built profiles share technologies, application areas or markets.</EmptyState>:
   <div className="space-y-4">{mine.map(c=><article key={c.id} className="surface p-5"><div className="flex flex-wrap items-center justify-between gap-2"><Link to="/companies/$companyId" params={{companyId:c.id}} search={true} className="font-display text-xl hover:text-primary">{c.name}</Link><SourceChip url={c.website_url}/></div>
    <p className="mt-1 text-sm">Shared topics: {c.basis.map(b=><span key={b} className="ml-1 rounded-full bg-muted px-2 py-0.5 text-[11px]">{b}</span>)}</p>
    {c.named.length>0&&<p className="mt-2 text-sm"><span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-primary">Named in a profile</span> “{c.named[0]}”</p>}
    <div className="mt-4 grid gap-4 md:grid-cols-2"><div><p className="eyebrow mb-2">{selected?.name}</p><Items items={c.mine}/></div><div><p className="eyebrow mb-2">{c.name}</p><Items items={c.theirs}/></div></div>
    <p className="mt-4 border-t pt-3 text-xs text-muted-foreground">{note}</p></article>)}</div>}</section>
 </ParkShell>;}
