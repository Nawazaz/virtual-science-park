import { describe, expect, it } from 'vitest';
import { memberRows, namedMembers, parkTotals, sharedDeadlines, type OverviewCompany, type OverviewMatch } from '@/lib/park-overview';
import { decideReply } from '@/lib/park-rules';

const item = (field: string, kind: string, value = 'x', confirmed_by_user = false) => ({ field, kind, value, confirmed_by_user });
const companies: OverviewCompany[] = [
  { id: 'a', name: 'Alpha', profile_items: [item('what_it_does', 'fact', 'Builds sensors'), item('technologies', 'inferred'), item('geography', 'missing')], company_priorities: [{ priority: 'funding' }] },
  { id: 'b', name: 'Beta', profile_items: [item('what_it_does', 'inferred', 'Makes boats', true)], company_priorities: [] },
  { id: 'c', name: 'Gamma', profile_items: [], company_priorities: [] },
];
const opp = (id: string, type = 'funding') => ({ id, title: `Call ${id}`, type, deadline_or_date: '2026-12-01', simulated: false });
const matches: OverviewMatch[] = [
  { company_id: 'a', score: 80, opportunity: opp('o1') },
  { company_id: 'a', score: 40, opportunity: opp('o2') },
  { company_id: 'a', score: 90, opportunity: opp('n1', 'news') },
  { company_id: 'b', score: 60, opportunity: opp('o1') },
  { company_id: 'b', score: 70, opportunity: opp('o2') },
];

describe('Park overview for the staff assistant', () => {
  const rows = memberRows(companies, matches);

  it('summarises each member from its profile and rankings, leaving news out of the matches', () => {
    const alpha = rows.find((r) => r.name === 'Alpha')!;
    expect(alpha.what_it_does).toBe('Builds sensors');
    expect(alpha.evidence_backed_items).toBe(1);
    expect(alpha.guessed_items).toBe(1);
    expect(alpha.missing_fields).toEqual(['geography']);
    expect(alpha.priorities).toEqual(['funding']);
    expect(alpha.possible_matches).toBe(2);
    expect(alpha.strong_matches).toBe(1);
    expect(alpha.best_matches.map((m) => m.title)).toEqual(['Call o1', 'Call o2']);
    // A company-confirmed item counts as evidence, not as a guess.
    expect(rows.find((r) => r.name === 'Beta')!.evidence_backed_items).toBe(1);
  });

  it('does the park-wide counting in code: profiles, completeness and who has been ranked', () => {
    const { members, profiles, rankings } = parkTotals(rows);
    expect(members).toBe(3);
    expect(profiles.built).toBe(2);
    expect(profiles.not_built).toEqual(['Gamma']);
    expect(profiles.average_completeness).toBe(19); // Alpha 2 of 8 fields (25%), Beta 1 of 8 (13%)
    expect(profiles.members_per_completeness).toEqual(['25%: 1 members', '13%: 1 members']);
    expect(profiles.weakest).toEqual(['Beta (13%)', 'Alpha (25%)']);
    expect(profiles.most_complete[0]).toBe('Alpha (25%)');
    // Gamma has no rankings yet: counted as not ranked, not as "no matches".
    expect(rankings.members_ranked).toBe(2);
    expect(rankings.members_not_ranked_yet).toBe(1);
    expect(rankings.note).toMatch(/run for 2 of 3 members/);
    expect(rankings.ranked_without_strong_match).toEqual([]);
  });

  it('finds the members an answer names by whole name only', () => {
    const list = [{ name: 'WIP' }, { name: 'Njord X' }, { name: 'Affärsverken' }];
    expect(namedMembers('Njord X and Affärsverken lead; WIPE is not a member.', list).map((c) => c.name)).toEqual(['Njord X', 'Affärsverken']);
    expect(namedMembers('Only WIP has few matches.', list).map((c) => c.name)).toEqual(['WIP']);
  });

  it('lists only strong matches shared by more than one member', () => {
    const shared = sharedDeadlines(companies, matches);
    expect(shared.map((s) => s.title)).toEqual(['Call o1']);
    expect(shared[0]!.members.sort()).toEqual(['Alpha', 'Beta']);
  });

  it('words refusals for staff in the park view, still keeping members’ chats private', () => {
    expect(decideReply('other_company_private', 'park').fixedText).toMatch(/private to each company, even from park staff/);
    expect(decideReply('out_of_scope', 'park').fixedText).toMatch(/park view/);
    expect(decideReply('out_of_scope').fixedText).toMatch(/our profile/);
    expect(decideReply('in_scope', 'park').answer).toBe(true);
  });
});
