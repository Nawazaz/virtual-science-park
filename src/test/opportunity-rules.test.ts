import { describe, it, expect } from 'vitest';
import { simulatedSamples, badgesFor, scoreMatch, sanitizeWording, sourceNames } from '@/lib/opportunity-rules';
const opp = { id: 'o1', type: 'funding', title: 'Innovation grant' };
describe('Opportunity rules', () => {
  it.each(sourceNames)('simulated samples for %s always carry the Simulated badge', (s) => {
    const items = simulatedSamples(s);
    expect(items).toHaveLength(3);
    for (const i of items) { expect(i.simulated).toBe(true); expect(badgesFor(i)).toContain('Simulated'); }
  });
  it('real items have no Simulated badge', () => expect(badgesFor({ type: 'event', simulated: false })).not.toContain('Simulated'));
  it('confirmed items outweigh inferred ones', () => {
    const base = { aiScore: 80, opportunity: opp, priorities: [], downVoted: [] };
    const confirmed = scoreMatch({ ...base, matchedItems: [{ id: 'a', kind: 'inferred', confirmed_by_user: true }] });
    const fact = scoreMatch({ ...base, matchedItems: [{ id: 'b', kind: 'fact', confirmed_by_user: false }] });
    const inferred = scoreMatch({ ...base, matchedItems: [{ id: 'c', kind: 'inferred', confirmed_by_user: false }] });
    expect(confirmed).toBeGreaterThan(fact); expect(fact).toBeGreaterThan(inferred);
  });
  it('a chosen priority raises that type', () => expect(scoreMatch({ aiScore: 50, matchedItems: [], opportunity: opp, priorities: ['funding'], downVoted: [] })).toBeGreaterThan(scoreMatch({ aiScore: 50, matchedItems: [], opportunity: opp, priorities: [], downVoted: [] })));
  it('a down vote lowers the item', () => expect(scoreMatch({ aiScore: 50, matchedItems: [], opportunity: opp, priorities: [], downVoted: [opp] })).toBeLessThan(scoreMatch({ aiScore: 50, matchedItems: [], opportunity: opp, priorities: [], downVoted: [] })));
  it.each(['The company is eligible for this call.', 'Eligibility looks strong; ineligible partners excluded.', 'You are ELIGIBLE'])('no reason text contains "eligible": %s', (t) => expect(sanitizeWording(t).toLowerCase()).not.toMatch(/eligib/));
});
