import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
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
function Graph({nodes,pairs,current}:{nodes:{id:string;name:string;built:boolean}[];pairs:{a:{id:string};b:{id:string};basis:string[]}[];current:string|null}){
 const navigate=useNavigate();const W=640,H=380,R=145;const pos=new Map(nodes.map((n,i)=>{const a=(2*Math.PI*i)/Math.max(nodes.length,1)-Math.PI/2;return [n.id,{x:W/2+R*1.6*Math.cos(a),y:H/2+R*Math.sin(a)}];}));
 return <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Network of member companies; lines show shared topics">
  {pairs.map(p=>{const a=pos.get(p.a.id),b=pos.get(p.b.id);if(!a||!b)return null;const hot=p.a.id===current||p.b.id===current;return <line key={p.a.id+p.b.id} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={hot?'var(--primary)':'var(--border)'} strokeWidth={Math.min(1+p.basis.length,6)} strokeLinecap="round"/>;})}
  {nodes.map(n=>{const p=pos.get(n.id)!;const me=n.id===current;return <g key={n.id} role="link" tabIndex={0} aria-label={`Open ${n.name}`} className="cursor-pointer" onClick={()=>navigate({to:'/companies/$companyId',params:{companyId:n.id},search:true})} onKeyDown={e=>{if(e.key==='Enter')navigate({to:'/companies/$companyId',params:{companyId:n.id},search:true});}}>
   <circle cx={p.x} cy={p.y} r={me?24:18} fill={me?'var(--primary)':n.built?'var(--card)':'var(--muted)'} stroke="var(--primary)" strokeWidth={1.5} strokeDasharray={n.built?undefined:'3 3'}/>
   <text x={p.x} y={p.y+(me?40:34)} textAnchor="middle" fontSize="12" fill="var(--foreground)">{n.name}</text></g>;})}
 </svg>;}
function Connections(){const {selected,companyId}=useViewingAs();const {data:mine=[]}=useQuery({...connectionsQuery(companyId??''),enabled:!!companyId});const {data:all}=useQuery(allConnectionsQuery);
 return <ParkShell><PageHeader eyebrow="Network" title="Possible connections">{note}</PageHeader>
  <section className="surface mb-8 p-4"><Graph nodes={all?.nodes??[]} pairs={all?.pairs??[]} current={companyId}/><p className="mt-2 text-xs text-muted-foreground">Click a company to open its profile. Thicker lines mean more shared topics; dashed circles have no profile yet.</p></section>
  <section><h2 className="mb-4 font-display text-2xl">For {selected?.name??'…'}</h2>{mine.length===0?<EmptyState icon={<Network/>} title="No overlaps yet">Connections appear when built profiles share technologies, application areas or markets.</EmptyState>:
   <div className="space-y-4">{mine.map(c=><article key={c.id} className="surface p-5"><div className="flex flex-wrap items-center justify-between gap-2"><Link to="/companies/$companyId" params={{companyId:c.id}} search={true} className="font-display text-xl hover:text-primary">{c.name}</Link><SourceChip url={c.website_url}/></div>
    <p className="mt-1 text-sm">Shared topics: {c.basis.map(b=><span key={b} className="ml-1 rounded-full bg-muted px-2 py-0.5 text-[11px]">{b}</span>)}</p>
    <div className="mt-4 grid gap-4 md:grid-cols-2"><div><p className="eyebrow mb-2">{selected?.name}</p><Items items={c.mine}/></div><div><p className="eyebrow mb-2">{c.name}</p><Items items={c.theirs}/></div></div>
    <p className="mt-4 border-t pt-3 text-xs text-muted-foreground">{note}</p></article>)}</div>}</section>
 </ParkShell>;}
