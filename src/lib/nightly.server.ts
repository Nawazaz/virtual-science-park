import { publicDb } from './db.server';
import { logRun, type Check } from './agent-runs.server';
import type { NightlySummary } from './nightly-rules';
/** Refresh sources, rebuild every profile, re-match every company. One company at a time; failures are recorded, never fatal. */
export async function runNightly(request:Request,emit:(e:object)=>void=()=>{}){
 const started=Date.now();const since=new Date(started).toISOString();const db=publicDb();
 const failures:NightlySummary['failures']=[];const checks:Check[]=[];const sources=new Set<string>();
 const {data:before}=await db.from('opportunities').select('external_key');const known=new Set((before??[]).map(o=>o.external_key));
 emit({type:'progress',message:'Refreshing sources…'});
 try{const {refreshSources}=await import('./scouts.server');const r=await refreshSources();r.forEach(x=>sources.add(x.source));const bad=r.filter(x=>x.status!=='ok');checks.push({name:'1. Sources refreshed',passed:true,detail:bad.length?`${r.length-bad.length}/${r.length} live; ${bad.map(b=>b.source).join(', ')} showing samples`:`${r.length}/${r.length} sources live`});}
 catch(e){const m=e instanceof Error?e.message:'error';failures.push({step:'sources',message:m});checks.push({name:'1. Sources refreshed',passed:false,detail:m});}
 const {data:after}=await db.from('opportunities').select('external_key,simulated');const newOpps=(after??[]).filter(o=>!known.has(o.external_key)&&!o.simulated).length;
 const {data:companies}=await db.from('companies').select('id,name').order('name');const list=companies??[];
 const {buildProfile}=await import('./build-profile.server');const {runMatcher}=await import('./matcher.server');
 let built=0,matched=0;
 for(const c of list){emit({type:'progress',message:`Rebuilding ${c.name}…`});try{await buildProfile(c.id,request,()=>{});built++;}catch(e){failures.push({step:'profile',company:c.name,message:e instanceof Error?e.message:'error'});}}
 checks.push({name:'2. Profiles rebuilt',passed:built===list.length,detail:`${built}/${list.length} rebuilt; confirmed items kept`});
 for(const c of list){emit({type:'progress',message:`Matching ${c.name}…`});try{await runMatcher(c.id,request,()=>{});matched++;}catch(e){failures.push({step:'matching',company:c.name,message:e instanceof Error?e.message:'error'});}}
 checks.push({name:'3. Matching re-run',passed:matched===list.length,detail:`${matched}/${list.length} companies matched`});
 const {count}=await db.from('profile_changes').select('id',{count:'exact',head:true}).gte('changed_at',since);
 const summary:NightlySummary={companies:list.length,changes:count??0,newOpportunities:newOpps,failures};
 checks.push({name:'Failures recorded',passed:failures.length===0,detail:failures.length?failures.map(f=>`${f.step}${f.company?` (${f.company})`:''}: ${f.message}`).join('; ').slice(0,900):'No failures'});
 await logRun({agent:'Nightly run',company_id:null,started,sources:[...sources],output:JSON.stringify({summary:`${list.length} companies processed · ${summary.changes} profile changes · ${newOpps} new opportunities · ${failures.length} failures · ${((Date.now()-started)/1000).toFixed(0)} s`,...summary}),checks,simulated:false});
 emit({type:'done',...summary});return summary;
}
