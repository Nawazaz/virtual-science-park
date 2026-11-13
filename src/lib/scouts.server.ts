import { publicDb } from './db.server';
import { simulatedSamples,sourceNames,type OpportunityInput,type SourceName } from './opportunity-rules';
const UA={'User-Agent':'VirtualScienceParkPrototype/1.0'};
const strip=(s:string)=>s.replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/&amp;/g,'&').replace(/&#8211;/g,'–').replace(/&#8217;/g,'’').replace(/&[a-z#0-9]+;/gi,' ').replace(/\s+/g,' ').trim();
const clip=(s:string,n:number)=>s.length>n?s.slice(0,n-1)+'…':s;
async function json(url:string,init?:RequestInit){const r=await fetch(url,{...init,headers:{...UA,...(init?.headers??{})}});if(!r.ok)throw new Error(`${new URL(url).host} returned ${r.status}`);return r.json();}
type VRound={Diarienummer:string;DiarienummerUtlysning:string;Titel:string;TitelEngelska:string;Beskrivning:string;BeskrivningEngelska:string;Oppningsdatum:string|null;Stangningsdatum:string|null;Publik:number;LankLista:{URL:string}[]};
type VCall={Diarienummer:string;Titel:string;TitelEngelska:string;LankLista:{URL:string}[]};
async function vinnova():Promise<OpportunityInput[]>{
 const [rounds,calls]=await Promise.all([json('https://data.vinnova.se/api/ansokningsomgangar/2026-08-01') as Promise<VRound[]>,json('https://data.vinnova.se/api/utlysningar/2026-08-01') as Promise<VCall[]>]);
 const now=Date.now();const soon=now+60*864e5;
 return rounds.filter(r=>r.Publik===1&&r.Stangningsdatum&&Date.parse(r.Stangningsdatum)>now&&(!r.Oppningsdatum||Date.parse(r.Oppningsdatum)<soon)).map(r=>{
  const call=calls.find(c=>c.Diarienummer===r.DiarienummerUtlysning);const en=(s:string)=>s&&s.trim().length>2?s:'';
  const title=en(r.TitelEngelska)||r.Titel;const links=[...r.LankLista,...(call?.LankLista??[])].map(l=>l.URL);
  const page=links.find(u=>/^https:\/\/www\.vinnova\.se\/e\//.test(u))??`https://www.vinnova.se/sok-finansiering/hitta-finansiering/?q=${encodeURIComponent(r.Titel)}`;
  const opening=r.Oppningsdatum&&Date.parse(r.Oppningsdatum)>now?`Opens ${r.Oppningsdatum.slice(0,10)}, `:'';
  return {external_key:`vinnova:${r.Diarienummer}`,type:'funding' as const,title:clip(title,200),summary:clip(strip(en(r.BeskrivningEngelska)||r.Beskrivning),400),source_name:'Vinnova',source_url:page,deadline_or_date:`${opening}Deadline ${r.Stangningsdatum!.slice(0,10)}`,location_mode:'unknown' as const,audience:call?clip(en(call.TitelEngelska)||call.Titel,160):null,simulated:false};
 });
}
const months=['januari','februari','mars','april','maj','juni','juli','augusti','september','oktober','november','december'];
type WpEvent={link:string;date:string;title:{rendered:string};content:{rendered:string}};
async function bspEvents():Promise<OpportunityInput[]>{
 const events=await json('https://www.bluesciencepark.se/wp-json/wp/v2/event?per_page=30&_fields=link,date,title,content') as WpEvent[];
 const today=new Date();today.setHours(0,0,0,0);const out:OpportunityInput[]=[];
 for(const e of events){
  const text=strip(e.content.rendered);const m=text.match(new RegExp(`(\\d{1,2})(?:\\s*[–-]\\s*\\d{1,2})?\\s+(${months.join('|')})(?:\\s+(\\d{4}))?`,'i'));
  if(!m)continue;const posted=new Date(e.date);const month=months.indexOf(m[2]!.toLowerCase());let year=m[3]?Number(m[3]):posted.getFullYear();if(!m[3]&&month<posted.getMonth())year++;
  const when=new Date(year,month,Number(m[1]));if(when<today)continue;
  const place=text.match(/Plats:\s*([^.|]{3,80})/i)?.[1]?.trim()??null;const online=/digitalt|online|teams|zoom|webinar/i.test(text);
  out.push({external_key:`bsp:${e.link}`,type:'event',title:clip(strip(e.title.rendered),200),summary:clip(text,400),source_name:'Blue Science Park events',source_url:e.link,deadline_or_date:`${when.toISOString().slice(0,10)}${place?` · ${place}`:''}`,location_mode:online?'online':place?'in_person':'unknown',audience:null,simulated:false});
 }
 return out;
}
type EuResult={metadata:Record<string,string[]|undefined>;language:string};
async function euTenders():Promise<OpportunityInput[]>{
 const form=new FormData();
 form.append('query',new Blob([JSON.stringify({bool:{must:[{terms:{type:['1','2','8']}},{terms:{status:['31094501','31094502']}},{term:{programmePeriod:'2021 - 2027'}}]}})],{type:'application/json'}));
 form.append('languages',new Blob(['["en"]'],{type:'application/json'}));
 form.append('sort',new Blob([JSON.stringify({field:'deadlineDate',order:'DESC'})],{type:'application/json'}));
 const data=await json('https://api.tech.ec.europa.eu/search-api/prod/rest/search?apiKey=SEDIA&text=***&pageSize=50&pageNumber=1',{method:'POST',body:form}) as {results?:EuResult[]};
 if(!Array.isArray(data.results))throw new Error('EU search returned an unexpected format');
 const now=Date.now();const seen=new Set<string>();const out:OpportunityInput[]=[];
 for(const r of data.results){const id=r.metadata['identifier']?.[0];const title=r.metadata['title']?.[0];if(!id||!title||seen.has(id))continue;
  const deadline=(r.metadata['deadlineDate']??[]).map(d=>Date.parse(d.replace(/([+-]\d{2})(\d{2})$/,'$1:$2'))).filter(d=>d>now).sort((a,b)=>a-b)[0];if(!deadline)continue;seen.add(id);
  out.push({external_key:`eu:${id}`,type:'funding',title:clip(title,200),summary:clip(strip(r.metadata['descriptionByte']?.[0]??r.metadata['callTitle']?.[0]??''),400)||id,source_name:'EU Funding & Tenders',source_url:`https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities/topic-details/${encodeURIComponent(id)}`,deadline_or_date:`Deadline ${new Date(deadline).toISOString().slice(0,10)}`,location_mode:'unknown',audience:r.metadata['frameworkProgramme']?.[0]??null,simulated:false});
  if(out.length>=30)break;}
 return out;
}
const scouts:Record<SourceName,()=>Promise<OpportunityInput[]>>={'Vinnova':vinnova,'Blue Science Park events':bspEvents,'EU Funding & Tenders':euTenders};
export async function refreshSources(){
 const db=publicDb();const report:{source:string;status:string;message:string;found:number}[]=[];
 for(const source of sourceNames){
  let items:OpportunityInput[]=[];let status='ok';let message='';
  try{items=await scouts[source]();message=items.length?`${items.length} current items found`:'Source worked but returned no current items; showing simulated samples';if(!items.length)status='empty';}
  catch(error){status='failed';message=`Source failed: ${error instanceof Error?error.message:'unknown error'}; showing simulated samples`;}
  const rows=items.length?items:simulatedSamples(source);
  const {error:upErr}=await db.from('opportunities').upsert(rows.map(r=>({...r,retrieved_at:new Date().toISOString()})),{onConflict:'external_key'});if(upErr)throw new Error(upErr.message);
  const keep=rows.map(r=>r.external_key);
  const {data:old}=await db.from('opportunities').select('id,external_key').eq('source_name',source);
  const stale=(old??[]).filter(o=>!keep.includes(o.external_key)).map(o=>o.id);
  if(stale.length){const {error}=await db.from('opportunities').delete().in('id',stale);if(error)throw new Error(error.message);}
  await db.from('source_checks').upsert({source_name:source,last_checked:new Date().toISOString(),status,message,found:items.length});
  report.push({source,status,message,found:items.length});
 }
 return report;
}
