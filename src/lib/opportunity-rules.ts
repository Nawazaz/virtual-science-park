export type OpportunityType='funding'|'event'|'testing'|'news';
export type LocationMode='online'|'in_person'|'unknown';
export type OpportunityInput={external_key:string;type:OpportunityType;title:string;summary:string;source_name:string;source_url:string|null;deadline_or_date:string|null;location_mode:LocationMode;audience:string|null;simulated:boolean};
export const sourceNames=['Vinnova','Blue Science Park events','EU Funding & Tenders'] as const;
export type SourceName=typeof sourceNames[number];
export const sourceTypes:Record<SourceName,OpportunityType>={'Vinnova':'funding','Blue Science Park events':'event','EU Funding & Tenders':'funding'};
/** Sample items used only when a source returns nothing. Always flagged simulated. */
export function simulatedSamples(source:SourceName):OpportunityInput[]{
 const type=sourceTypes[source];
 const titles=type==='event'?['Sample: Innovation breakfast','Sample: Test-bed open house','Sample: Partner matchmaking day']:['Sample: Small business innovation grant','Sample: Collaborative R&D call','Sample: Verification funding'];
 return titles.map((title,i)=>({external_key:`simulated:${source}:${i}`,type,title,summary:'Simulated example shown because this source returned no current items. Not a real opportunity.',source_name:source,source_url:null,deadline_or_date:null,location_mode:'unknown',audience:null,simulated:true}));
}
export const typeLabels:Record<string,string>={funding:'Funding',event:'Event',testing:'Testing',news:'News'};
export function badgesFor(o:{type:string;simulated:boolean}){const b:string[]=[typeLabels[o.type]??'Funding'];if(o.simulated)b.push('Simulated');return b;}
export type ItemKind={id:string;kind:string;confirmed_by_user:boolean};
export function itemWeight(i:ItemKind){if(i.confirmed_by_user)return 1;if(i.kind==='fact')return 0.75;if(i.kind==='inferred')return 0.4;return 0;}
const words=(s:string)=>new Set(s.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(w=>w.length>4));
type ScoreInput={aiScore:number;matchedItems:ItemKind[];opportunity:{id:string;type:string;title:string};priorities:string[];downVoted:{id:string;type:string;title:string}[]};
export const priorityForType:Record<string,string>={funding:'funding',event:'events',testing:'testing'};
/** Transparent breakdown of the deterministic score. */
export function scoreBreakdown(input:ScoreInput){
 const w=input.matchedItems.length?Math.max(...input.matchedItems.map(itemWeight)):0.2;
 const ai=Math.max(0,Math.min(100,input.aiScore));const weighted=Math.round(ai*(0.4+0.6*w));
 const wanted=priorityForType[input.opportunity.type];const boost=wanted&&input.priorities.includes(wanted)?10:0;
 let penalty=0;for(const d of input.downVoted){if(d.id===input.opportunity.id)penalty-=25;else if(d.type===input.opportunity.type){const a=words(d.title);const shared=[...words(input.opportunity.title)].filter(x=>a.has(x)).length;if(shared>=2)penalty-=10;}}
 return {ai,evidenceWeight:w,weighted,priorityBoost:boost,feedbackPenalty:penalty,total:Math.max(0,Math.min(100,weighted+boost+penalty))};
}
export function scoreMatch(input:ScoreInput){return scoreBreakdown(input).total;}
/** Never claim eligibility. */
export function hasEligibilityWording(text:string){return sanitizeWording(text)!==text;}
export function sanitizeWording(text:string){return text.replace(/\b(in)?eligib(le|ility)\b/gi,(_m,neg)=>neg?'possibly not a fit':'a possible match').replace(/\bqualif(y|ies|ied)\b/gi,'may fit');}
