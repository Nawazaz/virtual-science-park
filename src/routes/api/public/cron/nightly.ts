import { createFileRoute } from '@tanstack/react-router';
import { authenticateCronRequest } from '@/integrations/supabase/cron-auth';
import { stockholmHour } from '@/lib/nightly-rules';
// Scheduled at 01:00 and 02:00 UTC; only the call that lands at 03:00 Stockholm time runs (handles summer/winter time).
export const Route=createFileRoute('/api/public/cron/nightly')({server:{handlers:{POST:async({request})=>{
 const authFailure=await authenticateCronRequest(request);if(authFailure)return authFailure;
 const body=(await request.json().catch(()=>({}))) as {force?:boolean};
 if(!body.force&&stockholmHour(new Date())!==3)return Response.json({skipped:'not 03:00 in Stockholm'});
 const {runNightly}=await import('@/lib/nightly.server');const s=await runNightly(request);return Response.json(s);
}}}});
