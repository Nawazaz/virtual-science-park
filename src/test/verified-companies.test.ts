import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { fields } from '@/lib/profile-rules';
import { emailFor } from '@/lib/demo-accounts';
import { isListed } from '@/lib/hidden-companies';

// Checks the hand-checked company data in local/companies-verified.sql follows the same evidence
// rules as an AI-built profile (src/lib/profile-rules.ts): every fact has a short quote and a source.
const sql = readFileSync(resolve(__dirname, '../../local/companies-verified.sql'), 'utf8');
const str = `'((?:[^']|'')*)'`;
const opt = `(NULL|${str})`;
const unq = (s: string | undefined) => (s === undefined ? null : s.replace(/''/g, "'"));

const companies = [...sql.matchAll(new RegExp(`^ \\(${str},${str},${str}\\)[,;]$`, 'gm'))].map((m) => ({ name: unq(m[1])!, website: unq(m[2])!, member: unq(m[3])! }));
const items = [...sql.matchAll(new RegExp(`^ \\(${str},${str},${str},${str},${opt},${opt}\\)[,;]$`, 'gm'))].map((m) => ({
  member: unq(m[1])!,
  field: unq(m[2])!,
  value: unq(m[3])!,
  kind: unq(m[4])!,
  quote: m[5] === 'NULL' ? null : unq(m[6]),
  source: m[7] === 'NULL' ? null : unq(m[8]),
}));

describe('verified company data', () => {
  it('has the 45 member companies and no placeholder', () => {
    expect(companies).toHaveLength(45);
    expect(companies.slice(0, 5).map((c) => c.name)).toEqual(['Njord X', 'WIP', 'Kingspan BAGA', 'Ocean Harvesting', 'Techinova']);
    expect(new Set(companies.map((c) => c.member)).size).toBe(45);
    expect(companies.every((c) => /^https:\/\//.test(c.website) && c.member.startsWith('https://www.bluesciencepark.se/medlem/'))).toBe(true);
    expect(sql).toMatch(/DELETE FROM public\.companies WHERE name = 'Example Company'/);
  });

  it('gives every company all 8 profile fields', () => {
    expect(items.length).toBeGreaterThanOrEqual(45 * 8);
    for (const c of companies) {
      const have = new Set(items.filter((i) => i.member === c.member).map((i) => i.field));
      expect([...have].sort(), c.name).toEqual([...fields].sort());
    }
    expect(items.every((i) => companies.some((c) => c.member === i.member))).toBe(true);
  });

  it('backs every fact with a short quote and a source link', () => {
    for (const i of items.filter((x) => x.kind === 'fact')) {
      expect(i.quote, i.value).toBeTruthy();
      expect(i.quote!.split(/\s+/).length, i.quote!).toBeLessThanOrEqual(25);
      expect(i.source, i.value).toMatch(/^https:\/\//);
    }
  });

  it('labels guesses and gaps honestly', () => {
    expect(items.every((i) => ['fact', 'inferred', 'missing'].includes(i.kind))).toBe(true);
    expect(items.filter((i) => i.field === 'possible_interests').every((i) => i.kind === 'inferred')).toBe(true);
    expect(items.filter((i) => i.kind !== 'fact').every((i) => i.quote === null)).toBe(true);
    expect(items.every((i) => !/\b(eligible|qualifies|guarantee)/i.test(i.value))).toBe(true);
  });

  it('hides the placeholder company but none of the 5 members', () => {
    expect(isListed({ name: 'Example Company' })).toBe(false);
    expect(isListed(null)).toBe(false);
    expect(companies.every((c) => isListed(c))).toBe(true);
  });

  it('keeps demo sign-in emails readable', () => {
    expect(companies.slice(0, 5).map((c) => emailFor(c.name))).toEqual(['njord-x@demo.vsp', 'wip@demo.vsp', 'kingspan-baga@demo.vsp', 'ocean-harvesting@demo.vsp', 'techinova@demo.vsp']);
    expect(new Set(companies.map((c) => emailFor(c.name))).size).toBe(45); // every company gets its own login
  });
});
