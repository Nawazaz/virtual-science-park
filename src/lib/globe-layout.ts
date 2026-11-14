/**
 * Placement for the 3D topic globe (pure, no three.js): topics spread evenly on an inner sphere,
 * each company on an outer sphere in the direction of the average of its topics, so members sit
 * next to the topics they share. A small fixed jitter keeps companies with identical topics apart.
 */
export type Vec = [number, number, number];
export const topicRadius = 70;
export const companyRadius = 150;

/** Even spread of n points on a sphere (Fibonacci lattice). */
export function spherePoint(i: number, n: number, r: number): Vec {
  const y = 1 - (2 * (i + 0.5)) / n;
  const rad = Math.sqrt(1 - y * y);
  const th = Math.PI * (3 - Math.sqrt(5)) * i;
  return [Math.cos(th) * rad * r, y * r, Math.sin(th) * rad * r];
}

const norm = (v: Vec, r: number): Vec => {
  const l = Math.hypot(...v) || 1;
  return [(v[0] / l) * r, (v[1] / l) * r, (v[2] / l) * r];
};

export function globeLayout(topicIds: string[], companies: { id: string; topics: string[] }[]) {
  const topics = new Map(topicIds.map((t, i) => [t, spherePoint(i, topicIds.length, topicRadius)] as const));
  const placed = new Map<string, Vec>();
  companies.forEach((c, i) => {
    const sum: Vec = [0, 0, 0];
    for (const t of c.topics) {
      const p = topics.get(t);
      if (p) { sum[0] += p[0]; sum[1] += p[1]; sum[2] += p[2]; }
    }
    const dir = Math.hypot(...sum) < 1 ? spherePoint(i, companies.length, 1) : norm(sum, 1);
    placed.set(c.id, norm([dir[0] + Math.sin(i * 12.9) * 0.18, dir[1] + Math.cos(i * 7.3) * 0.18, dir[2]], companyRadius));
  });
  return { topics, companies: placed };
}
