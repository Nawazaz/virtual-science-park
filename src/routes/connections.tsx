import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Maximize2, Minimize2 } from 'lucide-react';
import { TopicGlobe, type GlobeFocus } from '@/components/park/topic-globe';
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
type TopicRow={id:string;label:string;category:string;companies:string[]};
/** Every topic in the park as chips. Selecting one highlights it on the globe and lists its members. */
function TopicMap({topics,selected,onSelect}:{topics:TopicRow[];selected:string|null;onSelect:(id:string|null)=>void}){
 return <div>{(['technology','sector'] as const).map(cat=><div key={cat} className="mb-3"><p className="eyebrow mb-2">{cat==='technology'?'Technologies':'Sectors and markets'}</p><div className="flex flex-wrap gap-2">
   {topics.filter(t=>t.category===cat).sort((a,b)=>b.companies.length-a.companies.length).map(t=><button key={t.id} type="button" aria-pressed={selected===t.id} onClick={()=>onSelect(selected===t.id?null:t.id)} className={`rounded-full border px-3 py-1 text-xs hover:border-primary ${selected===t.id?'border-primary bg-accent':'bg-card'}`}>{t.label} <span className="text-muted-foreground">{t.companies.length}</span></button>)}
  </div></div>)}</div>;}
/** What the globe has selected: a topic's members, or a company's topics and best matches. */
function FocusInfo({focus,all,onSelect}:{focus:GlobeFocus;all:{nodes:{id:string;name:string;topics:string[]}[];topics:TopicRow[];pairs:{a:{id:string;name:string};b:{id:string;name:string};basis:string[];named:string[]}[]}|undefined;onSelect:(f:GlobeFocus)=>void}){
 if(!focus||!all)return <p className="text-sm text-muted-foreground">Drag to turn the globe, scroll to zoom. Click a topic to light up its members, or a member to light up its topics.</p>;
 const nameOf=(id:string)=>all.nodes.find(n=>n.id===id)?.name??'';
 if(focus.kind==='topic'){const t=all.topics.find(x=>x.id===focus.id);if(!t)return null;
  return <p className="text-sm"><span className="font-medium">{t.label}</span> · {t.companies.length} members: {t.companies.map(id=><button key={id} type="button" onClick={()=>onSelect({kind:'company',id})} className="mr-1 text-primary hover:underline">{nameOf(id)}</button>)}</p>;}
 const n=all.nodes.find(x=>x.id===focus.id);if(!n)return null;
 const links=all.pairs.filter(p=>p.a.id===n.id||p.b.id===n.id).slice(0,4);
 return <div className="flex flex-wrap items-start justify-between gap-3 text-sm"><div>
   <p><span className="font-medium">{n.name}</span> · {n.topics.map(topicLabel).join(', ')||'no topics yet'}</p>
   {links.length>0&&<p className="mt-1 text-muted-foreground">Best matches: {links.map(p=>{const o=p.a.id===n.id?p.b:p.a;return <button key={o.id} type="button" onClick={()=>onSelect({kind:'company',id:o.id})} className="mr-2 text-primary hover:underline">{o.name}{p.named.length?' (named)':''}</button>;})}</p>}
  </div><Link to="/companies/$companyId" params={{companyId:n.id}} search={true} className="shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium hover:border-primary">Open profile</Link></div>;}
