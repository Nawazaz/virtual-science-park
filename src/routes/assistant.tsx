import { createFileRoute } from '@tanstack/react-router';
import { MessagesSquare } from 'lucide-react';
import { ParkShell, PageHeader, EmptyState } from '@/components/park-shell';
import { useViewingAs } from '@/hooks/use-viewing-as';
import { HowMadeLink } from '@/components/park/how-made';
import { ChatPanel } from '@/components/park/chat-panel';
import { PrivateNotice } from '@/components/park/access';
export const Route=createFileRoute('/assistant')({
 head:()=>({meta:[{title:'Assistant | Virtual Science Park'},{name:'description',content:'Ask about funding, events, testing, partners and your possible matches.'},{property:'og:title',content:'Assistant | Virtual Science Park'},{property:'og:description',content:'A guarded assistant that answers only from your company’s profile and matches.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),
 component:Assistant,
});
function Assistant(){const {selected,companyId,isOwner}=useViewingAs();
 return <ParkShell><PageHeader eyebrow={selected?`For ${selected.name}`:'Assistant'} title="Assistant" actions={companyId&&isOwner?<HowMadeLink agent="Assistant" companyId={companyId}/>:null}>Every message passes a Guard first. Fixed rules decide what happens next.</PageHeader>
  {selected&&!isOwner?<PrivateNotice companyId={selected.id} name={selected.name} staff={false}>The assistant answers from this company's private profile and matches, and its conversations belong to the company. Park staff cannot read them either.</PrivateNotice>:companyId?<div className="surface h-[640px] p-4"><ChatPanel companyId={companyId}/></div>:<EmptyState icon={<MessagesSquare/>} title="Choose a company">Pick a company in the top bar to start.</EmptyState>}</ParkShell>;}
