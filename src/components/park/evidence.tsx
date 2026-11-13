import { CheckCircle2, CircleDashed, FlaskConical, Lightbulb, Quote, ShieldCheck, ExternalLink } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
export type EvidenceKind='fact'|'inferred'|'missing'|'confirmed'|'simulated';
const meta:Record<EvidenceKind,{label:string;tip:string;Icon:typeof Quote;cls:string}>={
 fact:{label:'Fact',tip:'Stated on a public page; the exact quote was found on the source.',Icon:Quote,cls:'ink-fact border-fact/50 bg-fact/10'},
 inferred:{label:'Inferred',tip:'Our interpretation of public text, not stated outright by the company.',Icon:Lightbulb,cls:'ink-inferred border-inferred/50 bg-inferred/10'},
 missing:{label:'Missing',tip:'Not found in the public sources we reviewed.',Icon:CircleDashed,cls:'ink-missing border-missing/50 bg-missing/10'},
 confirmed:{label:'Confirmed',tip:'Added or confirmed by the company itself.',Icon:ShieldCheck,cls:'ink-confirmed border-confirmed/50 bg-confirmed/10'},
 simulated:{label:'Simulated',tip:'Realistic sample data shown where real data does not exist yet. Not real.',Icon:FlaskConical,cls:'ink-simulated border-simulated/60 bg-simulated/10'},
};
export function kindOf(i:{kind:string;confirmed_by_user?:boolean}):EvidenceKind{return i.confirmed_by_user?'confirmed':(i.kind as EvidenceKind)in meta?(i.kind as EvidenceKind):'missing';}
export function EvidenceBadge({kind,className}:{kind:EvidenceKind;className?:string}){const m=meta[kind];return <Tooltip><TooltipTrigger asChild><span tabIndex={0} className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold leading-5 whitespace-nowrap',m.cls,className)}><m.Icon size={12} aria-hidden/>{m.label}</span></TooltipTrigger><TooltipContent className="max-w-60">{m.tip}</TooltipContent></Tooltip>;}
export const evidenceLegend=(Object.keys(meta) as EvidenceKind[]).map(k=>({kind:k,tip:meta[k].tip}));
export function SimulatedBadge(){return <EvidenceBadge kind="simulated"/>;}
export function fmtDate(d:string|null|undefined){if(!d)return '';const x=new Date(d);return isNaN(+x)?d:x.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});}
export function domainOf(u:string|null|undefined){if(!u)return '';try{return new URL(u).hostname.replace(/^www\./,'');}catch{return u;}}
export function SourceChip({url,retrieved,label}:{url:string|null|undefined;retrieved?:string|null|undefined;label?:string|undefined}){
 if(!url)return <span className="inline-flex items-center gap-1 rounded-md border border-dashed px-2 py-0.5 text-[11px] text-muted-foreground">{label??'No source link'}</span>;
 return <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full items-center gap-1.5 rounded-md border bg-muted/60 px-2 py-0.5 text-[11px] text-muted-foreground hover:border-primary hover:text-primary"><span className="truncate font-medium">{label??domainOf(url)}</span>{retrieved&&<span className="whitespace-nowrap">· Retrieved {fmtDate(retrieved)}</span>}<ExternalLink size={11} aria-hidden/><span className="sr-only">(opens in new tab)</span></a>;
}
export function Ring({value,size=64,label,stroke=6,tone='var(--primary)'}:{value:number;size?:number;label?:string;stroke?:number;tone?:string}){
 const r=(size-stroke)/2;const c=2*Math.PI*r;const v=Math.max(0,Math.min(100,value));
 return <div className="relative inline-grid place-items-center" style={{width:size,height:size}} role="img" aria-label={`${label??'Score'} ${v} out of 100`}><svg width={size} height={size} className="-rotate-90"><circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke}/><circle cx={size/2} cy={size/2} r={r} fill="none" stroke={tone} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c*(1-v/100)} style={{transition:'stroke-dashoffset 300ms'}}/></svg><span className="absolute font-display" style={{fontSize:size*0.3}}>{v}</span></div>;
}
export function MatchScore({score,size=56}:{score:number;size?:number}){return <div className="flex flex-col items-center gap-1"><Ring value={score} size={size} label="Possible match"/><span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Possible match</span></div>;}
export function CheckRow({c}:{c:{name:string;passed:boolean;detail:string}}){return <li className="flex gap-2 text-sm">{c.passed?<CheckCircle2 size={16} className="mt-0.5 shrink-0 ink-confirmed" aria-label="Passed"/>:<CircleDashed size={16} className="mt-0.5 shrink-0 ink-simulated" aria-label="Did not pass"/>}<span><span className="font-medium">{c.name}</span><span className="block text-muted-foreground">{c.detail}</span></span></li>;}
