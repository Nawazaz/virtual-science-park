import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Moon, Play } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { nightlyQuery } from '@/lib/company-queries';
import { runNightlyClient } from '@/lib/build-profile-client';
import { nightlyLine, type NightlySummary } from '@/lib/nightly-rules';
import { fmtDate } from './evidence';
import { HowMadeLink } from './how-made';
export function NightlyStatus({canRun=false}:{canRun?:boolean}){
 const {data:run}=useQuery(nightlyQuery);const qc=useQueryClient();const [busy,setBusy]=useState<string|null>(null);
 let s:NightlySummary|null=null;try{if(run)s=JSON.parse(run.output) as NightlySummary;}catch{}
 const go=async()=>{setBusy('Starting…');try{await runNightlyClient(m=>setBusy(m));toast.success('Nightly run finished');await qc.invalidateQueries();}catch(e){toast.error(e instanceof Error?e.message:'Run failed');}finally{setBusy(null);}};
 return <div className="surface mb-6 flex flex-wrap items-center gap-3 p-4 text-sm"><Moon size={16} className="text-primary" aria-hidden/>
  <span>{run&&s?<>Last nightly run: {fmtDate(run.started_at)} · {nightlyLine(s)}</>:'Last nightly run: none yet. Profiles rebuild nightly at 03:00.'}</span>
  {run&&<HowMadeLink agent="Nightly run" companyId={null}/>}
  {canRun&&<Button size="sm" variant="outline" className="ml-auto" disabled={!!busy} onClick={go}><Play/>{busy??'Run now'}</Button>}
 </div>;
}
