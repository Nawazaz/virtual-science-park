import { createFileRoute, Link } from '@tanstack/react-router';
import { useSuspenseQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { useState } from 'react';
import { Search, Sparkles, Building2, X, ListPlus, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ParkShell, EmptyState } from '@/components/park-shell';
import { CompanyDialog } from '@/components/company-dialog';
import { companiesQuery, opportunitiesQuery, sourcesQuery } from '@/lib/company-queries';
import { buildProfileClient } from '@/lib/build-profile-client';
import { importMembers } from '@/lib/park.functions';
import { domainOf } from '@/components/park/evidence';
import { ScrollPanel } from '@/components/park/scroll-panel';
import parkImage from '@/assets/science-park.jpg';
export const Route=createFileRoute('/members')({
 head:()=>({meta:[{title:'Members | Virtual Science Park'},{name:'description',content:'Directory of Blue Science Park member companies with evidence-backed profiles.'},{property:'og:title',content:'Members | Virtual Science Park'},{property:'og:description',content:'Search member companies, their technologies and profile status.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),
 loader:({context})=>context.queryClient.ensureQueryData(companiesQuery),
 component:Members,
});
function ImportDialog(){const [open,setOpen]=useState(false);const [text,setText]=useState('');const [busy,setBusy]=useState(false);const run=useServerFn(importMembers);const qc=useQueryClient();
 return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button variant="outline"><ListPlus/>Import from member list</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle className="font-display text-2xl font-medium">Import from member list</DialogTitle><DialogDescription>Paste Blue Science Park member page addresses, one per line. Names come from the address; you can build each profile afterwards.</DialogDescription></DialogHeader>
  <Textarea rows={6} value={text} onChange={e=>setText(e.target.value)} placeholder={'https://www.bluesciencepark.se/medlem/njord-x/\nhttps://www.bluesciencepark.se/medlem/wip/'} aria-label="Member page addresses"/>
  <p className="text-xs text-muted-foreground">Scales to all 40+ members; Profiles rebuild nightly at 03:00.</p>
  <Button disabled={busy||!text.trim()} onClick={async()=>{setBusy(true);try{const r=await run({data:{text}});await qc.invalidateQueries({queryKey:['companies']});toast.success(`${r.added} added${r.skipped?`, ${r.skipped} already listed`:''}`);setOpen(false);setText('');}catch(e){toast.error(e instanceof Error?e.message:'Import failed');}finally{setBusy(false);}}}>{busy?'Importing…':'Import members'}</Button></DialogContent></Dialog>;}
function Members(){
 const {data:companies}=useSuspenseQuery(companiesQuery);const {data:opps=[]}=useQuery(opportunitiesQuery);const {data:sources=[]}=useQuery(sourcesQuery);const qc=useQueryClient();
 const [search,setSearch]=useState('');const [filter,setFilter]=useState<'all'|'built'|'unbuilt'>('all');const [busy,setBusy]=useState<string|null>(null);const [progress,setProgress]=useState('');const [abort,setAbort]=useState<AbortController|null>(null);
 const built=companies.filter(c=>c.profile_items.length>0).length;
 const visible=[...companies].sort((a,b)=>a.name.localeCompare(b.name)).filter(c=>`${c.name} ${c.website_url} ${c.profile_items.map(i=>i.value).join(' ')}`.toLowerCase().includes(search.toLowerCase())&&(filter==='all'||(filter==='built')===(c.profile_items.length>0)));
 const stats=[[companies.length,'Members'],[built,'Profiles built'],[opps.length,'Opportunities'],[sources.filter(s=>s.status==='ok').length,'Live sources']] as const;
 return <ParkShell>
  <section className="relative h-40 overflow-hidden rounded-[14px] md:h-44"><img src={parkImage} alt="A research campus beside the Baltic sea" className="size-full object-cover" width={1536} height={512}/><div className="absolute inset-0 bg-gradient-to-r from-navy/85 via-navy/50 to-transparent"/><div className="absolute bottom-5 left-6 max-w-lg text-primary-foreground md:left-8"><p className="eyebrow !text-primary-foreground/80">Blue Science Park · Karlskrona</p><h1 className="font-display text-3xl md:text-4xl">Members</h1><p className="mt-1 text-primary-foreground/90">Companies moving ideas forward, described from public evidence.</p></div></section>
  <dl className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">{stats.map(([n,l])=><div key={l} className="surface px-4 py-3"><dt className="text-xs text-muted-foreground">{l}</dt><dd className="font-display text-2xl">{n}</dd></div>)}</dl>
  <div className="mt-5 flex flex-wrap items-center gap-3"><div className="relative min-w-0 flex-1 sm:max-w-sm"><Search size={16} className="absolute left-3 top-2.5 text-muted-foreground" aria-hidden/><Input aria-label="Search members" className="bg-card pl-9" placeholder="Search names, technologies…" value={search} onChange={e=>setSearch(e.target.value)}/></div>
   <div role="group" aria-label="Filter by profile status" className="flex rounded-lg border bg-card p-0.5">{(['all','built','unbuilt'] as const).map(f=><button key={f} aria-pressed={filter===f} onClick={()=>setFilter(f)} className={`rounded-md px-3 py-1.5 text-xs font-medium ${filter===f?'bg-primary text-primary-foreground':'text-muted-foreground hover:text-foreground'}`}>{f==='all'?'All':f==='built'?'Profile built':'Not built'}</button>)}</div>
   <span className="text-xs text-muted-foreground">{visible.length} shown</span><div className="ml-auto flex flex-wrap gap-2"><ImportDialog/><CompanyDialog/></div></div>
  {busy&&<div className="mt-4 flex items-center gap-2 rounded-lg border bg-accent px-4 py-2 text-sm" role="status"><Sparkles size={15}/>{progress}<Button variant="ghost" size="icon" className="ml-auto" aria-label="Stop building" onClick={()=>abort?.abort()}><X/></Button></div>}
  {visible.length===0?<div className="mt-6"><EmptyState icon={<Building2/>} title={companies.length?'No matching members':'No members yet'}>{companies.length?'Try a different search or filter.':'Add a company or import from the member list.'}</EmptyState></div>:
  <ScrollPanel label={`${visible.length} member companies`} fit={29} min={20} className="mt-4"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{visible.map(c=>{const has=c.profile_items.length>0;const evidence=c.profile_items.filter(i=>i.kind==='fact'||i.confirmed_by_user).length;const tags=c.profile_items.filter(i=>i.field==='technologies'&&i.kind!=='missing').map(i=>i.value.length>28?i.value.slice(0,27)+'…':i.value).slice(0,3);
   return <article key={c.id} className="surface flex flex-col p-5">
    <div className="flex items-start gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-sand font-display text-lg">{c.name.split(/\s+/).map(s=>s[0]).slice(0,2).join('').toUpperCase()}</span><div className="min-w-0"><h2 className="font-display text-xl leading-tight"><Link to="/companies/$companyId" params={{companyId:c.id}} search={true} className="hover:text-primary">{c.name}</Link></h2><a href={c.website_url} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary">{domainOf(c.website_url)}</a></div></div>
    {tags.length>0&&<div className="mt-3 flex flex-wrap gap-1">{tags.map(t=><span key={t} className="rounded-md border px-2 py-0.5 text-[11px]">{t}</span>)}</div>}
    <div className="mt-4 flex flex-wrap gap-2 text-xs"><span className={`rounded-full px-2 py-0.5 font-medium ${has?'bg-confirmed/10 ink-confirmed':'bg-muted text-muted-foreground'}`}>{has?'Profile built':'Not built yet'}</span>{has&&<span className="rounded-full bg-fact/10 px-2 py-0.5 ink-fact">{evidence} evidence-backed</span>}{c.company_priorities.map(p=><span key={p.priority} className="rounded-full bg-accent px-2 py-0.5 capitalize">{p.priority}</span>)}</div>
    <div className="mt-auto flex justify-between gap-2 border-t pt-3 mt-5"><Button variant="ghost" size="sm" disabled={busy!==null} onClick={async()=>{const ctl=new AbortController();setAbort(ctl);setBusy(c.id);setProgress('Starting profile build…');try{await buildProfileClient(c.id,setProgress,ctl.signal);await qc.invalidateQueries({queryKey:['companies']});toast.success(`${c.name}: profile built`);}catch(e){toast.error(ctl.signal.aborted?'Build stopped':e instanceof Error?e.message:'Build failed');}finally{setBusy(null);setAbort(null);}}}><Sparkles/>{busy===c.id?'Building…':has?'Rebuild':'Build profile'}</Button><Button asChild variant="ghost" size="sm"><Link to="/companies/$companyId" params={{companyId:c.id}} search={true}>Profile<ArrowRight/></Link></Button></div>
   </article>;})}</div></ScrollPanel>}
 </ParkShell>;
}
