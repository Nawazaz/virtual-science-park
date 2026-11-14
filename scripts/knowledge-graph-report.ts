// Prints the knowledge graph built from the live profiles (public items only, as the app shows other companies).
// Usage: node --env-file=.env.local --import tsx scripts/knowledge-graph-report.ts
import { createClient } from '@supabase/supabase-js';
import { buildGraph, shownLinks, topicLabel } from '../src/lib/knowledge-graph';
import { isListed } from '../src/lib/hidden-companies';

const db = createClient(process.env['SUPABASE_URL']!, process.env['SUPABASE_PUBLISHABLE_KEY']!);
const { data, error } = await db.from('companies').select('id,name,profile_items(id,field,value,kind,confirmed_by_user)');
if (error) throw error;
const companies = (data ?? []).filter(isListed).map((c) => ({ ...c, profile_items: c.profile_items.filter((i) => !i.confirmed_by_user) }));
const g = buildGraph(companies);
const name = (id: string) => g.companies.find((c) => c.id === id)!.name;

console.log('Topics (companies per topic):');
for (const t of [...g.topics].sort((a, b) => b.companies.length - a.companies.length)) console.log(`  ${String(t.companies.length).padStart(2)}  ${t.label}`);
const none = g.companies.filter((c) => !c.topics.length).map((c) => c.name);
console.log(`\nCompanies with no topic: ${none.length ? none.join(', ') : 'none'}`);
console.log('\nNamed links (one profile names another member):');
for (const l of g.links.filter((x) => x.named.length)) for (const n of l.named) console.log(`  ${name(n.from)} -> ${name(n.to)}: "${n.item.value}"`);
const shown = shownLinks(g);
console.log(`\n${g.links.length} candidate links, ${shown.length} strong enough to show. Top 15:`);
for (const l of shown.slice(0, 15)) console.log(`  ${l.score.toFixed(2).padStart(5)}  ${name(l.a)} — ${name(l.b)}: ${l.shared.map(topicLabel).join(', ')}${l.named.length ? ' + named' : ''}`);
const degree = new Map<string, number>();
for (const l of shown) for (const id of [l.a, l.b]) degree.set(id, (degree.get(id) ?? 0) + 1);
const isolated = g.companies.filter((c) => !degree.has(c.id)).map((c) => c.name);
console.log(`\nCompanies with no shown link: ${isolated.length ? isolated.join(', ') : 'none'}`);
