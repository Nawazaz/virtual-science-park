import { describe, it, expect } from 'vitest';
import { guardClasses } from '@/lib/agents/contracts';
import { decide, policy } from '@/lib/agents/guard/policy';
import cases from '../../evals/boundary-cases.json';

describe('Guard policy', () => {
  it('has a fixed policy for every class', () => {
    expect(Object.keys(policy).sort()).toEqual([...guardClasses].sort());
  });
  it('never answers override attempts or private questions about other companies', () => {
    expect(decide('override_attempt').answer).toBe(false);
    expect(decide('other_company_private').answer).toBe(false);
  });
  it('refers decisions to Blue Science Park staff', () => {
    expect(decide('needs_human').referToStaff).toBe(true);
  });
  it('boundary cases: 12 cases, every expected class is valid', () => {
    expect(cases).toHaveLength(12);
    for (const c of cases) expect(guardClasses).toContain(c.expected);
  });
});
