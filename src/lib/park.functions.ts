import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { completeness,parseMemberUrls } from './park-rules';
import { buildGraph,minTopLinkScore,shownLinks,topicLabel } from './knowledge-graph';
import { canActAs, canAskAbout, canSeeProfile, isPublicItem, notAllowedMessage, runVisible } from './access-rules';
import { isListed } from './hidden-companies';
const id=z.object({id:z.string().uuid()});
const viewer=async()=>(await import('./access.server')).currentViewer();
export const getLatestRun=createServerFn({method:'GET'}).inputValidator(z.object({agent:z.string().max(60),company_id:z.string().uuid().nullable()})).handler(async({data})=>{
 if(!runVisible(await viewer(),data))return null;
 const {publicDb}=await import('./db.server');let q=publicDb().from('agent_runs').select('*').eq('agent',data.agent).order('started_at',{ascending:false}).limit(1);q=data.company_id?q.eq('company_id',data.company_id):q.is('company_id',null);
 const {data:rows,error}=await q;if(error)throw new Error(error.message);return rows?.[0]??null;
});
export const listRuns=createServerFn({method:'GET'}).handler(async()=>{const {publicDb}=await import('./db.server');const {data,error}=await publicDb().from('agent_runs').select('id,agent,company_id,started_at,duration_ms,sources_used,output,checks,simulated,companies(name)').order('started_at',{ascending:false}).limit(40);if(error)throw new Error(error.message);const v=await viewer();return (data??[]).filter(r=>runVisible(v,r)&&(r.company_id===null||isListed(r.companies)));});
export const getProfileChanges=createServerFn({method:'GET'}).inputValidator(id).handler(async({data})=>{if(!canSeeProfile(await viewer(),data.id))return [];const {publicDb}=await import('./db.server');const {data:rows,error}=await publicDb().from('profile_changes').select('*').eq('company_id',data.id).order('changed_at',{ascending:false}).limit(30);if(error)throw new Error(error.message);return rows??[];});
export const listOpportunities=createServerFn({method:'GET'}).handler(async()=>{const {publicDb}=await import('./db.server');const {data,error}=await publicDb().from('opportunities').select('*').order('retrieved_at',{ascending:false});if(error)throw new Error(error.message);return data??[];});
async function allProfiles(){const {publicDb}=await import('./db.server');const {data,error}=await publicDb().from('companies').select('id,name,website_url,profile_items(id,field,value,kind,confirmed_by_user)');if(error)throw new Error(error.message);return (data??[]).filter(isListed);}
// Connections compare public items only; a company's own edits count for itself, never for others.
type Profiled=Awaited<ReturnType<typeof allProfiles>>[number];
const publicOnly=(c:Profiled):Profiled=>({...c,profile_items:c.profile_items.filter(isPublicItem)});
// Knowledge graph (src/lib/knowledge-graph.ts): companies -> topics from profile facts, plus members named in a profile.
export const getConnections=createServerFn({method:'GET'}).inputValidator(id).handler(async({data})=>{
 const v=await viewer();const all=await allProfiles();const found=all.find(c=>c.id===data.id);if(!found)return [];const me=canSeeProfile(v,found.id)?found:publicOnly(found);
 const others=all.map(publicOnly).filter(c=>c.id!==me.id);const g=buildGraph([me,...others]);
 const support=(cid:string,shared:string[])=>(g.edges.get(cid)??[]).filter(e=>shared.includes(e.topic)).flatMap(e=>e.items).filter((x,i,a)=>a.findIndex(y=>y.id===x.id)===i).slice(0,4);
 return g.links.filter(l=>(l.a===me.id||l.b===me.id)&&(l.named.length>0||l.score>=minTopLinkScore)).slice(0,10).map(l=>{const c=others.find(o=>o.id===(l.a===me.id?l.b:l.a))!;
  return {id:c.id,name:c.name,website_url:c.website_url,basis:l.shared.map(topicLabel),score:l.score,named:l.named.map(n=>n.item.value),mine:support(me.id,l.shared),theirs:support(c.id,l.shared)};});
});
export const getAllConnections=createServerFn({method:'GET'}).handler(async()=>{
 const all=(await allProfiles()).map(publicOnly);const g=buildGraph(all);const nameOf=(cid:string)=>all.find(c=>c.id===cid)!.name;
 return {nodes:all.map(c=>({id:c.id,name:c.name,built:c.profile_items.some(i=>i.kind!=='missing'),topics:g.edges.get(c.id)!.map(e=>e.topic)})),
  topics:g.topics.map(t=>({id:t.id,label:t.label,category:t.category,companies:t.companies})),
  pairs:shownLinks(g).map(l=>({a:{id:l.a,name:nameOf(l.a)},b:{id:l.b,name:nameOf(l.b)},basis:l.shared.map(topicLabel),score:l.score,named:l.named.map(n=>n.item.value)}))};
});
export const getDashboard=createServerFn({method:'GET'}).inputValidator(id).handler(async({data})=>{
 const {publicDb}=await import('./db.server');const db=publicDb();
 const [c,m,o,ch]=await Promise.all([
  db.from('companies').select('id,name,website_url,profile_items(id,field,value,kind,confirmed_by_user,retrieved_at,source_url,evidence_quote)').eq('id',data.id).maybeSingle(),
  db.from('matches').select('score,reason,next_step,matched_profile_item_ids,opportunity:opportunities(id,type,title,deadline_or_date,source_name,source_url,simulated)').eq('company_id',data.id).order('score',{ascending:false}).limit(5),
  db.from('opportunities').select('id,type,title,retrieved_at,simulated,source_name').order('retrieved_at',{ascending:false}),
  db.from('profile_changes').select('*').eq('company_id',data.id).order('changed_at',{ascending:false}).limit(10)]);
 for(const r of [c,m,o,ch])if(r.error)throw new Error(r.error.message);
 if(!c.data||!isListed(c.data))return null;const seePrivate=canSeeProfile(await viewer(),data.id);
 if(!seePrivate){m.data=[];ch.data=[];}
 const items=seePrivate?c.data.profile_items:c.data.profile_items.filter(isPublicItem);const opps=o.data??[];
 const counts={funding:0,event:0,testing:0,news:0} as Record<string,number>;for(const x of opps)counts[x.type]=(counts[x.type]??0)+1;
 const summary=items.find(i=>i.field==='what_it_does'&&i.kind!=='missing')??null;
 const updated=items.reduce<string|null>((a,i)=>!a||i.retrieved_at>a?i.retrieved_at:a,null);
 return {company:{id:c.data.id,name:c.data.name,website_url:c.data.website_url},summary,completeness:completeness(items),updated,itemCount:items.length,top:(m.data??[]).filter(x=>x.opportunity),counts,changes:ch.data??[],newOpps:opps.slice(0,6),locked:!seePrivate};
});
export const importMembers=createServerFn({method:'POST'}).inputValidator(z.object({text:z.string().max(20000)})).handler(async({data})=>{
 const {requireStaff}=await import('./access.server');requireStaff();
 const rows=parseMemberUrls(data.text);if(!rows.length)throw new Error('No valid member page addresses found.');
 const {publicDb}=await import('./db.server');const db=publicDb();const {data:existing}=await db.from('companies').select('name,member_page_url');
 const fresh=rows.filter(r=>!(existing??[]).some(e=>e.member_page_url===r.member_page_url||e.name.toLowerCase()===r.name.toLowerCase()));
 if(fresh.length){const {error}=await db.from('companies').insert(fresh.map(r=>({name:r.name,website_url:r.member_page_url,member_page_url:r.member_page_url})));if(error)throw new Error(error.message);}
 return {added:fresh.length,skipped:rows.length-fresh.length};
});
export const getChat=createServerFn({method:'GET'}).inputValidator(id).handler(async({data})=>{if(!canActAs(await viewer(),data.id))return [];const {publicDb}=await import('./db.server');const {data:rows,error}=await publicDb().from('chat_messages').select('*').eq('company_id',data.id).order('created_at').limit(60);if(error)throw new Error(error.message);return rows??[];});
// history: the staff conversation so far, kept in the browser (staff chats are never saved to the company's chat).
const chatHistory=z.array(z.object({role:z.enum(['user','assistant']),content:z.string().max(4000)})).max(12).optional();
export const askAssistant=createServerFn({method:'POST'}).inputValidator(z.object({company_id:z.string().uuid(),question:z.string().trim().min(1).max(1000),history:chatHistory})).handler(async({data})=>{
 const v=await viewer();if(!canAskAbout(v,data.company_id))throw new Error(notAllowedMessage);
 const {answerQuestion}=await import('./assistant.server');
 return answerQuestion(data.company_id,data.question,canActAs(v,data.company_id)?{asker:'company'}:{asker:'staff',history:data.history??[]});
});
/** Staff only: questions about all members at once ("Whole park" in Viewing on the Assistant page). */
export const askParkAssistant=createServerFn({method:'POST'}).inputValidator(z.object({question:z.string().trim().min(1).max(1000),history:chatHistory})).handler(async({data})=>{
 const {requireStaff}=await import('./access.server');requireStaff();
 const {answerParkQuestion}=await import('./assistant.server');return answerParkQuestion(data.question,data.history??[]);
});
export const runBoundaryTestsFn=createServerFn({method:'POST'}).handler(async()=>{const {requireSignedIn}=await import('./access.server');requireSignedIn();const {runBoundaryTests}=await import('./assistant.server');const {boundaryTests}=await import('./park-rules');return runBoundaryTests(boundaryTests);});
export const getStaffOverview=createServerFn({method:'GET'}).handler(async()=>{
 if((await viewer()).kind!=='staff')return null;
 const {publicDb}=await import('./db.server');const db=publicDb();
 const [c,m]=await Promise.all([db.from('companies').select('id,name,profile_items(field,value,kind)'),db.from('matches').select('company_id,score,opportunity:opportunities(id,title,type,deadline_or_date,simulated,source_url)').gte('score',50)]);
 if(c.error)throw new Error(c.error.message);if(m.error)throw new Error(m.error.message);c.data=(c.data??[]).filter(isListed);
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
  accuracy:{value:claimed?Math.round(100*ok/claimed):null,detail:`${ok} of ${claimed} facts claimed by the AI had their exact quote on the cited page (latest build for ${seen.size} companies). The others were downgraded to Inferred. This shows the quote check works; it does not show that a quote supports the value. A person checked that by hand: see docs/EVALUATION.md.`},
  relevance:{value:rel.length?rel.reduce((a,b)=>a+b,0)/rel.length:null,detail:`Average number of top-5 possible matches that cite at least one profile item, across ${rel.length} companies. It does not show that a match is useful; a person marked each top 5 relevant or not: see docs/EVALUATION.md.`},
  traceability:{value:facts.length?Math.round(100*traced/facts.length):null,detail:`${traced} of ${facts.length} facts shown have both a source link and an exact quote. This should always be 100%, because the code downgrades any fact without a verified quote; a lower number would mean that rule broke.`},
  limits:{value:btPassed,detail:last?`Latest boundary test run on ${new Date(last.started_at).toISOString().slice(0,10)}: ${last.output}.`:'Boundary tests have not been run yet. Open the Boundary tests tab and press Run all.'},
 };
});
