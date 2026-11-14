/**
 * Knowledge graph of the park, built by fixed code from profile items (no AI):
 *   company --has topic--> topic      every edge points at the profile items (and quotes) behind it
 *   company --named--> company        one profile names another member (e.g. "Worked with Affärsverken")
 * Possible connections between two companies = shared topics, weighted so rare topics count more than
 * common ones ("Consulting"), and by evidence (confirmed > fact > inferred, as in match scores).
 * "Possibly relevant topics" are our guesses, so they never create an edge. Pure and testable.
 */
export type GraphItem = { id: string; field: string; value: string; kind: string; confirmed_by_user: boolean };
export type GraphCompany = { id: string; name: string; website_url?: string | null; profile_items: GraphItem[] };
export type TopicCategory = 'technology' | 'sector';
export type Topic = { id: string; label: string; category: TopicCategory; pattern: RegExp };

export const topics: Topic[] = [
  { id: 'ai', label: 'AI & machine learning', category: 'technology', pattern: /\b(ai|artificial intelligence|machine learning)\b/i },
  { id: 'iot', label: 'IoT & connected devices', category: 'technology', pattern: /\b(iot|connected (products|devices)|telematics|sim cards?)\b/i },
  { id: 'cyber', label: 'Cybersecurity', category: 'technology', pattern: /\b(cyber\w*|it security|threat detection|incident response|\(ot\))/i },
  { id: 'software', label: 'Software development', category: 'technology', pattern: /\b(software|programming|app development|devops|system development|apps)\b/i },
  { id: 'cloud', label: 'Cloud & hosting', category: 'technology', pattern: /\b(cloud|hosting|data processing)\b/i },
  { id: 'telecom', label: 'Telecom & networks', category: 'technology', pattern: /\b(telecom\w*|communication technology|mobile|5g|broadband|radio|data communication)\b/i },
  { id: 'underwater', label: 'Underwater technology', category: 'technology', pattern: /\b(underwater|subsea|hydroacoustic|diving|seabed)\b/i },
  { id: 'sensing', label: 'Sensing & monitoring', category: 'technology', pattern: /\b(sensors?|monitoring|surveillance|fault analyser|finding faults|finds faults|tracking)\b/i },
  { id: 'cables', label: 'Cables', category: 'technology', pattern: /\bcables?\b/i },
  { id: 'it', label: 'IT services & infrastructure', category: 'technology', pattern: /\b(it infrastructure|it solutions|it services|it consult\w*|system integration|meeting technology|documents)\b/i },
  { id: 'digital', label: 'Digital design & marketing', category: 'technology', pattern: /\b(marketing|digital agency|ux)\b/i },
  { id: 'visual', label: 'Visualisation & media', category: 'technology', pattern: /\b(visuali[sz]ations?|animations?|audio guides?|sound)\b/i },
  { id: 'marine', label: 'Marine & maritime', category: 'sector', pattern: /\b(marine|maritime|ships?|ship design|naval|sea|harbours?|quays?|ferr(y|ies)|shipping|offshore|ocean)\b/i },
  { id: 'energy', label: 'Energy & power grids', category: 'sector', pattern: /\b(energy|electricity|power grids?|power transmission|power plants?|grid owners|wave power|wind|renewable|heating|power cable)\b/i },
  { id: 'defence', label: 'Defence & security', category: 'sector', pattern: /\b(defen[cs]e|submarines?|corvettes?|government agencies|security services)\b/i },
  { id: 'water', label: 'Water & wastewater', category: 'sector', pattern: /\b(wastewater|sewage|water engineering|water handling|dredging)\b/i },
  { id: 'sustainability', label: 'Sustainability', category: 'sector', pattern: /\b(sustainab\w*|csrd|gri)\b/i },
  { id: 'built', label: 'Construction & built environment', category: 'sector', pattern: /\b((?<!ship )construction|building|architecture|property|housing|cities)\b/i },
  { id: 'transport', label: 'Transport & logistics', category: 'sector', pattern: /\b(freight|rail|locomotives?|containers|transport)\b/i },
  { id: 'public', label: 'Public sector', category: 'sector', pattern: /\b(public sector|authorities)\b/i },
  { id: 'industry', label: 'Industry', category: 'sector', pattern: /\bindustr(y|ial)\b/i },
  { id: 'finance', label: 'Finance & investment', category: 'sector', pattern: /\b(finance|invest\w*|sav(e|ing))\b/i },
  { id: 'consulting', label: 'Consulting & advice', category: 'sector', pattern: /\b(consult\w*|advice|project management)\b/i },
  { id: 'certification', label: 'Testing & certification', category: 'sector', pattern: /\b(certif\w*|inspection|testing)\b/i },
  { id: 'startups', label: 'Start-ups & business development', category: 'sector', pattern: /\b(start-?ups|business development)\b/i }, // plural only: "start-up" also means commissioning equipment
];

