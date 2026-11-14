// Prints the live knowledge graph as compact JSON (for previews). Public items only.
// Usage: node --env-file=.env.local --import tsx scripts/kg-export.ts
import { createClient } from '@supabase/supabase-js';
import { buildGraph } from '../src/lib/knowledge-graph';
import { isListed } from '../src/lib/hidden-companies';

const db = createClient(process.env['SUPABASE_URL']!, process.env['SUPABASE_PUBLISHABLE_KEY']!);
const { data, error } = await db.from('companies').select('id,name,profile_items(id,field,value,kind,confirmed_by_user)');
if (error) throw error;
const companies = (data ?? []).filter(isListed).map((c) => ({ ...c, profile_items: c.profile_items.filter((i) => !i.confirmed_by_user) }));
const g = buildGraph(companies);
const idx = new Map(g.companies.map((c, i) => [c.id, i]));
console.log(JSON.stringify({
  c: g.companies.map((c) => [c.name, c.topics]),
  t: g.topics.map((t) => [t.id, t.label, t.category === 'technology' ? 0 : 1]),
  n: g.links.filter((l) => l.named.length).map((l) => [idx.get(l.a), idx.get(l.b)]),
}));
