import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ParkShell } from '@/components/park-shell';
import { companiesQuery, matchesQuery } from '@/lib/company-queries';
import { badgesFor } from '@/lib/opportunity-rules';

export const Route = createFileRoute('/compare')({
  head: () => ({ meta: [{ title: 'Compare matches | Virtual Science Park' }, { name: 'description', content: 'Compare the top five possible matches for three member companies side by side.' }, { property: 'og:title', content: 'Compare matches | Virtual Science Park' }, { property: 'og:description', content: 'See how different company profiles get different opportunity rankings.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(companiesQuery),
  component: Compare,
});

function Column({ companies, initial }: { companies: { id: string; name: string }[]; initial: string | undefined }) {
  const [id, setId] = useState(initial ?? '');
  const { data, isLoading } = useQuery({ ...matchesQuery(id), enabled: !!id });
  const top = (data?.matches ?? []).filter((m) => m.opportunity).slice(0, 5);
  return <div className="compare-col">
    <select aria-label="Company" value={id} onChange={(e) => setId(e.target.value)}><option value="">Choose a company</option>{companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
    {id && <Link className="company-website" to="/companies/$companyId/opportunities" params={{ companyId: id }}>Open all possible matches</Link>}
    {isLoading && <p className="field-empty">Loading…</p>}
    {id && !isLoading && top.length === 0 && <p className="field-empty">No matches yet. Open the company's opportunities to run matching.</p>}
    {top.map((m, i) => <div className="compare-row" key={m.opportunity_id}><span className="compare-rank">{i + 1}</span><div style={{ flex: 1 }}><div className="opp-top">{badgesFor(m.opportunity!).map((b) => <span key={b} className={`evidence-badge ${b === 'Simulated' ? 'simulated' : 'missing'}`}>{b}</span>)}</div><div>{m.opportunity!.title}</div></div><span className="opp-score">{m.score}</span></div>)}
  </div>;
}

function Compare() {
  const { data: companies } = useSuspenseQuery(companiesQuery);
  return <ParkShell><main className="profile-main"><span className="eyebrow text-primary">SIDE BY SIDE</span><h1 style={{ fontSize: 32, fontWeight: 650, margin: '10px 0' }}>Compare possible matches</h1><p className="small-note">Top 5 per company. Different profiles should produce different rankings.</p>
    <div className="compare-grid">{[0, 1, 2].map((i) => <Column key={i} companies={companies} initial={companies[i]?.id} />)}</div>
    <p className="disclaimer">Possible matches only. Not confirmed eligibility and not a commitment by Blue Science Park.</p></main></ParkShell>;
}