const topicFields = ['what_it_does', 'products_services', 'technologies', 'application_areas', 'markets_customers'];
const namedFields = ['what_it_does', 'products_services', 'markets_customers', 'projects_collaborations'];
const evidenceWeight = (i: GraphItem) => (i.confirmed_by_user ? 1 : i.kind === 'fact' ? 0.85 : i.kind === 'inferred' ? 0.6 : 0);
/** Short name used to spot mentions: "AddSecure – Smartgrids" -> "AddSecure". */
const mentionName = (name: string) => name.split(/\s+[–-]\s+/)[0]!.trim();
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export type TopicEdge = { topic: string; weight: number; items: GraphItem[] };
export type NamedEdge = { from: string; to: string; item: GraphItem };

/** Topics of one company, with the items that support each and the best evidence weight. */
export function companyTopics(c: GraphCompany): TopicEdge[] {
  const out = new Map<string, TopicEdge>();
  for (const item of c.profile_items) {
    if (!topicFields.includes(item.field) || item.kind === 'missing' || item.field === 'possible_interests') continue;
    for (const t of topics)
      if (t.pattern.test(item.value)) {
        const e = out.get(t.id) ?? { topic: t.id, weight: 0, items: [] };
        e.items.push(item);
        e.weight = Math.max(e.weight, evidenceWeight(item));
        out.set(t.id, e);
      }
  }
  return [...out.values()];
}

/** Profile items that name another member company. Facts and confirmed items only (never our guesses). */
export function namedEdges(companies: GraphCompany[]): NamedEdge[] {
  const out: NamedEdge[] = [];
  for (const c of companies)
    for (const item of c.profile_items) {
      if (!namedFields.includes(item.field) || (item.kind !== 'fact' && !item.confirmed_by_user)) continue;
      for (const other of companies) {
        if (other.id === c.id) continue;
        if (new RegExp(`(^|[^\\p{L}])${escape(mentionName(other.name))}($|[^\\p{L}])`, 'iu').test(item.value))
          out.push({ from: c.id, to: other.id, item });
      }
    }
  return out;
}

export type Link = { a: string; b: string; score: number; shared: string[]; named: NamedEdge[] };
export type KnowledgeGraph = {
  topics: { id: string; label: string; category: TopicCategory; companies: string[] }[];
  companies: { id: string; name: string; topics: string[] }[];
  edges: Map<string, TopicEdge[]>;
  links: Link[];
};

