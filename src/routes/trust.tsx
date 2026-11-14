import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { useState } from 'react';
import { Play } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ParkShell, PageHeader } from '@/components/park-shell';
import { qualityQuery, runsQuery } from '@/lib/company-queries';
import { runBoundaryTestsFn } from '@/lib/park.functions';
import { boundaryTests } from '@/lib/park-rules';
import { NightlyStatus } from '@/components/park/nightly-status';
import { CheckRow, EvidenceBadge, fmtDate } from '@/components/park/evidence';
export const Route=createFileRoute('/trust')({
 head:()=>({meta:[{title:'Trust & quality | Virtual Science Park'},{name:'description',content:'Quality checks, assistant boundary tests and agent run logs for Virtual Science Park.'},{property:'og:title',content:'Trust & quality | Virtual Science Park'},{property:'og:description',content:'Measured accuracy, traceability and interaction limits, shown honestly.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),
 component:Trust,
});
function Metric({title,result,pct,target,passed,how}:{title:string;result:string;pct:number|null;target:string;passed:boolean|null;how:string}){
 return <div className="surface p-5"><div className="flex items-start justify-between gap-2"><h3 className="font-display text-xl">{title}</h3>{passed!==null&&<span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${passed?'bg-confirmed/10 ink-confirmed':'bg-destructive/10 text-destructive'}`}>{passed?'Meets target':'Below target'}</span>}</div>
  <p className="mt-2 font-display text-4xl">{result}</p><p className="text-xs text-muted-foreground">Target: {target}</p>
  <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted" role="img" aria-label={`${pct??0}% of target scale`}><div className={`h-full rounded-full ${passed===false?'bg-destructive':'bg-confirmed'}`} style={{width:`${Math.max(0,Math.min(100,pct??0))}%`}}/></div>
  <details className="mt-3 text-sm"><summary className="cursor-pointer text-xs font-medium text-primary">How we measured</summary><p className="mt-1 text-muted-foreground">{how}</p></details></div>;}
type BT={message:string;expected:string;actual:string|null;passed:boolean;reply:string;error:string|null};
function Trust(){const {data:q}=useQuery(qualityQuery);const {data:runs=[]}=useQuery(runsQuery);const qc=useQueryClient();const run=useServerFn(runBoundaryTestsFn);
 const [bt,setBt]=useState<{results:BT[];passed:number;total:number}|null>(null);const [busy,setBusy]=useState(false);const [open,setOpen]=useState<(typeof runs)[number]|null>(null);
 const runAll=async()=>{setBusy(true);try{const r=await run();setBt(r);await Promise.all([qc.invalidateQueries({queryKey:['quality']}),qc.invalidateQueries({queryKey:['runs']})]);}catch(e){toast.error(e instanceof Error?e.message:'Tests failed');}finally{setBusy(false);}};
 return <ParkShell><PageHeader eyebrow="Transparency" title="Trust & quality">Measured on the live data. Failures are shown as they are.</PageHeader>
  <NightlyStatus/>
  <Tabs defaultValue="quality"><TabsList className="mb-6"><TabsTrigger value="quality">Quality checks</TabsTrigger><TabsTrigger value="boundary">Boundary tests</TabsTrigger><TabsTrigger value="runs">Agent runs</TabsTrigger></TabsList>
   <TabsContent value="quality"><p className="mb-4 max-w-3xl text-sm text-muted-foreground">These numbers are measured automatically on the live data. They show that the code checks work, not that every answer is right. Profile accuracy and recommendation relevance were also checked by a person; those results are in docs/EVALUATION.md.</p>{!q?<p className="text-sm text-muted-foreground">Measuring…</p>:<div className="grid gap-4 md:grid-cols-2">
    <Metric title="Quote check on AI facts" result={q.accuracy.value===null?'No data':`${q.accuracy.value}%`} pct={q.accuracy.value} target="90%" passed={q.accuracy.value===null?null:q.accuracy.value>=90} how={q.accuracy.detail}/>
    <Metric title="Top-5 matches backed by the profile" result={q.relevance.value===null?'No data':`${q.relevance.value.toFixed(1)} of 5`} pct={q.relevance.value===null?null:q.relevance.value*20} target="4 of 5" passed={q.relevance.value===null?null:q.relevance.value>=4} how={q.relevance.detail}/>
    <Metric title="Facts with quote and link" result={q.traceability.value===null?'No data':`${q.traceability.value}%`} pct={q.traceability.value} target="100%" passed={q.traceability.value===null?null:q.traceability.value>=100} how={q.traceability.detail}/>
    <Metric title="Boundary tests passed" result={q.limits.value===null?'Not run':`${q.limits.value} of 12`} pct={q.limits.value===null?null:q.limits.value/12*100} target="12 of 12" passed={q.limits.value===null?null:q.limits.value>=12} how={q.limits.detail}/>
   </div>}</TabsContent>
   <TabsContent value="boundary"><div className="mb-4 flex flex-wrap items-center gap-3"><Button onClick={runAll} disabled={busy}><Play/>{busy?'Running through the Guard…':'Run all'}</Button>{bt&&<span className={`font-display text-2xl ${bt.passed===bt.total?'ink-confirmed':'text-destructive'}`}>{bt.passed} of {bt.total} passed</span>}<span className="text-xs text-muted-foreground">Each message goes through the real AI Guard and the fixed reply rules.</span></div>
    <div className="surface overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead><tr className="border-b text-left text-xs text-muted-foreground"><th className="p-3 font-medium">#</th><th className="p-3 font-medium">Message</th><th className="p-3 font-medium">Expected</th><th className="p-3 font-medium">Actual</th><th className="p-3 font-medium">Result</th><th className="p-3 font-medium">Reply</th></tr></thead><tbody>
     {boundaryTests.map((t,i)=>{const r=bt?.results[i];return <tr key={t.message} className={`border-b last:border-0 align-top ${r&&!r.passed?'bg-destructive/5':''}`}><td className="p-3 text-muted-foreground">{i+1}</td><td className="p-3">“{t.message}”</td><td className="p-3"><code className="text-xs">{t.expected}</code></td><td className="p-3"><code className="text-xs">{r?(r.actual??'error'):'—'}</code></td><td className="p-3">{r?<span className={`font-semibold ${r.passed?'ink-confirmed':'text-destructive'}`}>{r.passed?'Pass':'Fail'}</span>:'—'}</td><td className="max-w-xs p-3 text-xs text-muted-foreground">{r?.error??r?.reply??''}</td></tr>;})}
    </tbody></table></div></TabsContent>
   <TabsContent value="runs"><div className="surface overflow-x-auto"><table className="w-full min-w-[640px] text-sm"><thead><tr className="border-b text-left text-xs text-muted-foreground"><th className="p-3 font-medium">Agent</th><th className="p-3 font-medium">Company</th><th className="p-3 font-medium">When</th><th className="p-3 font-medium">Duration</th><th className="p-3 font-medium">Checks</th><th className="p-3"/></tr></thead><tbody>
    {runs.map(r=>{const c=r.checks as {passed:boolean}[];const failed=c.filter(x=>!x.passed).length;return <tr key={r.id} className="border-b last:border-0"><td className="p-3 font-medium">{r.agent}</td><td className="p-3">{r.companies?.name??'—'}</td><td className="p-3 text-muted-foreground">{fmtDate(r.started_at)} {new Date(r.started_at).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}</td><td className="p-3">{(r.duration_ms/1000).toFixed(1)} s</td><td className="p-3"><span className={failed?'font-semibold text-destructive':'ink-confirmed'}>{c.length-failed}/{c.length} passed</span> {r.simulated&&<EvidenceBadge kind="simulated"/>}</td><td className="p-3"><Button size="sm" variant="ghost" onClick={()=>setOpen(r)}>Details</Button></td></tr>;})}
   </tbody></table></div></TabsContent></Tabs>
  <Sheet open={!!open} onOpenChange={o=>!o&&setOpen(null)}><SheetContent className="w-full overflow-y-auto sm:max-w-md"><SheetHeader><SheetTitle className="font-display text-2xl font-medium">{open?.agent}</SheetTitle><SheetDescription>{open&&`${fmtDate(open.started_at)} · ${(open.duration_ms/1000).toFixed(1)} s${open.companies?.name?` · ${open.companies.name}`:''}`}</SheetDescription></SheetHeader>
   {open&&<div className="space-y-4 px-4 pb-8"><ul className="space-y-2">{(open.checks as {name:string;passed:boolean;detail:string}[]).map((c,i)=><CheckRow key={i} c={c}/>)}</ul>{open.sources_used.length>0&&<div><p className="eyebrow mb-1">Sources</p><ul className="space-y-1 text-xs">{open.sources_used.map(s=><li key={s} className="truncate">{s}</li>)}</ul></div>}<div><p className="eyebrow mb-1">Output</p><pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-muted p-3 text-xs">{open.output.startsWith('{')?(()=>{try{return JSON.parse(open.output).summary;}catch{return open.output;}})():open.output}</pre></div></div>}
  </SheetContent></Sheet>
 </ParkShell>;}
