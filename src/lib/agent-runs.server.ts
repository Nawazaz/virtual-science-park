import { publicDb } from './db.server';
import type { Json } from '@/integrations/supabase/types';
export type Check={name:string;passed:boolean;detail:string};
/** Records one agent run with the deterministic checks that ran. Never throws: logging must not break the job. */
export async function logRun(run:{agent:string;company_id:string|null;started:number;sources:string[];output:string;checks:Check[];simulated:boolean}){
 try{await publicDb().from('agent_runs').insert({agent:run.agent,company_id:run.company_id,started_at:new Date(run.started).toISOString(),duration_ms:Date.now()-run.started,sources_used:run.sources.slice(0,50),output:run.output.slice(0,20000),checks:run.checks as unknown as Json,simulated:run.simulated});}catch(e){console.error('agent run log failed',e);}
}