function Connections(){const {selected,companyId}=useViewingAs();const {data:mine=[]}=useQuery({...connectionsQuery(companyId??''),enabled:!!companyId});const {data:all}=useQuery(allConnectionsQuery);
 const [focus,setFocus]=useState<GlobeFocus>(null);
 useEffect(()=>{setFocus(companyId?{kind:'company',id:companyId}:null);},[companyId]);
 const named=(all?.pairs??[]).filter(p=>p.named.length).map(p=>[p.a.id,p.b.id] as [string,string]);
 // Full screen: the browser's own full screen where it exists, otherwise the panel covers the window (e.g. iPhone). Esc leaves both.
 const panel=useRef<HTMLElement>(null);const [full,setFull]=useState(false);const [nativeFull,setNativeFull]=useState(false);
 useEffect(()=>{const sync=()=>{const on=document.fullscreenElement===panel.current;setNativeFull(on);setFull(on);};const esc=(e:KeyboardEvent)=>{if(e.key==='Escape')setFull(f=>f&&!!document.fullscreenElement);};
  document.addEventListener('fullscreenchange',sync);window.addEventListener('keydown',esc);return ()=>{document.removeEventListener('fullscreenchange',sync);window.removeEventListener('keydown',esc);};},[]);
 const toggleFull=()=>{if(document.fullscreenElement){void document.exitFullscreen();return;}if(full){setFull(false);return;}
  const el=panel.current;if(!el?.requestFullscreen){setFull(true);return;}
  el.requestFullscreen().catch(()=>setFull(true));
  // Some embedded browsers neither enter full screen nor refuse; cover the window instead after a moment.
  window.setTimeout(()=>{if(!document.fullscreenElement)setFull(true);},500);};
 // In fallback full screen the panel renders on <body>, so the page layout (animations, sidebar) can't box it in.
 const globePanel=<section ref={panel} className={`surface p-4 ${full?'':'mb-6'} ${full?'flex flex-col bg-background':''} ${full&&!nativeFull?'fixed inset-0 z-[60] m-0 overflow-auto rounded-none':''}`}>
   <div className="mb-2 flex items-center justify-between gap-2"><p className="text-sm text-muted-foreground">Knowledge graph · {all?.nodes.length??0} members, {all?.topics.length??0} topics</p>
    <button type="button" onClick={toggleFull} className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-xs font-medium hover:border-primary" aria-pressed={full}>{full?<Minimize2 size={14} aria-hidden/>:<Maximize2 size={14} aria-hidden/>}{full?'Exit full screen':'Full screen'}</button></div>
   {all&&<TopicGlobe topics={all.topics} companies={all.nodes} named={named} focus={focus} onSelect={setFocus} height={full?'calc(100vh - 190px)':460}/>}
   <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground"><span><span className="mr-1 inline-block size-2.5 rounded-full bg-[#1D9E75]"/>Member</span><span><span className="mr-1 inline-block size-2.5 rounded-full bg-[#7F77DD]"/>Technology topic</span><span><span className="mr-1 inline-block size-2.5 rounded-full bg-[#D85A30]"/>Sector topic</span><span><span className="mr-1 inline-block h-0.5 w-4 bg-[#EF9F27] align-middle"/>Named in a profile</span>{focus&&<button type="button" onClick={()=>setFocus(null)} className="ml-auto text-primary hover:underline">Clear selection</button>}</div>
   <div className="mt-3 border-t pt-3"><FocusInfo focus={focus} all={all} onSelect={setFocus}/></div>
   <p className="mt-2 text-xs text-muted-foreground">Topics come from facts on each member's profile; a member sits next to its topics. Built by fixed code from public information.</p></section>;
 return <ParkShell><PageHeader eyebrow="Network" title="Possible connections">{note}</PageHeader>
  {full&&!nativeFull?createPortal(globePanel,document.body):globePanel}
  <section className="surface mb-8 p-4"><h2 className="mb-3 font-display text-xl">Topics across the park</h2><TopicMap topics={all?.topics??[]} selected={focus?.kind==='topic'?focus.id:null} onSelect={id=>setFocus(id?{kind:'topic',id}:null)}/></section>
  <section><h2 className="mb-4 font-display text-2xl">For {selected?.name??'…'}</h2>{mine.length===0?<EmptyState icon={<Network/>} title="No overlaps yet">Connections appear when built profiles share technologies, application areas or markets.</EmptyState>:
   <div className="space-y-4">{mine.map(c=><article key={c.id} className="surface p-5"><div className="flex flex-wrap items-center justify-between gap-2"><Link to="/companies/$companyId" params={{companyId:c.id}} search={true} className="font-display text-xl hover:text-primary">{c.name}</Link><SourceChip url={c.website_url}/></div>
    <p className="mt-1 text-sm">Shared topics: {c.basis.map(b=><span key={b} className="ml-1 rounded-full bg-muted px-2 py-0.5 text-[11px]">{b}</span>)}</p>
    {c.named.length>0&&<p className="mt-2 text-sm"><span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-primary">Named in a profile</span> “{c.named[0]}”</p>}
    <div className="mt-4 grid gap-4 md:grid-cols-2"><div><p className="eyebrow mb-2">{selected?.name}</p><Items items={c.mine}/></div><div><p className="eyebrow mb-2">{c.name}</p><Items items={c.theirs}/></div></div>
    <p className="mt-4 border-t pt-3 text-xs text-muted-foreground">{note}</p></article>)}</div>}</section>
 </ParkShell>;}
