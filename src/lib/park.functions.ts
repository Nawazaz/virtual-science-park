import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { connectionBasis,completeness,parseMemberUrls,itemsWithTopics } from './park-rules';
const id=z.object({id:z.string().uuid()});
export const getLatestRun=createServerFn({method:'GET'}).inputValidator(z.object({agent:z.string().max(60),company_id:z.string().uuid().nullable()})).handler(async({data})=>{
 const {publicDb}=await import('./db.server');let q=publicDb().from('agent_runs').select('*').eq('agent',data.agent).order('started_at',{ascending:false}).limit(1);q=data.company_id?q.eq('company_id',data.company_id):q.is('company_id',null);
 const {data:rows,error}=await q;if(error)throw new Error(error.message);return rows?.[0]??null;
});
export const listRuns=createServerFn({method:'GET'}).handler(async()=>{const {publicDb}=await import('./db.server');const {data,error}=await publicDb().from('agent_runs').select('id,agent,company_id,started_at,duration_ms,sources_used,output,checks,simulated,companies(name)').order('started_at',{ascending:false}).limit(40);if(error)throw new Error(error.message);return data??[];});
export const getProfileChanges=createServerFn({method:'GET'}).inputValidator(id).handler(async({data})=>{const {publicDb}=await import('./db.server');const {data:rows,error}=await publicDb().from('profile_changes').select('*').eq('company_id',data.id).order('changed_at',{ascending:false}).limit(30);if(error)throw new Error(error.message);return rows??[];});
export const listOpportunities=createServerFn({method:'GET'}).handler(async()=>{const {publicDb}=await import('./db.server');const {data,error}=await publicDb().from('opportunities').select('*').order('retrieved_at',{ascending:false});if(error)throw new Error(error.message);return data??[];});
async function allProfiles(){const {publicDb}=await import('./db.server');const {data,error}=await publicDb().from('companies').select('id,name,website_url,profile_items(id,field,value,kind,confirmed_by_user)');if(error)throw new Error(error.message);return data??[];}
export const getConnections=createServerFn({method:'GET'}).inputValidator(id).handler(async({data})=>{
 const all=await allProfiles();const me=all.find(c=>c.id===data.id);if(!me)return [];
 return all.filter(c=>c.id!==me.id).map(c=>{const basis=connectionBasis(me.profile_items,c.profile_items);return {id:c.id,name:c.name,website_url:c.website_url,basis,mine:itemsWithTopics(me.profile_items,basis),theirs:itemsWithTopics(c.profile_items,basis)};}).filter(c=>c.basis.length>0).sort((a,b)=>b.basis.length-a.basis.length);
});
export const getAllConnections=createServerFn({method:'GET'}).handler(async()=>{
 const all=await allProfiles();const pairs:{a:{id:string;name:string};b:{id:string;name:string};basis:string[]}[]=[];
 for(let i=0;i<all.length;i++)for(let j=i+1;j<all.length;j++){const basis=connectionBasis(all[i]!.profile_items,all[j]!.profile_items);if(basis.length)pairs.push({a:{id:all[i]!.id,name:all[i]!.name},b:{id:all[j]!.id,name:all[j]!.name},basis});}
 return {nodes:all.map(c=>({id:c.id,name:c.name,built:c.profile_items.some(i=>i.kind!=='missing')})),pairs:pairs.sort((x,y)=>y.basis.length-x.basis.length).slice(0,30)};
});
export const getDashboard=createServerFn({method:'GET'}).inputValidator(id).handler(async({data})=>{
 const {publicDb}=await import('./db.server');const db=publicDb();
 const [c,m,o,ch]=await Promise.all([
  db.from('companies').select('id,name,website_url,profile_items(id,field,value,kind,confirmed_by_user,retrieved_at,source_url,evidence_quote)').eq('id',data.id).maybeSingle(),
  db.from('matches').select('score,reason,next_step,matched_profile_item_ids,opportunity:opportunities(id,type,title,deadline_or_date,source_name,source_url,simulated)').eq('company_id',data.id).order('score',{ascending:false}).limit(5),
  db.from('opportunities').select('id,type,title,retrieved_at,simulated,source_name').order('retrieved_at',{ascending:false}),
  db.from('profile_changes').select('*').eq('company_id',data.id).order('changed_at',{ascending:false}).limit(10)]);
 for(const r of [c,m,o,ch])if(r.error)throw new Error(r.error.message);
 if(!c.data)return null;const items=c.data.profile_items;const opps=o.data??[];
 const counts={funding:0,event:0,testing:0,news:0} as Record<string,number>;for(const x of opps)counts[x.type]=(counts[x.type]??0)+1;
 const summary=items.find(i=>i.field==='what_it_does'&&i.kind!=='missing')??null;
 const updated=items.reduce<string|null>((a,i)=>!a||i.retrieved_at>a?i.retrieved_at:a,null);
 return {company:{id:c.data.id,name:c.data.name,website_url:c.data.website_url},summary,completeness:completeness(items),updated,itemCount:items.length,top:(m.data??[]).filter(x=>x.opportunity),counts,changes:ch.data??[],newOpps:opps.slice(0,6)};
});
export const importMembers=createServerFn({method:'POST'}).inputValidator(z.object({text:z.string().max(20000)})).handler(async({data})=>{
 const rows=parseMemberUrls(data.text);if(!rows.length)throw new Error('No valid member page addresses found.');
 const {publicDb}=await import('./db.server');const db=publicDb();const {data:existing}=await db.from('companies').select('name,member_page_url');
 const fresh=rows.filter(r=>!(existing??[]).some(e=>e.member_page_url===r.member_page_url||e.name.toLowerCase()===r.name.toLowerCase()));
 if(fresh.length){const {error}=await db.from('companies').insert(fresh.map(r=>({name:r.name,website_url:r.member_page_url,member_page_url:r.member_page_url})));if(error)throw new Error(error.message);}
 return {added:fresh.length,skipped:rows.length-fresh.length};
});
export const getChat=createServerFn({method:'GET'}).inputValidator(id).handler(async({data})=>{const {publicDb}=await import('./db.server');const {data:rows,error}=await publicDb().from('chat_messages').select('*').eq('company_id',data.id).order('created_at').limit(60);if(error)throw new Error(error.message);return rows??[];});
export const askAssistant=createServerFn({method:'POST'}).inputValidator(z.object({company_id:z.string().uuid(),question:z.string().trim().min(1).max(1000)})).handler(async({data})=>{
 const {answerQuestion}=await import('./assistant.server');return answerQuestion(data.company_id,data.question);
});
export const runBoundaryTestsFn=createServerFn({method:'POST'}).handler(async()=>{const {runBoundaryTests}=await import('./assistant.server');const {boundaryTests}=await import('./park-rules');return runBoundaryTests(boundaryTests);});
export const getStaffOverview=createServerFn({method:'GET'}).handler(async()=>{
 const {publicDb}=await import('./db.server');const db=publicDb();
 const [c,m]=await Promise.all([db.from('companies').select('id,name,profile_items(field,value,kind)'),db.from('matches').select('company_id,score,opportunity:opportunities(id,title,type,deadline_or_date,simulated,source_url)').gte('score',50)]);
 if(c.error)throw new Error(c.error.message);if(m.error)throw new Error(m.error.message);
 const {tokens}=await import('./park-rules');const topic=new Map<string,Set<string>>();
 for(const co of c.data??[])for(const i of co.profile_items)if(i.kind!=='missing'&&['technologies','application_areas','markets_customers'].includes(i.field))for(const t of tokens(i.value)){if(!topic.has(t))topic.set(t,new Set());topic.get(t)!.add(co.name);}
 const topics=[...topic].map(([t,s])=>({topic:t,members:[...s]})).filter(t=>t.members.length>1).sort((a,b)=>b.members.length-a.members.length).slice(0,12);
 const dl=new Map<string,{o:any;members:Set<string>}>();for(const x of m.data??[]){if(!x.opportunity||x.opportunity.type==='news')continue;const e=dl.get(x.opportunity.id)??{o:x.opportunity,members:new Set()};const n=(c.data??[]).find(co=>co.id===x.company_id)?.name;if(n)e.members.add(n);dl.set(x.opportunity.id,e);}
 const deadlines=[...dl.values()].map(e=>({...e.o,members:[...e.members]})).filter(e=>e.members.length>1).sort((a,b)=>b.members.length-a.members.length).slice(0,10);
 const unbuilt=(c.data??[]).filter(co=>!co.profile_items.some(i=>i.kind!=='missing')).map(co=>({id:co.id,name:co.name}));
 return {topics,deadlines,unbuilt};
});
export const getQualityMetrics=createServerFn({method:'GET'}).handler(async()=>{
 const {publicDb}=await import('./db.server');const db=publicDb();
 const [runs,items,matches,bt]=await Promise.all([
  db.from('agent_runs').select('company_id,checks,started_at').eq('agent','Profile builder').order('started_at',{ascending:false}).limit(100),
  db.from('profile_items').select('kind,source_url,evidence_quote,confirmed_by_user'),
  db.from('matches').select('company_id,score,matched_profile_item_ids'),
  db.from('agent_runs').select('output,checks,started_at').eq('agent','Boundary tests').order('started_at',{ascending:false}).limit(1)]);
 for(const r of [runs,items,matches,bt])if(r.error)throw new Error(r.error.message);
 // Profile accuracy: latest build per company, facts whose exact quote was found / facts the AI claimed.
 const seen=new Set<string>();let ok=0,claimed=0;for(const r of runs.data??[]){if(!r.company_id||seen.has(r.company_id))continue;seen.add(r.company_id);const c=(r.checks as {name:string;detail:string}[]).find(x=>x.name==='Quotes found on source page');const m=c?.detail.match(/(\d+) of (\d+)/);if(m){ok+=Number(m[1]);claimed+=Number(m[2]);}}
 // Relevance: per company, top-5 matches backed by at least one profile item.
 const by=new Map<string,{score:number;n:number}[]>();for(const m of matches.data??[]){const l=by.get(m.company_id)??[];l.push({score:m.score,n:m.matched_profile_item_ids.length});by.set(m.company_id,l);}
 const rel=[...by.values()].map(l=>l.sort((a,b)=>b.score-a.score).slice(0,5).filter(x=>x.n>0).length);
 const facts=(items.data??[]).filter(i=>i.kind==='fact'&&!i.confirmed_by_user);const traced=facts.filter(i=>i.source_url&&i.evidence_quote).length;
 const last=bt.data?.[0];const btPassed=last?(last.checks as {passed:boolean}[]).filter(c=>c.passed).length:null;
 return {
  accuracy:{value:claimed?Math.round(100*ok/claimed):null,detail:`${ok} of ${claimed} facts claimed by the AI had their exact quote on the cited page (latest build for ${seen.size} companies).`},
  relevance:{value:rel.length?rel.reduce((a,b)=>a+b,0)/rel.length:null,detail:`Average number of top-5 possible matches backed by at least one profile item, across ${rel.length} companies.`},
  traceability:{value:facts.length?Math.round(100*traced/facts.length):null,detail:`${traced} of ${facts.length} facts shown have both a source link and an exact quote.`},
  limits:{value:btPassed,detail:last?`Latest boundary test run on ${new Date(last.started_at).toISOString().slice(0,10)}: ${last.output}.`:'Boundary tests have not been run yet. Open the Boundary tests tab and press Run all.'},
 };
});
