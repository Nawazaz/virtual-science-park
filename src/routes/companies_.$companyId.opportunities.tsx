import { createFileRoute, Link } from '@tanstack/react-router';
import { useSuspenseQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowUpRight, Bookmark, BookmarkCheck, RefreshCw, Sparkles, ThumbsDown, ThumbsUp } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ParkShell } from '@/components/park-shell';
import { companyQuery, matchesQuery, sourcesQuery } from '@/lib/company-queries';
import { refreshSourcesFn, setFeedback } from '@/lib/opportunities.functions';
import { runMatchClient } from '@/lib/build-profile-client';
import { badgesFor } from '@/lib/opportunity-rules';
import { fieldLabels } from '@/lib/profile-rules';

export const Route = createFileRoute('/companies_/$companyId/opportunities')({
  loader: ({ context, params }) => Promise.all([
    context.queryClient.ensureQueryData(companyQuery(params.companyId)),
    context.queryClient.ensureQueryData(matchesQuery(params.companyId)),
    context.queryClient.ensureQueryData(sourcesQuery),
  ]),
  head: ({ loaderData }) => {
    const title = `${loaderData?.[0]?.name ?? 'Company'} opportunities | Virtual Science Park`;
    const description = 'Ranked possible funding and event matches with reasons, checks and next steps.';
    return { meta: [{ title }, { name: 'description', content: description }, { property: 'og:title', content: title }, { property: 'og:description', content: description }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] };
  },
  component: Opportunities,
});

const fmt = (d: string) => new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

