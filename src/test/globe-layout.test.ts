import { describe, expect, it } from 'vitest';
import { companyRadius, globeLayout, spherePoint, topicRadius } from '@/lib/globe-layout';

const dist = (a: number[], b: number[]) => Math.hypot(a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!);

describe('topic globe layout', () => {
  it('puts topics on the inner sphere and companies on the outer sphere', () => {
    const g = globeLayout(['a', 'b', 'c'], [{ id: 'x', topics: ['a'] }, { id: 'y', topics: [] }]);
    for (const p of g.topics.values()) expect(Math.hypot(...p)).toBeCloseTo(topicRadius, 5);
    for (const p of g.companies.values()) expect(Math.hypot(...p)).toBeCloseTo(companyRadius, 5);
  });

  it('places a company next to its own topic rather than a far one', () => {
    const ids = Array.from({ length: 20 }, (_, i) => `t${i}`);
    const g = globeLayout(ids, [{ id: 'x', topics: ['t3'] }]);
    const x = g.companies.get('x')!;
    const nearest = [...g.topics.entries()].sort((a, b) => dist(a[1], x) - dist(b[1], x))[0]![0];
    expect(nearest).toBe('t3');
  });

  it('spreads points evenly enough that none overlap', () => {
    const pts = Array.from({ length: 25 }, (_, i) => spherePoint(i, 25, topicRadius));
    let min = Infinity;
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) min = Math.min(min, dist(pts[i]!, pts[j]!));
    expect(min).toBeGreaterThan(20);
  });
});
