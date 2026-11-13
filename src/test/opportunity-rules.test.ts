import { describe, it, expect } from 'vitest';
import { simulatedSamples, badgesFor, scoreMatch, scoreBreakdown, sanitizeWording, sourceNames, isWeakBasis } from '@/lib/opportunity-rules';
const opp = { id: 'o1', type: 'funding', title: 'Innovation grant' };
const base = { aiScore: 80, opportunity: opp, priorities: [] as string[], downVoted: [] as typeof opp[], matchedItems: [] as { id: string; kind: string; confirmed_by_user: boolean }[] };
describe('Opportunity rules', () => {
  it.each(sourceNames)('simulated samples for %s always carry the Simulated badge', (s) => {
    const items = simulatedSamples(s);
    expect(items.length).toBeGreaterThanOrEqual(3);
    for (const i of items) { expect(i.simulated).toBe(true); expect(badgesFor(i)).toContain('Simulated'); }
  });
  it('real items have no Simulated badge', () => expect(badgesFor({ type: 'event', simulated: false })).not.toContain('Simulated'));
  it('confirmed item weight is 1.00', () => expect(scoreBreakdown({ ...base, matchedItems: [{ id: 'a', kind: 'inferred', confirmed_by_user: true }] }).evidenceWeight).toBe(1));
  it('fact weight is 0.85', () => expect(scoreBreakdown({ ...base, matchedItems: [{ id: 'b', kind: 'fact', confirmed_by_user: false }] }).evidenceWeight).toBe(0.85));
  it('inferred weight is 0.60', () => expect(scoreBreakdown({ ...base, matchedItems: [{ id: 'c', kind: 'inferred', confirmed_by_user: false }] }).evidenceWeight).toBe(0.6));
  it('no valid item weight is 0.40 and is a weak basis', () => {
    const b = scoreBreakdown({ ...base, matchedItems: [{ id: 'd', kind: 'missing', confirmed_by_user: false }] });
    expect(b.evidenceWeight).toBe(0.4); expect(b.weakBasis).toBe(true); expect(b.total).toBe(32);
    expect(isWeakBasis([])).toBe(true); expect(isWeakBasis(['x'])).toBe(false);
  });
  it('uses the best matched item', () => expect(scoreMatch({ ...base, aiScore: 100, matchedItems: [{ id: 'c', kind: 'inferred', confirmed_by_user: false }, { id: 'b', kind: 'fact', confirmed_by_user: false }] })).toBe(85));
  it('a chosen priority adds exactly 15', () => expect(scoreMatch({ ...base, aiScore: 50, priorities: ['funding'] }) - scoreMatch({ ...base, aiScore: 50 })).toBe(15));
  it('a down vote on the item subtracts exactly 30', () => expect(scoreMatch({ ...base, aiScore: 100, downVoted: [opp] })).toBe(10));
  it('similar titles of the same type still subtract 10', () => expect(scoreBreakdown({ ...base, opportunity: { id: 'o2', type: 'funding', title: 'Green innovation grant call' }, downVoted: [{ id: 'o9', type: 'funding', title: 'Blue innovation grant' }] }).feedbackPenalty).toBe(-10));
  it('clamps to 0..100', () => {
    expect(scoreMatch({ ...base, aiScore: 100, priorities: ['funding'], matchedItems: [{ id: 'a', kind: 'fact', confirmed_by_user: true }] })).toBe(100);
    expect(scoreMatch({ ...base, aiScore: 10, downVoted: [opp] })).toBe(0);
  });
  it.each(['The company is eligible for this call.', 'Eligibility looks strong; ineligible partners excluded.', 'You are ELIGIBLE'])('no reason text contains "eligible": %s', (t) => expect(sanitizeWording(t).toLowerCase()).not.toMatch(/eligib/));
  it.each(['Funding is guaranteed.', 'We guarantee a place.', 'This guarantees nothing'])('no text contains "guarantee": %s', (t) => expect(sanitizeWording(t).toLowerCase()).not.toMatch(/guarantee/));
});
