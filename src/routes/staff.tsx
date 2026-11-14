import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { ParkShell, PageHeader } from '@/components/park-shell';
import { companiesQuery, sourcesQuery, staffQuery, allConnectionsQuery } from '@/lib/company-queries';
import { EvidenceBadge, fmtDate, SourceChip } from '@/components/park/evidence';
import { NightlyStatus } from '@/components/park/nightly-status';
import { TestbedsAdmin } from '@/components/park/testbeds-admin';
import { TypePill } from '@/components/park/opportunity-card';
import { SignInButton } from '@/components/park/access';
import { Lock } from 'lucide-react';
import { collabClusters } from '@/lib/knowledge-graph';
export const Route=createFileRoute('/staff')({
 head:()=>({meta:[{title:'Park insights | Virtual Science Park'},{name:'description',content:'Shared interests, common deadlines, profile gaps and collaboration clusters across members.'},{property:'og:title',content:'Park insights | Virtual Science Park'},{property:'og:description',content:'A park-wide view for Blue Science Park staff.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),
 loader:({context})=>context.queryClient.ensureQueryData(companiesQuery),
 component:Staff,
});
function StaffNotice(){return <div className="rounded-[14px] border border-dashed bg-card/50 p-5 text-sm" role="note"><p className="flex items-center gap-2 font-medium"><Lock size={15} aria-hidden/>For Blue Science Park staff</p><p className="mt-1 text-muted-foreground">Park insights are built from every member's private profile and rankings, so only park staff see them.</p><div className="mt-3 flex flex-wrap items-center gap-3"><SignInButton/><span className="text-xs text-muted-foreground">Sign in with the park staff account to see this.</span></div></div>;}
const H=({children,count}:{children:React.ReactNode;count?:number|undefined})=><h2 className="mb-3 flex items-baseline gap-2 font-display text-xl font-bold">{children}{count!==undefined&&<span className="text-sm font-normal text-muted-foreground">{count}</span>}</h2>;
/** A panel with a fixed height whose content scrolls, so side-by-side panels line up without empty space. */
const Scroll=({label,children,className=''}:{label:string;children:React.ReactNode;className?:string})=><div tabIndex={0} role="region" aria-label={label} className={`max-h-[420px] overflow-y-auto rounded-[12px] pr-1 focus-visible:outline-2 ${className}`}>{children}</div>;
const Muted=({children}:{children:React.ReactNode})=><p className="rounded-[12px] border border-dashed p-4 text-sm text-muted-foreground">{children}</p>;
function Staff(){useSuspenseQuery(companiesQuery);const {data:s}=useQuery(staffQuery);const {data:sources=[]}=useQuery(sourcesQuery);const {data:conn}=useQuery(allConnectionsQuery);
 const max=Math.max(1,...(s?.topics??[]).map(t=>t.members.length));
 const clusters=collabClusters(conn?.pairs??[]);
 const header=<PageHeader eyebrow="Blue Science Park team" title="Park insights">Where members overlap, which deadlines matter to many, and where profiles are missing.</PageHeader>;
 if(s===null)return <ParkShell>{header}<StaffNotice/></ParkShell>;
 return <ParkShell>{header}
   <NightlyStatus canRun/>
  <div className="grid gap-6 lg:grid-cols-2">
   <section><H count={s?.topics.length}>Shared interests</H>{!s?<Muted>Loading…</Muted>:s.topics.length===0?<Muted>No topics shared by two or more members yet.</Muted>:<Scroll label="Shared interests" className="surface p-4"><ul className="space-y-2.5">{s.topics.map(t=><li key={t.topic} className="text-sm"><div className="flex justify-between"><span className="capitalize">{t.topic}</span><span className="text-muted-foreground">{t.members.length} members</span></div><div className="mt-1 h-2 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{width:`${t.members.length/max*100}%`}} title={t.members.join(', ')}/></div></li>)}</ul></Scroll>}</section>
   <section><H count={s?.deadlines.length}>Deadlines relevant to many members</H>{!s?<Muted>Loading…</Muted>:s.deadlines.length===0?<Muted>No opportunity is a strong possible match (score 50+) for more than one member yet.</Muted>:<Scroll label="Deadlines relevant to many members"><ul className="space-y-2">{s.deadlines.map(d=><li key={d.id} className="surface p-3 text-sm"><div className="flex flex-wrap items-center gap-2"><TypePill type={d.type}/>{d.simulated&&<EvidenceBadge kind="simulated"/>}<span className="text-xs text-muted-foreground">{d.deadline_or_date}</span></div><p className="mt-1 font-medium">{d.title}</p><p className="text-xs text-muted-foreground">{d.members.length} members: {d.members.join(', ')}</p><div className="mt-1"><SourceChip url={d.source_url}/></div></li>)}</ul></Scroll>}</section>
   <section><H count={clusters.length}>Suggested collaboration clusters</H>{clusters.length===0?<Muted>No clusters yet. They appear when members have strong shared topics.</Muted>:<Scroll label="Suggested collaboration clusters"><ul className="space-y-2">{clusters.map((g,i)=><li key={i} className="surface p-3 text-sm"><p className="font-medium">{g.names.join(' · ')}</p><p className="mt-1 text-xs text-muted-foreground">Common ground: {g.topics.join(', ')}</p></li>)}</ul></Scroll>}<p className="mt-2 text-xs text-muted-foreground">Small groups from the strongest links in the knowledge graph. Suggested on public information only; no company has expressed interest.</p></section>
   <div className="space-y-6"><section><H count={s?.unbuilt.length}>Members without profiles</H>{!s?<Muted>Loading…</Muted>:s.unbuilt.length===0?<Muted>Every member has a built profile.</Muted>:<Scroll label="Members without profiles" className="surface"><ul className="divide-y">{s.unbuilt.map(u=><li key={u.id} className="flex items-center justify-between p-3 text-sm"><span>{u.name}</span><Link to="/companies/$companyId" params={{companyId:u.id}} search={true} className="text-xs font-medium text-primary hover:underline">Build profile</Link></li>)}</ul></Scroll>}</section>
   <section><H>Source health</H><ul className="surface divide-y">{sources.map(x=><li key={x.source_name} className="p-3 text-sm"><div className="flex items-center justify-between gap-2"><span className="font-medium">{x.source_name}</span>{x.status==='ok'?<span className="text-xs ink-confirmed">Live · {x.found}</span>:<EvidenceBadge kind="simulated"/>}</div><p className="mt-0.5 text-xs text-muted-foreground">{x.message} · {fmtDate(x.last_checked)}</p></li>)}</ul></section></div>
   <section className="lg:col-span-2"><H>Testbeds</H><TestbedsAdmin/></section>
  </div></ParkShell>;}
