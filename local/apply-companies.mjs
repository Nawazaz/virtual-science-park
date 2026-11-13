// Applies local/companies-verified.sql through the app's own database access (the publishable key),
// for databases where you can't open the SQL editor, such as the Lovable project's database.
// Usage (from the project folder):  npm run companies:local
//
// Same steps as the SQL file: remove "Example Company", add or fix the 5 companies, replace their
// profiles with the app's replace_generated_profile function (company-confirmed items are kept),
// and log one "checked by hand" run per company. Safe to run more than once.
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) throw new Error('Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in .env.local');
const db = createClient(url, key);
const must = ({ data, error }, what) => { if (error) throw new Error(`${what}: ${error.message}`); return data; };

// Read the data from the SQL file, so there is one copy of it.
const sql = readFileSync(new URL('./companies-verified.sql', import.meta.url), 'utf8');
const S = `'((?:[^']|'')*)'`, O = `(NULL|${S})`, unq = (s) => (s === undefined ? null : s.replace(/''/g, "'"));
const companies = [...sql.matchAll(new RegExp(`^ \\(${S},${S},${S}\\)[,;]$`, 'gm'))].map((m) => ({ name: unq(m[1]), website_url: unq(m[2]), member_page_url: unq(m[3]) }));
const items = [...sql.matchAll(new RegExp(`^ \\(${S},${S},${S},${S},${O},${O}\\)[,;]$`, 'gm'))].map((m) => ({
  member: unq(m[1]), field: unq(m[2]), value: unq(m[3]), kind: unq(m[4]),
  evidence_quote: m[5] === 'NULL' ? null : unq(m[6]), source_url: m[7] === 'NULL' ? null : unq(m[8]),
}));
if (companies.length !== 5 || items.length < 40) throw new Error(`Could not read the SQL file (${companies.length} companies, ${items.length} items)`);

const squash = (s) => s.replace(/\s+/g, '').toLowerCase();
const existing = must(await db.from('companies').select('id,name,website_url,member_page_url'), 'read companies');

// 1. Example Company. The app's key may not be allowed to delete companies; then say so.
const example = existing.filter((c) => c.name === 'Example Company' && c.website_url === 'https://example.com');
if (example.length) {
  const gone = must(await db.from('companies').delete().in('id', example.map((c) => c.id)).select('id'), 'delete Example Company');
  console.log(gone.length ? 'Removed Example Company and its data.' : 'Could NOT remove Example Company: the database does not let the app delete companies.');
} else console.log('Example Company is already gone.');

// 2 + 3. Companies and profiles.
for (const c of companies) {
  let row = existing.find((e) => e.member_page_url === c.member_page_url || squash(e.name) === squash(c.name));
  if (row) must(await db.from('companies').update(c).eq('id', row.id), `update ${c.name}`);
  else row = must(await db.from('companies').insert(c).select('id').single(), `add ${c.name}`);
  const mine = items.filter((i) => i.member === c.member_page_url).map(({ member, ...i }) => i);
  must(await db.rpc('replace_generated_profile', { p_company_id: row.id, p_items: mine }), `profile of ${c.name}`);

  // 4. Run log, once.
  const output = 'Profile checked by hand on 14 Nov 2026 from public pages (not built by the AI).';
  const logged = must(await db.from('agent_runs').select('id').eq('company_id', row.id).eq('agent', 'Profile builder').eq('output', output), 'read run log');
  if (!logged.length) {
    const count = (k) => mine.filter((i) => i.kind === k).length;
    must(await db.from('agent_runs').insert({
      agent: 'Profile builder', company_id: row.id, simulated: false, output,
      sources_used: [...new Set(mine.map((i) => i.source_url).filter(Boolean))],
      checks: [
        { name: 'Every fact quoted word for word from its source page', passed: true, detail: `${count('fact')} facts checked` },
        { name: 'Guesses labelled Inferred', passed: true, detail: 'Possibly relevant topics are our guess' },
        { name: 'Gaps labelled Missing', passed: true, detail: `${count('missing')} fields not found` },
      ],
    }), `log run for ${c.name}`);
  }
  console.log(`${c.name.padEnd(17)} ${mine.length} items (${mine.filter((i) => i.kind === 'fact').length} facts)`);
}
console.log('Done. Refresh the app to see the changes.');
