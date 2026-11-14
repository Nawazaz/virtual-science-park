import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { HandCoins, CalendarDays, FlaskConical, Newspaper, History, Network, Sparkles, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ParkShell, EmptyState } from '@/components/park-shell';
import { companiesQuery, dashboardQuery, connectionsQuery } from '@/lib/company-queries';
import { useViewingAs } from '@/hooks/use-viewing-as';
import { EvidenceBadge, Ring, SourceChip, fmtDate, kindOf } from '@/components/park/evidence';
import { HowMadeLink } from '@/components/park/how-made';
import { OpportunityCard } from '@/components/park/opportunity-card';
import { ScrollPanel } from '@/components/park/scroll-panel';
import { fieldLabels } from '@/lib/profile-rules';
import { FloatingAsk } from '@/components/park/chat-panel';
import { isWeakBasis } from '@/lib/opportunity-rules';
import { nightlyQuery } from '@/lib/company-queries';
import { Moon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { PrivateNotice } from '@/components/park/access';
export const Route=createFileRoute('/')({
 head:()=>({meta:[{title:'Dashboard | Virtual Science Park'},{name:'description',content:'A personalised digest of possible matches, changes and connections for a Blue Science Park member.'},{property:'og:title',content:'Dashboard | Virtual Science Park'},{property:'og:description',content:'Your top possible matches, what changed and possible connections.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),
 loader:({context})=>context.queryClient.ensureQueryData(companiesQuery),
 component:Dashboard,
});
const tiles=[{type:'funding',label:'Funding',Icon:HandCoins},{type:'event',label:'Events',Icon:CalendarDays},{type:'testing',label:'Testing',Icon:FlaskConical},{type:'news',label:'News & trends',Icon:Newspaper}] as const;
function Dashboard(){
 const {selected,companyId,isOwner}=useViewingAs();
 const {data:d,isLoading}=useQuery({...dashboardQuery(companyId??''),enabled:!!companyId});
 const {data:night}=useQuery(nightlyQuery);
 const overnight=(date:string)=>{if(!night)return false;const t=Date.parse(date),s=Date.parse(night.started_at);return t>=s-1000&&t<=s+night.duration_ms+5000;};
 const {data:conns=[]}=useQuery({...connectionsQuery(companyId??''),enabled:!!companyId});
 if(!selected)return <ParkShell><EmptyState icon={<Building2/>} title="No members yet">Add the first member company on the Members page.</EmptyState></ParkShell>;
 if(isLoading||!d)return <ParkShell><Skeleton className="h-48 w-full rounded-[14px]"/><div className="mt-6 grid gap-4 md:grid-cols-4">{[0,1,2,3].map(i=><Skeleton key={i} className="h-24 rounded-[14px]"/>)}</div></ParkShell>;
 const timeline=[...d.changes.map(c=>({date:c.changed_at,title:`${fieldLabels[c.field]??c.field} updated`,detail:`${(c.old_value??'—').slice(0,80)} → ${(c.new_value??'—').slice(0,80)}`,why:'Matches now use the newer public information.',sim:false})),...d.newOpps.map(o=>({date:o.retrieved_at,title:`New ${o.type==='news'?'trend':o.type}: ${o.title}`,detail:o.source_name,why:o.type==='news'?'Signals where demand may be moving.':'Could be a new possible match after the next ranking.',sim:o.simulated}))].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,8);
 return <ParkShell>
  <section className="surface relative overflow-hidden p-6">
   <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-sand/60 md:block" aria-hidden/>
   <div className="relative flex flex-wrap items-center gap-6">
    <div className="min-w-0 flex-1"><p className="eyebrow mb-2">Your digest · {fmtDate(new Date().toISOString())}</p><h1 className="font-display text-4xl">{d.company.name}</h1>
     {d.summary?<p className="mt-3 flex max-w-2xl flex-wrap items-start gap-2 text-base"><span>{d.summary.value}</span><EvidenceBadge kind={kindOf(d.summary)}/></p>:<p className="mt-3 text-muted-foreground">No summary yet. Build the profile to get an evidence-backed one-liner.</p>}
     <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground"><span>Last updated {d.updated?fmtDate(d.updated):'never'}</span><HowMadeLink agent="Profile builder" companyId={d.company.id}/><Link to="/companies/$companyId" params={{companyId:d.company.id}} search={true} className="font-medium text-primary hover:underline">Open profile</Link></div></div>
    <div className="flex flex-col items-center gap-1"><Ring value={d.completeness} size={88} stroke={8} label="Profile completeness" tone="var(--confirmed)"/><span className="text-xs text-muted-foreground">Profile completeness</span></div>
   </div>
  </section>
  <section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">{tiles.map(t=><Link key={t.type} to="/opportunities" search={(p:Record<string,unknown>)=>({...p,type:t.type})} className="surface flex items-center gap-3 p-4 hover:border-primary"><span className="grid size-10 place-items-center rounded-lg bg-accent text-primary"><t.Icon size={18} aria-hidden/></span><span><span className="block font-display text-2xl">{d.counts[t.type]??0}</span><span className="text-xs text-muted-foreground">{t.label}</span></span></Link>)}</section>
  <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
   <section><div className="mb-4 flex items-end justify-between"><h2 className="font-display text-2xl">Your top 5</h2><Link to="/opportunities" search={true} className="text-sm font-medium text-primary hover:underline">All opportunities</Link></div>
    {d.locked?<PrivateNotice companyId={d.company.id} name={d.company.name}>Rankings, saved items and profile edits belong to the company. You see only what the AI found on its public pages.</PrivateNotice>:d.top.length===0?<EmptyState icon={<Sparkles/>} title="No possible matches yet">{d.itemCount?'Open Opportunities and run matching to rank what fits this company.':'Build the company profile first, then run matching.'}</EmptyState>:
    <ScrollPanel label="Your top 5 possible matches" fit={34.5} min={15.5}><div className="space-y-3">{d.top.map(m=><OpportunityCard key={m.opportunity!.id} o={m.opportunity!} score={m.score} reason={m.reason} nextStep={m.next_step} companyId={d.company.id} weakBasis={isWeakBasis(m.matched_profile_item_ids)} compact/>)}</div></ScrollPanel>}
   </section>
   <aside><ScrollPanel label="What changed and possible connections" fit={31.5} min={19}><div className="space-y-8">
    <section><h2 className="mb-4 flex items-center gap-2 font-display text-2xl"><History size={20} aria-hidden/>What changed</h2>
     {timeline.length===0?<p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">Nothing new yet. Changes appear after a profile rebuild or source refresh.</p>:
     <ol className="relative ml-1.5 space-y-4 border-l pl-5">{timeline.map((t,i)=><li key={i} className="relative"><span className="absolute -left-[25px] top-1.5 size-2.5 rounded-full bg-primary" aria-hidden/><p className="flex items-center gap-2 text-xs text-muted-foreground">{fmtDate(t.date)}{overnight(t.date)&&<span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary"><Moon size={11} aria-hidden/>Found overnight</span>}{t.sim&&<EvidenceBadge kind="simulated"/>}</p><p className="text-sm font-medium">{t.title}</p><p className="text-xs text-muted-foreground">{t.detail}</p><p className="text-xs"><span className="font-medium">Why it matters:</span> {t.why}</p></li>)}</ol>}
    </section>
    <section><h2 className="mb-4 flex items-center gap-2 font-display text-2xl"><Network size={20} aria-hidden/>Possible connections</h2>
     {conns.length===0?<p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">No overlaps found yet. Connections appear when two built profiles share topics.</p>:
     <div className="space-y-3">{conns.slice(0,2).map(c=><div key={c.id} className="surface p-4"><p className="font-display text-lg">{c.name}</p><p className="mt-1 text-xs text-muted-foreground">Basis: shared topics</p><div className="mt-2 flex flex-wrap gap-1">{c.basis.map(b=><span key={b} className="rounded-full bg-muted px-2 py-0.5 text-[11px]">{b}</span>)}</div><div className="mt-2"><SourceChip url={c.website_url}/></div></div>)}<p className="text-xs text-muted-foreground">Based on public information; neither company has expressed interest.</p><Button asChild variant="outline" size="sm"><Link to="/connections" search={true}>See all connections</Link></Button></div>}
    </section>
   </div></ScrollPanel></aside>
  </div>
  <FloatingAsk companyId={isOwner?d.company.id:null}/>
 </ParkShell>;
}
