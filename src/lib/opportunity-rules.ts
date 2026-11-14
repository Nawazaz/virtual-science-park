export type OpportunityType='funding'|'event'|'testing'|'news';
export type LocationMode='online'|'in_person'|'unknown';
export type OpportunityInput={external_key:string;type:OpportunityType;title:string;summary:string;source_name:string;source_url:string|null;deadline_or_date:string|null;location_mode:LocationMode;audience:string|null;simulated:boolean};
export const NEWS_SOURCE='Blue Science Park news';
export const TESTBED_SOURCE='Curated by Blue Science Park staff';
export const sourceNames=['Vinnova','Blue Science Park events','EU Funding & Tenders',NEWS_SOURCE,TESTBED_SOURCE] as const;
export type SourceName=typeof sourceNames[number];
export const sourceTypes:Record<SourceName,OpportunityType>={'Vinnova':'funding','Blue Science Park events':'event','EU Funding & Tenders':'funding',[NEWS_SOURCE]:'news',[TESTBED_SOURCE]:'testing'};
/** Older sample rows owned by a source; removed once that source returns real items. */
export const legacySourceNames:Partial<Record<SourceName,string[]>>={[NEWS_SOURCE]:['Sample trend digest'],[TESTBED_SOURCE]:['Sample testing catalogue']};
const stripHtml=(s:string)=>s.replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/&amp;/g,'&').replace(/&#8211;/g,'–').replace(/&#82(16|17);/g,'’').replace(/&#82(20|21);/g,'"').replace(/&[a-z#0-9]+;/gi,' ').replace(/\s+/g,' ').trim();
export type WpPost={link:string;date:string;title:{rendered:string};excerpt:{rendered:string}};
/** Real news: last 120 days, HTML stripped, deduplicated by link. */
export function newsFromPosts(posts:WpPost[],now=new Date()):OpportunityInput[]{
 const cutoff=now.getTime()-120*864e5;const seen=new Set<string>();const out:OpportunityInput[]=[];
 for(const p of posts){if(!p.link||seen.has(p.link))continue;const t=Date.parse(p.date);if(!(t>=cutoff))continue;seen.add(p.link);
  out.push({external_key:`bspnews:${p.link}`,type:'news',title:stripHtml(p.title.rendered).slice(0,200),summary:stripHtml(p.excerpt.rendered).slice(0,400),source_name:NEWS_SOURCE,source_url:p.link,deadline_or_date:p.date.slice(0,10),location_mode:'unknown',audience:null,simulated:false});}
 return out;
}
export type Testbed={id:string;name:string;organisation:string;description:string;what_you_can_test:string;how_to_start:string;location:string;url:string;active:boolean};
export type TestbedOpportunity=OpportunityInput&{purpose:string|null;key_requirements:string|null};
export function testbedOpportunities(rows:Testbed[]):TestbedOpportunity[]{
 return rows.filter(r=>r.active&&/^https?:\/\//i.test(r.url)).map(r=>({external_key:`testbed:${r.id}`,type:'testing',title:r.name,summary:[r.description,r.organisation&&`Run by ${r.organisation}.`].filter(Boolean).join(' ').slice(0,400),source_name:TESTBED_SOURCE,source_url:r.url,deadline_or_date:null,location_mode:/online|remote|digital/i.test(r.location)?'online':r.location?'in_person':'unknown',audience:r.location||null,simulated:false,purpose:r.what_you_can_test||null,key_requirements:r.how_to_start||null}));
}
const testingSamples:[string,string,string,string,LocationMode,string][]=[
 ['Sample: Maritime sensor testbed in Karlskrona harbour','Simulated example of an open water testbed for sensors, autonomous vessels and underwater communication.','Validate maritime products in real sea conditions','Test plan, safety assessment, booking two weeks ahead','in_person','SMEs and research groups'],
 ['Sample: 5G and edge computing lab','Simulated example of a lab with private 5G network and edge servers for prototyping connected products.','Prototype and measure connected devices','Device ready for lab integration','in_person','Tech companies'],
 ['Sample: Water treatment pilot environment','Simulated example of a pilot site for testing stormwater, wastewater and water reuse solutions at small scale.','Run pilots on water and environmental technology','Pilot proposal and environmental permit check','in_person','Water and cleantech companies'],
 ['Sample: Digital twin and visualisation studio','Simulated example of a studio for building digital twins, VR walkthroughs and simulation of physical systems.','Demonstrate and simulate products before building','Data or CAD models of the system','online','Industry and public sector']];
/** Sample items used only when a source returns nothing. Always flagged simulated. */
export function simulatedSamples(source:SourceName):(OpportunityInput&{purpose?:string|null;key_requirements?:string|null})[]{
 const type=sourceTypes[source];
 if(type==='testing')return testingSamples.map(([title,summary,purpose,key_requirements,location_mode,audience],i)=>({external_key:`simulated:testing:${i}`,type,title,summary,purpose,key_requirements,source_name:'Sample testing catalogue',source_url:null,deadline_or_date:'Open booking',location_mode,audience,simulated:true}));
 if(type==='news')return ['Sample: Baltic blue economy investments rising','Sample: New EU rules on water reuse take effect','Sample: Defence and security tech clusters expand'].map((title,i)=>({external_key:`simulated:${source}:${i}`,type,title,summary:'Simulated news item shown because the news source returned nothing. Not real news.',source_name:source,source_url:null,deadline_or_date:null,location_mode:'unknown',audience:null,simulated:true}));
 const titles=type==='event'?['Sample: Innovation breakfast','Sample: Test-bed open house','Sample: Partner matchmaking day']:['Sample: Small business innovation grant','Sample: Collaborative R&D call','Sample: Verification funding'];
 return titles.map((title,i)=>({external_key:`simulated:${source}:${i}`,type,title,summary:'Simulated example shown because this source returned no current items. Not a real opportunity.',source_name:source,source_url:null,deadline_or_date:null,location_mode:'unknown',audience:null,simulated:true}));
}
export const typeLabels:Record<string,string>={funding:'Funding',event:'Event',testing:'Testing',news:'News'};
export function badgesFor(o:{type:string;simulated:boolean}){const b:string[]=[typeLabels[o.type]??'Funding'];if(o.simulated)b.push('Simulated');return b;}
export type ItemKind={id:string;kind:string;confirmed_by_user:boolean};
export function itemWeight(i:ItemKind){if(i.confirmed_by_user)return 1;if(i.kind==='fact')return 0.85;if(i.kind==='inferred')return 0.6;return 0;}
export const NO_BASIS_WEIGHT=0.4;
export const PRIORITY_BOOST=15;
export const DOWN_VOTE_PENALTY=-30;
export const SIMILAR_PENALTY=-10;
/** A match with no valid matched profile item gets the 'Weak basis' badge. */
export function isWeakBasis(matchedItemIds:string[]|null|undefined){return !matchedItemIds||matchedItemIds.length===0;}
const words=(s:string)=>new Set(s.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(w=>w.length>4));
type ScoreInput={aiScore:number;matchedItems:ItemKind[];opportunity:{id:string;type:string;title:string};priorities:string[];downVoted:{id:string;type:string;title:string}[]};
export const priorityForType:Record<string,string>={funding:'funding',event:'events',testing:'testing'};
/** Transparent breakdown of the deterministic score. */
export function scoreBreakdown(input:ScoreInput){
 const valid=input.matchedItems.map(itemWeight).filter(x=>x>0);const w=valid.length?Math.max(...valid):NO_BASIS_WEIGHT;
 return applyScoreRules({ai:input.aiScore,evidenceWeight:w,weakBasis:!valid.length},input);
}
export type RuleInput=Pick<ScoreInput,'opportunity'|'priorities'|'downVoted'>;
/** The code-only part of the score. Re-ranking after a vote or priority change reuses the stored AI score and evidence weight, so no AI call is needed. */
export function applyScoreRules(base:{ai:number;evidenceWeight:number;weakBasis:boolean},input:RuleInput){
 const ai=Math.max(0,Math.min(100,base.ai));const w=base.evidenceWeight;const weighted=Math.round(ai*w);
 const wanted=priorityForType[input.opportunity.type];const boost=wanted&&input.priorities.includes(wanted)?PRIORITY_BOOST:0;
 let penalty=0;for(const d of input.downVoted){if(d.id===input.opportunity.id)penalty+=DOWN_VOTE_PENALTY;else if(d.type===input.opportunity.type){const a=words(d.title);const shared=[...words(input.opportunity.title)].filter(x=>a.has(x)).length;if(shared>=2)penalty+=SIMILAR_PENALTY;}}
 return {ai,evidenceWeight:w,weakBasis:base.weakBasis,weighted,priorityBoost:boost,feedbackPenalty:penalty,total:Math.max(0,Math.min(100,weighted+boost+penalty))};
}
export function scoreMatch(input:ScoreInput){return scoreBreakdown(input).total;}
/** Never claim eligibility. */
export function hasEligibilityWording(text:string){return sanitizeWording(text)!==text;}
export function sanitizeWording(text:string){return text.replace(/\b(in)?eligib(le|ility)\b/gi,(_m,neg)=>neg?'possibly not a fit':'a possible match').replace(/\bqualif(y|ies|ied)\b/gi,'may fit').replace(/\bguarantee(d|s)?\b/gi,'possible');}
