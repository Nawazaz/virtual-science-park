import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { useEffect, useRef, useState } from 'react';
import { Send, MessageCircle, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { chatQuery } from '@/lib/company-queries';
import { askAssistant } from '@/lib/park.functions';
import { SourceChip } from './evidence';
export const suggestions=['Which funding calls fit our profile?','Are there testbeds where we can try our product?','Which events could help us find partners?','Who at Blue Science Park should we talk to?'];
const answered=new Set(['in_scope','needs_human']);
export function ScopeCard(){return <div className="rounded-[14px] border bg-accent/60 p-4 text-sm"><p className="font-medium">What I can help with</p><p className="mt-1 text-muted-foreground">I can help with funding, events, testing, partners, trends, your matches and finding the right contact at Blue Science Park.</p></div>;}
function ContactCard(){return <div className="mt-3 rounded-lg border bg-card p-3 text-sm"><p className="flex items-center gap-2 font-medium"><Mail size={15} aria-hidden/>Contact Blue Science Park staff</p><p className="mt-1 text-xs text-muted-foreground">Business advisors can discuss eligibility, commitments and next steps with you.</p><a href="https://www.bluesciencepark.se/kontakt/" target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs font-medium text-primary hover:underline">Find the right contact ↗</a></div>;}
export function ChatPanel({companyId,compact=false}:{companyId:string;compact?:boolean}){
 const {data:msgs=[]}=useQuery(chatQuery(companyId));const ask=useServerFn(askAssistant);const qc=useQueryClient();const [q,setQ]=useState('');const [busy,setBusy]=useState(false);const [pending,setPending]=useState<string|null>(null);const end=useRef<HTMLDivElement>(null);
 useEffect(()=>{end.current?.scrollIntoView({block:'nearest'});},[msgs.length,pending]);
 const send=async(text:string)=>{const t=text.trim();if(!t||busy)return;setBusy(true);setPending(t);setQ('');try{await ask({data:{company_id:companyId,question:t}});}catch(e){toast.error(e instanceof Error?e.message:'Assistant failed');}finally{await qc.invalidateQueries({queryKey:['chat',companyId]});setPending(null);setBusy(false);}};
 const list=msgs.slice(compact?-12:-60);
 return <div className="flex h-full min-h-0 flex-col">
  <div className={`min-h-0 flex-1 space-y-3 overflow-y-auto ${compact?'':'pr-1'}`} aria-live="polite">
   <ScopeCard/>
   {list.length===0&&!pending&&<div className="flex flex-wrap gap-2">{suggestions.map(s=><button key={s} onClick={()=>send(s)} className="rounded-full border bg-card px-3 py-1.5 text-xs hover:border-primary">{s}</button>)}</div>}
   {list.map(m=>m.role==='user'?<div key={m.id} className="ml-auto max-w-[85%] rounded-[14px] bg-primary px-4 py-2.5 text-sm text-primary-foreground">{m.content}</div>:
    <div key={m.id} className="max-w-[92%]"><div className={`rounded-[14px] px-4 py-3 text-sm ${answered.has(m.guard_class??'')?'bg-card border':'bg-muted text-muted-foreground border border-dashed'}`}><p className="whitespace-pre-line">{m.content}</p>{Array.isArray(m.sources)&&m.sources.length>0&&<div className="mt-2 flex flex-wrap gap-1">{(m.sources as {title:string;url:string|null}[]).map(s=><SourceChip key={s.title} url={s.url} label={s.title.slice(0,40)}/>)}</div>}{m.guard_class==='needs_human'&&<ContactCard/>}</div>
     {m.guard_class&&<span className="mt-1 inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">Guard: {m.guard_class}</span>}</div>)}
   {pending&&<><div className="ml-auto max-w-[85%] rounded-[14px] bg-primary px-4 py-2.5 text-sm text-primary-foreground">{pending}</div><p className="text-sm text-muted-foreground" role="status">Checking your question…</p></>}
   <div ref={end}/>
  </div>
  <form className="mt-3 flex gap-2" onSubmit={e=>{e.preventDefault();void send(q);}}><Textarea rows={2} value={q} maxLength={1000} onChange={e=>setQ(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();void send(q);}}} placeholder="Ask about funding, events, testing or partners…" aria-label="Your question" className="bg-background"/><Button type="submit" disabled={busy||!q.trim()} aria-label="Send"><Send/></Button></form>
  <p className="mt-2 text-[11px] text-muted-foreground">Information only, from public sources and your profile. Not eligibility decisions or commitments by Blue Science Park.</p>
 </div>;
}
export function FloatingAsk({companyId}:{companyId:string|null}){const [open,setOpen]=useState(false);if(!companyId)return null;
 return <><button onClick={()=>setOpen(true)} className="fixed bottom-24 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-lg hover:opacity-90 md:bottom-6 md:right-6"><MessageCircle size={18} aria-hidden/>Ask</button>
  <Sheet open={open} onOpenChange={setOpen}><SheetContent className="flex w-full flex-col sm:max-w-md"><SheetHeader><SheetTitle className="font-display text-2xl font-medium">Ask the assistant</SheetTitle><SheetDescription className="sr-only">Chat with the assistant</SheetDescription></SheetHeader><div className="min-h-0 flex-1 px-4 pb-4"><ChatPanel companyId={companyId} compact/></div></SheetContent></Sheet></>;}

