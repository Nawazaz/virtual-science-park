import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Info } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { getLatestRun } from '@/lib/park.functions';
import { CheckRow, EvidenceBadge, fmtDate, domainOf } from './evidence';
type Breakdown={ai:number;evidenceWeight:number;weighted:number;priorityBoost:number;feedbackPenalty:number;total:number};
export function HowMadeLink({agent,companyId,opportunityId,label='How was this made?'}:{agent:'Profile builder'|'Matcher'|'Source scouts'|'Assistant';companyId:string|null;opportunityId?:string;label?:string}){
 const [open,setOpen]=useState(false);
 const {data:run,isLoading}=useQuery({queryKey:['run',agent,companyId],queryFn:()=>getLatestRun({data:{agent,company_id:companyId}}),enabled:open});
 let breakdown:Breakdown|undefined;let summary=run?.output??'';
 if(run&&agent==='Matcher'){try{const o=JSON.parse(run.output) as {summary:string;breakdowns:Record<string,Breakdown>};summary=o.summary;if(opportunityId)breakdown=o.breakdowns[opportunityId];}catch{}}
 const checks=(run?.checks??[]) as {name:string;passed:boolean;detail:string}[];
 return <Sheet open={open} onOpenChange={setOpen}><SheetTrigger className="inline-flex items-center gap-1 text-xs font-medium text-primary underline-offset-4 hover:underline"><Info size={13} aria-hidden/>{label}</SheetTrigger>
  <SheetContent className="w-full overflow-y-auto sm:max-w-md"><SheetHeader><SheetTitle className="font-display text-2xl font-medium">How this was made</SheetTitle><SheetDescription>The latest recorded run and the code checks applied after the AI step.</SheetDescription></SheetHeader>
   <div className="space-y-5 px-4 pb-8">{isLoading?<p className="text-sm text-muted-foreground">Loading…</p>:!run?<p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">No run recorded yet. It appears after the next build, refresh or match.</p>:<>
    <dl className="grid grid-cols-2 gap-3 text-sm"><div><dt className="eyebrow">Agent</dt><dd>{run.agent}</dd></div><div><dt className="eyebrow">When</dt><dd>{fmtDate(run.started_at)} {new Date(run.started_at).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}</dd></div><div><dt className="eyebrow">Duration</dt><dd>{(run.duration_ms/1000).toFixed(1)} s</dd></div><div><dt className="eyebrow">Data</dt><dd>{run.simulated?<EvidenceBadge kind="simulated"/>:'Real sources'}</dd></div></dl>
    {summary&&<p className="text-sm whitespace-pre-line">{summary}</p>}
    {breakdown&&<div className="rounded-lg border p-3"><p className="eyebrow mb-2">Score breakdown</p><table className="w-full text-sm"><tbody>
     <tr><td>AI relevance</td><td className="text-right">{breakdown.ai}</td></tr>
     <tr><td>Evidence weight (confirmed 1, fact 0.75, inferred 0.4)</td><td className="text-right">×{(0.4+0.6*breakdown.evidenceWeight).toFixed(2)} = {breakdown.weighted}</td></tr>
     <tr><td>Chosen priority boost</td><td className="text-right">+{breakdown.priorityBoost}</td></tr>
     <tr><td>Feedback penalty</td><td className="text-right">{breakdown.feedbackPenalty}</td></tr>
     <tr className="border-t font-semibold"><td className="pt-1">Possible match score</td><td className="pt-1 text-right">{breakdown.total}</td></tr></tbody></table></div>}
    <div><p className="eyebrow mb-2">Checks</p><ul className="space-y-2">{checks.map(c=><CheckRow key={c.name} c={c}/>)}</ul></div>
    {run.sources_used.length>0&&<div><p className="eyebrow mb-2">Sources used</p><ul className="space-y-1 text-sm">{run.sources_used.slice(0,15).map(s=><li key={s} className="truncate">{/^https?:/.test(s)?<a className="text-primary hover:underline" href={s} target="_blank" rel="noopener noreferrer">{domainOf(s)}{new URL(s).pathname!=='/'?new URL(s).pathname:''}</a>:s}</li>)}</ul></div>}
   </>}</div></SheetContent></Sheet>;
}
