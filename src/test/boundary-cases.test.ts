import { describe, it, expect } from 'vitest';
import { boundaryTests, decideReply, guardClasses } from '@/lib/park-rules';
import cases from '../../evals/boundary-cases.json';

describe('Boundary cases (evals/boundary-cases.json)', () => {
  it('the eval file and the in-app /trust tests are the same 12 cases', () => {
    expect(cases).toHaveLength(12);
    expect(cases.map((c) => ({ message: c.message, expected: c.expected }))).toEqual(boundaryTests);
  });
  it('every expected class is a real Guard class', () => {
    for (const c of cases) expect(guardClasses).toContain(c.expected);
  });
  it('fixed code never lets the AI answer overrides or private questions', () => {
    for (const g of ['override_attempt', 'other_company_private', 'out_of_scope', 'unclear'] as const) {
      expect(decideReply(g).answer).toBe(false);
      expect(decideReply(g).fixedText).toBeTruthy();
    }
  });
  it('needs_human answers with a disclaimer and a staff contact card', () => {
    const d = decideReply('needs_human');
    expect(d.disclaimer).toMatch(/not an eligibility decision/);
    expect(d.contactCard).toBe(true);
  });
});
