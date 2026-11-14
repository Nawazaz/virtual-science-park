import { describe, expect, it } from 'vitest';
import { buildGraph, companyTopics, namedEdges, shownLinks, type GraphCompany } from '@/lib/knowledge-graph';

let n = 0;
const item = (field: string, value: string, kind = 'fact', confirmed_by_user = false) => ({ id: `i${n++}`, field, value, kind, confirmed_by_user });
const co = (id: string, name: string, items: ReturnType<typeof item>[]): GraphCompany => ({ id, name, profile_items: items });

const techinova = co('t', 'Techinova', [item('what_it_does', 'Electronics and software for radio communication, built for the energy sector.'), item('projects_collaborations', 'Worked with Affärsverken and Blekinge Tekniska Högskola, among others.'), item('possible_interests', 'Partners such as NKT. Our guess.', 'inferred')]);
const affarsverken = co('a', 'Affärsverken', [item('what_it_does', "Karlskrona's utility: electricity, heating and fibre.")]);
const nkt = co('k', 'NKT', [item('what_it_does', 'Designs and installs high-voltage cables for power transmission.')]);
const consultant1 = co('c1', 'Nicon', [item('application_areas', 'Consulting.')]);
const consultant2 = co('c2', 'Atea', [item('application_areas', 'Consulting.')]);

describe('knowledge graph', () => {
  it('gives each company topics from its facts, with the items behind them', () => {
    const t = companyTopics(techinova);
    expect(t.map((e) => e.topic).sort()).toEqual(['energy', 'software', 'telecom']);
    expect(t.find((e) => e.topic === 'energy')!.items[0]!.value).toContain('energy sector');
  });

  it('never builds edges from missing items or our guesses', () => {
    const g = co('x', 'X', [item('technologies', 'Not found.', 'missing'), item('possible_interests', 'AI and cybersecurity events.', 'inferred')]);
    expect(companyTopics(g)).toEqual([]);
    expect(namedEdges([techinova, nkt]).length).toBe(0); // NKT is only named in a guess
  });

  it('links members named in a profile', () => {
    const e = namedEdges([techinova, affarsverken, nkt]);
    expect(e).toHaveLength(1);
    expect(e[0]).toMatchObject({ from: 't', to: 'a' });
  });

  it('does not treat "start-up" of equipment or ship construction as start-ups or construction', () => {
    const t = companyTopics(co('s', 'S', [item('what_it_does', 'From project start to installation, start-up, service and support.'), item('application_areas', 'Ship construction.')]));
    expect(t.map((e) => e.topic)).not.toContain('startups');
    expect(t.map((e) => e.topic)).not.toContain('built');
  });

  it('scores rare shared topics above common ones and shows the strong links', () => {
    const g = buildGraph([techinova, affarsverken, nkt, consultant1, consultant2]);
    const ta = g.links.find((l) => [l.a, l.b].sort().join() === 'a,t')!;
    expect(ta.shared).toContain('energy');
    expect(ta.named).toHaveLength(1);
    const consultants = g.links.find((l) => [l.a, l.b].sort().join() === 'c1,c2')!;
    expect(ta.score).toBeGreaterThan(consultants.score);
    expect(shownLinks(g).some((l) => l === ta)).toBe(true);
  });
});
