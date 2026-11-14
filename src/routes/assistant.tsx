import { createFileRoute } from '@tanstack/react-router';
import { MessagesSquare } from 'lucide-react';
import { ParkShell, PageHeader, EmptyState } from '@/components/park-shell';
import { useViewingAs } from '@/hooks/use-viewing-as';
import { HowMadeLink } from '@/components/park/how-made';
import { ChatPanel } from '@/components/park/chat-panel';
import { PrivateNotice } from '@/components/park/access';
// ?scope=park: park staff ask about all members at once ("Whole park" in the Viewing menu). Ignored for anyone else.
export const Route=createFileRoute('/assistant')({
 validateSearch:(s:Record<string,unknown>):{scope?:'park'}=>s['scope']==='park'?{scope:'park'}:{},
 head:()=>({meta:[{title:'Assistant | Virtual Science Park'},{name:'description',content:'Ask about funding, events, testing, partners and your possible matches.'},{property:'og:title',content:'Assistant | Virtual Science Park'},{property:'og:description',content:'A guarded assistant that answers only from your company’s profile and matches.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),
 component:Assistant,
});
const note='mb-3 rounded-lg border bg-accent/60 px-4 py-2.5 text-sm';
function Assistant(){const {scope}=Route.useSearch();const {selected,companyId,companies,isOwner,viewer}=useViewingAs();const staff=viewer.kind==='staff';const park=staff&&scope==='park';
 const header=<PageHeader eyebrow={park?'For the whole park':selected?`For ${selected.name}`:'Assistant'} title="Assistant" actions={park?<HowMadeLink agent="Park assistant" companyId={null}/>:companyId&&(isOwner||staff)?<HowMadeLink agent={staff?'Staff assistant':'Assistant'} companyId={companyId}/>:null}>Every message passes a Guard first. Fixed rules decide what happens next.</PageHeader>;
 if(park)return <ParkShell>{header}
  <p className={note} role="note"><span className="font-medium">Asking as park staff about all {companies.length} members.</span> Answers come from their profiles, possible matches, shared deadlines and topics. There is no revenue or sales data, and members’ own conversations stay private.</p>
  <div className="surface h-[640px] p-4"><ChatPanel companyId="park" mode="park"/></div></ParkShell>;
 return <ParkShell>{header}
  {selected&&!isOwner&&!staff?<PrivateNotice companyId={selected.id} name={selected.name} staff={false}>The assistant answers from this company's private profile and matches, and its conversations belong to the company. Park staff cannot read them either.</PrivateNotice>:companyId?<>{staff&&selected&&<p className={note} role="note"><span className="font-medium">Asking as park staff about {selected.name}.</span> Answers come from its profile and possible matches. {selected.name}’s own conversations stay private, and this one isn’t saved or shown to them. To ask about all members, choose “Whole park” under Viewing.</p>}<div className="surface h-[640px] p-4"><ChatPanel companyId={companyId} mode={staff?'staff':'company'}/></div></>:<EmptyState icon={<MessagesSquare/>} title="Choose a company">Pick a company in the top bar to start.</EmptyState>}</ParkShell>;}