/** Build the graph. Topic weight = log(number of companies / companies with the topic), so rare topics count more. */
export function buildGraph(companies: GraphCompany[]): KnowledgeGraph {
  const edges = new Map(companies.map((c) => [c.id, companyTopics(c)]));
  const df = new Map<string, number>();
  for (const es of edges.values()) for (const e of es) df.set(e.topic, (df.get(e.topic) ?? 0) + 1);
  const idf = (t: string) => Math.log((companies.length + 1) / ((df.get(t) ?? 0) + 0.5));
  const named = namedEdges(companies);
  const links: Link[] = [];
  for (let i = 0; i < companies.length; i++)
    for (let j = i + 1; j < companies.length; j++) {
      const a = companies[i]!, b = companies[j]!;
      const ta = new Map(edges.get(a.id)!.map((e) => [e.topic, e.weight]));
      const shared = edges.get(b.id)!.filter((e) => ta.has(e.topic));
      const n = named.filter((e) => (e.from === a.id && e.to === b.id) || (e.from === b.id && e.to === a.id));
      if (!shared.length && !n.length) continue;
      const score = shared.reduce((s, e) => s + idf(e.topic) * Math.min(e.weight, ta.get(e.topic)!), 0) + n.length * 2;
      links.push({ a: a.id, b: b.id, score: Math.round(score * 100) / 100, shared: shared.sort((x, y) => idf(y.topic) - idf(x.topic)).map((e) => e.topic), named: n });
    }
  links.sort((x, y) => y.score - x.score);
  return {
    topics: topics.filter((t) => df.has(t.id)).map((t) => ({ id: t.id, label: t.label, category: t.category, companies: companies.filter((c) => edges.get(c.id)!.some((e) => e.topic === t.id)).map((c) => c.id) })),
    companies: companies.map((c) => ({ id: c.id, name: c.name, topics: edges.get(c.id)!.map((e) => e.topic) })),
    edges,
    links,
  };
}

export const topicLabel = (id: string) => topics.find((t) => t.id === id)?.label ?? id;
/** Links worth showing: named ones, or at least this much shared weight (filters out "both are consultants"). */
export const minLinkScore = 1.5;
/** Each company also keeps its 2 best links if they reach this weight, so a company with one rarer topic isn't left alone. */
export const minTopLinkScore = 1.0;

/**
 * Collaboration clusters for Park insights: small groups built greedily from the strongest links
 * (named or score >= minScore), strongest first, each capped at `maxSize` members. Chaining every link
 * would join almost the whole park into one group, which says nothing.
 */
export function collabClusters<P extends { a: { id: string; name: string }; b: { id: string; name: string }; basis: string[]; score: number; named: string[] }>(
  pairs: P[], maxSize = 5, minScore = 3,
) {
  const strong = pairs.filter((p) => p.named.length || p.score >= minScore).sort((x, y) => y.score - x.score);
  const clusterOf = new Map<string, number>();
  const clusters: { ids: string[]; names: string[]; topics: Map<string, number>; score: number }[] = [];
  const add = (c: number, m: { id: string; name: string }) => { clusters[c]!.ids.push(m.id); clusters[c]!.names.push(m.name); clusterOf.set(m.id, c); };
  for (const p of strong) {
    const ca = clusterOf.get(p.a.id), cb = clusterOf.get(p.b.id);
    let c: number | undefined;
    if (ca === undefined && cb === undefined) {
      c = clusters.push({ ids: [], names: [], topics: new Map(), score: 0 }) - 1;
      add(c, p.a); add(c, p.b);
    } else if (ca !== undefined && cb === undefined && clusters[ca]!.ids.length < maxSize) { c = ca; add(c, p.b); }
    else if (cb !== undefined && ca === undefined && clusters[cb]!.ids.length < maxSize) { c = cb; add(c, p.a); }
    else if (ca !== undefined && ca === cb) c = ca;
    if (c === undefined) continue;
    clusters[c]!.score += p.score;
    for (const t of p.basis) clusters[c]!.topics.set(t, (clusters[c]!.topics.get(t) ?? 0) + 1);
  }
  return clusters
    .map((c) => ({ names: c.names, topics: [...c.topics.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t).slice(0, 4), score: Math.round(c.score * 10) / 10 }))
    .sort((a, b) => b.score - a.score);
}

/** The links to show: named or strong ones, plus each company's 2 best reasonably strong links. */
export function shownLinks(g: KnowledgeGraph): Link[] {
  const keep = new Set<Link>(g.links.filter((l) => l.named.length || l.score >= minLinkScore));
  for (const c of g.companies)
    g.links.filter((l) => (l.a === c.id || l.b === c.id) && l.score >= minTopLinkScore).slice(0, 2).forEach((l) => keep.add(l));
  return g.links.filter((l) => keep.has(l));
}
