import { completeness } from './park-rules';

/**
 * Park-wide view for the staff assistant ("Whole park" in Viewing). Fixed code, no AI: one compact row per
 * member plus deadlines shared by several members, built only from data park staff may already see
 * (profiles, priorities, rankings). Members' chats, saved items and votes are never part of it.
 */
export type OverviewItem = { field: string; value: string; kind: string; confirmed_by_user: boolean };
export type OverviewCompany = { id: string; name: string; profile_items: OverviewItem[]; company_priorities: { priority: string }[] };
export type OverviewOpportunity = { id: string; title: string; type: string; deadline_or_date: string | null; simulated: boolean };
export type OverviewMatch = { company_id: string; score: number; opportunity: OverviewOpportunity | null };

/** Same bar as Park insights: a score of 50+ is a strong possible match. */
export const strongMatchScore = 50;

const ranked = (companyId: string, matches: OverviewMatch[]) =>
  matches.filter((m) => m.company_id === companyId && m.opportunity && m.opportunity.type !== 'news').sort((a, b) => b.score - a.score);

export function memberRows(companies: OverviewCompany[], matches: OverviewMatch[]) {
  return companies.map((c) => {
    const known = c.profile_items.filter((i) => i.kind !== 'missing');
    const ms = ranked(c.id, matches);
    return {
      id: c.id,
      name: c.name,
      what_it_does: known.find((i) => i.field === 'what_it_does')?.value.slice(0, 140) ?? null,
      profile_completeness: completeness(c.profile_items),
      evidence_backed_items: known.filter((i) => i.kind === 'fact' || i.confirmed_by_user).length,
      guessed_items: known.filter((i) => i.kind === 'inferred' && !i.confirmed_by_user).length,
      missing_fields: [...new Set(c.profile_items.filter((i) => i.kind === 'missing').map((i) => i.field))],
      priorities: c.company_priorities.map((p) => p.priority),
      possible_matches: ms.length,
      strong_matches: ms.filter((m) => m.score >= strongMatchScore).length,
      best_matches: ms.slice(0, 3).map((m) => ({ title: m.opportunity!.title.slice(0, 70), score: m.score, deadline: m.opportunity!.deadline_or_date, simulated: m.opportunity!.simulated })),
    };
  });
}

export type MemberRow = ReturnType<typeof memberRows>[number];

/**
 * Park-wide counts, done here in code: a small model miscounts across 45 rows (it reported 75% average completeness
 * for a real 66%). A member with no possible matches has not been ranked yet; that is not the same as nothing fitting.
 */
export function parkTotals(rows: MemberRow[]) {
  const built = rows.filter((r) => r.profile_completeness > 0);
  const ranked = rows.filter((r) => r.possible_matches > 0);
  const byCompleteness = [...built].sort((a, b) => a.profile_completeness - b.profile_completeness || a.name.localeCompare(b.name));
  const bands = new Map<number, number>();
  for (const r of built) bands.set(r.profile_completeness, (bands.get(r.profile_completeness) ?? 0) + 1);
  const label = (r: MemberRow) => `${r.name} (${r.profile_completeness}%)`;
  // Grouped so a small model doesn't mix up "no profile" with "not ranked yet".
  return {
    members: rows.length,
    profiles: {
      built: built.length,
      not_built: rows.filter((r) => r.profile_completeness === 0).map((r) => r.name),
      average_completeness: built.length ? Math.round(built.reduce((s, r) => s + r.profile_completeness, 0) / built.length) : 0,
      members_per_completeness: [...bands].sort((a, b) => b[0] - a[0]).map(([pct, n]) => `${pct}%: ${n} members`),
      weakest: byCompleteness.slice(0, 5).map(label),
      most_complete: byCompleteness.slice(-5).reverse().map(label),
    },
    rankings: {
      note: `Matching has been run for ${ranked.length} of ${rows.length} members so far; the other ${rows.length - ranked.length} are not ranked yet.`,
      members_ranked: ranked.length,
      members_not_ranked_yet: rows.length - ranked.length,
      ranked_members: ranked.map((r) => ({ name: r.name, possible_matches: r.possible_matches, strong_matches: r.strong_matches })),
      ranked_without_strong_match: ranked.filter((r) => r.strong_matches === 0).map((r) => r.name),
    },
  };
}

/**
 * Members an answer names, found by fixed code (whole-name match), used as its source links. The AI no longer lists
 * ids: listing all 45 cost about 200 of the 600 chat reply tokens and could cut the JSON off.
 */
export function namedMembers<C extends { name: string }>(text: string, companies: C[], max = 6) {
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return companies.filter((c) => new RegExp(`(^|[^\\p{L}\\p{N}])${esc(c.name)}($|[^\\p{L}\\p{N}])`, 'u').test(text)).slice(0, max);
}

/** Opportunities (not news) that are a strong possible match for more than one member, most shared first. */
export function sharedDeadlines(companies: OverviewCompany[], matches: OverviewMatch[], max = 8) {
  const name = new Map(companies.map((c) => [c.id, c.name]));
  const byOpp = new Map<string, { o: OverviewOpportunity; members: Set<string> }>();
  for (const m of matches) {
    if (!m.opportunity || m.opportunity.type === 'news' || m.score < strongMatchScore || !name.has(m.company_id)) continue;
    const e = byOpp.get(m.opportunity.id) ?? { o: m.opportunity, members: new Set<string>() };
    e.members.add(name.get(m.company_id)!);
    byOpp.set(m.opportunity.id, e);
  }
  return [...byOpp.values()]
    .filter((e) => e.members.size > 1)
    .sort((a, b) => b.members.size - a.members.size)
    .slice(0, max)
    .map((e) => ({ title: e.o.title.slice(0, 80), type: e.o.type, deadline: e.o.deadline_or_date, simulated: e.o.simulated, members: [...e.members] }));
}