function Opportunities() {
  const { companyId } = Route.useParams();
  const { data: company } = useSuspenseQuery(companyQuery(companyId));
  const { data } = useSuspenseQuery(matchesQuery(companyId));
  const { data: sources } = useSuspenseQuery(sourcesQuery);
  const qc = useQueryClient();
  const refreshFn = useServerFn(refreshSourcesFn);
  const feedbackFn = useServerFn(setFeedback);
  const [busy, setBusy] = useState('');
  const [highlight, setHighlight] = useState<{ match: string; ids: string[] } | null>(null);
  const [savedOnly, setSavedOnly] = useState(false);
  const started = useRef(false);

  const rematch = async () => {
    setBusy('Matching…');
    try { await runMatchClient(companyId, setBusy); await qc.invalidateQueries({ queryKey: ['matches', companyId] }); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Matching failed'); }
    finally { setBusy(''); }
  };
  const refresh = async () => {
    setBusy('Checking sources…');
    try {
      const report = await refreshFn();
      for (const r of report) (r.status === 'ok' ? toast.success : toast.warning)(`${r.source}: ${r.message}`);
      await qc.invalidateQueries({ queryKey: ['sources'] });
      await rematch();
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Refresh failed'); setBusy(''); }
  };
  useEffect(() => {
    if (started.current || !company || data.matches.length || !company.profile_items.length) return;
    started.current = true;
    if (!sources.length) void refresh(); else void rematch();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!company) return <ParkShell><main className="profile-main"><h1>Company not found</h1></main></ParkShell>;
  const fb = (id: string) => data.feedback.find((f) => f.opportunity_id === id);
  const send = async (opportunity_id: string, saved: boolean, vote: 'up' | 'down' | null) => {
    try { await feedbackFn({ data: { company_id: companyId, opportunity_id, saved, vote } }); await qc.invalidateQueries({ queryKey: ['matches', companyId] }); if (vote === 'down') toast.info('Noted. Similar items rank lower on the next update.'); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Could not save'); }
  };
  const list = data.matches.filter((m) => m.opportunity && (!savedOnly || fb(m.opportunity_id)?.saved));
  const items = company.profile_items.filter((i) => i.kind !== 'missing');

  return <ParkShell><main className="profile-main">
    <Button variant="link" asChild className="back-link"><Link to="/companies/$companyId" params={{ companyId }}><ArrowLeft />Back to profile</Link></Button>
    <div className="profile-heading"><div><span className="eyebrow text-primary">POSSIBLE MATCHES</span><h1>{company.name}</h1></div>
      <div className="heading-actions"><Button variant="outline" disabled={!!busy} onClick={rematch}><Sparkles />Re-run matching</Button><Button disabled={!!busy} onClick={refresh}><RefreshCw />Refresh sources</Button></div></div>
    <div className="source-bar">{sources.length === 0 ? <div className="source-card">No sources checked yet.</div> : sources.map((s) => <div key={s.source_name} className={`source-card ${s.status !== 'ok' ? 'source-failed' : ''}`}><strong>{s.source_name}</strong><span>Last checked {fmt(s.last_checked)}</span><span>{s.message}</span></div>)}</div>
    {busy && <div className="build-progress"><Sparkles size={16} />{busy}</div>}
    {!company.profile_items.length && <p className="field-empty">Build the company profile first to get possible matches.</p>}
    <div className="filter-tabs" style={{ marginLeft: 0, marginBottom: 14 }}><Button variant="ghost" className={!savedOnly ? 'filter-active' : ''} onClick={() => setSavedOnly(false)}>All</Button><Button variant="ghost" className={savedOnly ? 'filter-active' : ''} onClick={() => setSavedOnly(true)}>Saved</Button></div>
    <div className="opps-layout"><div className="opp-list">
      {list.length === 0 && <p className="field-empty">{savedOnly ? 'Nothing saved yet.' : 'No possible matches yet.'}</p>}
      {list.map((m) => { const o = m.opportunity!; const f = fb(o.id); const active = highlight?.match === o.id;
        return <article className="opp-card" key={o.id}>
          <div className="opp-top">{badgesFor(o).map((b) => <span key={b} className={`evidence-badge ${b === 'Simulated' ? 'simulated' : o.type === 'event' ? 'inferred' : 'fact'}`}>{b}</span>)}<span className="evidence-badge missing">{o.location_mode === 'online' ? 'Online' : o.location_mode === 'in_person' ? 'In person' : 'Location not stated'}</span><span className="opp-score">{m.score}<small>/100</small></span></div>
          <h3>{o.title}</h3>
          <div className="opp-meta"><span>{o.deadline_or_date ?? 'No date stated'}</span><span>{o.source_name}</span><span>Retrieved {new Date(o.retrieved_at).toLocaleDateString('en-GB')}</span>{o.source_url && <a href={o.source_url} target="_blank" rel="noopener noreferrer">Source<ArrowUpRight size={12} /></a>}</div>
          <div className="opp-section"><h4>Why this may fit</h4><button type="button" className={`opp-reason ${active ? 'active' : ''}`} onClick={() => setHighlight(active ? null : { match: o.id, ids: m.matched_profile_item_ids })}>{m.reason}</button></div>
          <div className="opp-section"><h4>Check first</h4><p>{m.check_first}</p></div>
          <div className="opp-section"><h4>Next step</h4><p>{m.next_step}</p></div>
          <div className="opp-actions"><Button size="sm" variant={f?.saved ? 'default' : 'outline'} onClick={() => send(o.id, !f?.saved, f?.vote as 'up' | 'down' | null ?? null)}>{f?.saved ? <BookmarkCheck /> : <Bookmark />}{f?.saved ? 'Saved' : 'Save'}</Button><Button size="sm" variant={f?.vote === 'up' ? 'default' : 'ghost'} aria-label="Thumbs up" onClick={() => send(o.id, !!f?.saved, f?.vote === 'up' ? null : 'up')}><ThumbsUp /></Button><Button size="sm" variant={f?.vote === 'down' ? 'default' : 'ghost'} aria-label="Thumbs down" onClick={() => send(o.id, !!f?.saved, f?.vote === 'down' ? null : 'down')}><ThumbsDown /></Button></div>
        </article>; })}
    </div>
    <aside className="used-items"><h3>Profile items</h3><span>{highlight ? `Highlighted: ${highlight.ids.length} item(s) used by this match` : 'Click a reason to highlight the items it used.'}</span>
      {items.map((i) => <div key={i.id} className={`used-item ${highlight?.ids.includes(i.id) ? 'highlight' : ''}`}><strong>{fieldLabels[i.field]}</strong> · <span className={`evidence-badge ${i.confirmed_by_user ? 'confirmed' : i.kind}`}>{i.confirmed_by_user ? 'Confirmed by company' : i.kind === 'fact' ? 'Fact' : 'Inferred'}</span><div>{i.value}</div></div>)}
    </aside></div>
    <p className="disclaimer">Possible matches only. Not confirmed eligibility and not a commitment by Blue Science Park.</p>
  </main></ParkShell>;
}
