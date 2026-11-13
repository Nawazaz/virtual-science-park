import { createFileRoute } from '@tanstack/react-router';
import { ParkShell, PageHeader } from '@/components/park-shell';
import { EvidenceBadge } from '@/components/park/evidence';
export const Route=createFileRoute('/about')({
 head:()=>({meta:[{title:'How it works | Virtual Science Park'},{name:'description',content:'How the profiler, scouts, matcher and guarded assistant work, and what the code checks.'},{property:'og:title',content:'How it works | Virtual Science Park'},{property:'og:description',content:'Agents, sources, the matching formula, boundaries and limitations.'},{property:'og:type',content:'article'},{name:'twitter:card',content:'summary'}]}),
 component:About,
});
const Box=({children,tone}:{children:React.ReactNode;tone?:'primary'|'guard'})=><div className={`rounded-[14px] border px-4 py-3 text-center text-sm font-medium ${tone==='primary'?'border-primary bg-primary text-primary-foreground':tone==='guard'?'border-inferred bg-inferred/10 ink-inferred':'bg-card'}`}>{children}</div>;
const Arrow=({d='→'}:{d?:string})=><span className="grid place-items-center text-xl text-muted-foreground" aria-hidden>{d}</span>;
const agents=[
 {name:'Profiler',ai:'Reads a few public pages and drafts a profile in eight fields, with a short quote and source for each fact.',code:'Checks every quote exists word-for-word on the cited page; otherwise downgrades to Inferred. Fills missing fields. Keeps company-confirmed items.'},
 {name:'Scouts',ai:'No AI. Fixed fetchers read Vinnova, Blue Science Park events and EU Funding & Tenders.',code:'Drops past deadlines and duplicates. When a source fails or is empty, shows labelled Simulated samples and records the status.'},
 {name:'Matcher',ai:'Rates how relevant each opportunity is to the profile and says which profile items it used.',code:'Drops unknown profile items, applies evidence weight, priority boost and feedback penalty, removes eligibility wording.'},
 {name:'Guard',ai:'Classifies every assistant message into one of six classes.',code:'Fixed rules decide the reply: answer, answer with staff disclaimer, or a fixed refusal. Tested with 12 boundary messages.'},
 {name:'Assistant',ai:'Writes a short answer from this company’s profile and matches only.',code:'Loads data filtered by company, lists source links, removes eligibility and guarantee wording, logs each turn.'},
];
function About(){return <ParkShell><PageHeader eyebrow="Method" title="How it works">Information and suggestions only. Every step leaves a record you can open via “How was this made?”.</PageHeader>
 <section className="surface mb-8 p-5" aria-label="System diagram">
  <div className="grid items-center gap-2 md:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr]">
   <Box>Profiler<span className="block text-xs font-normal text-muted-foreground">company website + member page</span></Box><Arrow/>
   <Box>Profiles<span className="mt-1 flex flex-wrap justify-center gap-1"><EvidenceBadge kind="fact"/><EvidenceBadge kind="inferred"/><EvidenceBadge kind="missing"/></span></Box><Arrow/>
   <Box tone="primary">Matcher</Box><Arrow/>
   <div className="grid gap-2"><Box>Dashboard</Box><div className="grid grid-cols-[auto_1fr] items-center gap-2"><Box tone="guard">Guard</Box><Box>Assistant</Box></div></div>
  </div>
  <div className="mt-2 grid gap-2 md:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr]"><span/><span/><span/><span/><div className="grid gap-1"><Arrow d="↑"/><Box>Scouts<span className="block text-xs font-normal text-muted-foreground">Vinnova · BSP events · EU · testbeds · news</span></Box></div></div>
  <div className="mt-4 rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">Agent run log: every build, refresh, match and answer records its sources and code checks</div>
 </section>
 <h2 className="mb-4 font-display text-2xl">The agents</h2>
 <div className="mb-10 grid gap-4 md:grid-cols-2">{agents.map(a=><article key={a.name} className="surface p-5"><h3 className="font-display text-xl">{a.name}</h3><div className="mt-3 grid gap-3 sm:grid-cols-2"><div><p className="eyebrow mb-1">What the AI does</p><p className="text-sm">{a.ai}</p></div><div><p className="eyebrow mb-1">What the code checks</p><p className="text-sm">{a.code}</p></div></div></article>)}</div>
 <div className="grid gap-6 md:grid-cols-2">
  <section className="surface p-5"><h2 className="mb-2 font-display text-xl">Sources</h2><ul className="list-disc space-y-1 pl-5 text-sm"><li>Vinnova open funding data (live)</li><li>Blue Science Park events (live; samples when no upcoming events)</li><li>EU Funding & Tenders portal (live)</li><li>Testbeds and news & trends: <EvidenceBadge kind="simulated"/> samples until real feeds exist</li><li>Company websites and Blue Science Park member pages</li></ul></section>
  <section className="surface p-5"><h2 className="mb-2 font-display text-xl">Matching formula</h2><p className="rounded-lg bg-muted p-3 font-mono text-xs">final = relevance × evidence weight + priority boost + feedback</p><ul className="mt-2 list-disc space-y-1 pl-5 text-sm"><li>Evidence weight 0.4 + 0.6 × best item (confirmed 1, fact 0.75, inferred 0.4)</li><li>Priority boost +10 when the type matches a chosen priority</li><li>Feedback −25 for a thumbs-down, −10 for similar items</li></ul></section>
  <section className="surface p-5"><h2 className="mb-2 font-display text-xl">How profiles stay current</h2><p className="text-sm">Profiles are designed to rebuild nightly, and any member can rebuild on demand. Changes are logged in “What changed”. Items the company confirmed are never overwritten.</p></section>
  <section className="surface p-5"><h2 className="mb-2 font-display text-xl">Boundaries</h2><p className="text-sm">The assistant only covers funding, events, testing, partners, trends and contacts. It never decides eligibility, never promises anything on behalf of Blue Science Park and never shares another company’s private activity.</p></section>
  <section className="surface p-5 md:col-span-2"><h2 className="mb-2 font-display text-xl">Limitations</h2><ul className="list-disc space-y-1 pl-5 text-sm"><li>Only a handful of public pages are read per company, so profiles can be incomplete.</li><li>AI relevance scores can be wrong; always read the original call.</li><li>Nightly rebuilds are not scheduled in this prototype.</li><li>Simulated items are realistic samples, not real opportunities.</li></ul></section>
 </div></ParkShell>;}
