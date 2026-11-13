/**
 * Shared types for every agent. Change this file only after telling the team
 * (BLUEPRINT.md, working rule 6).
 *
 * Rule of thumb: `*.server.ts` talks to AI or the network. `rules.ts`,
 * `scoring.ts`, `policy.ts` and `normalise.ts` are pure code with tests.
 */

export type AgentName = 'profiler' | 'scouts' | 'matcher' | 'guard' | 'assistant';

/** How sure we are about one profile item. */
export type EvidenceKind = 'confirmed' | 'fact' | 'inferred' | 'missing';

/** One deterministic check that ran on an agent's output. */
export type CheckResult = {
  name: string;
  passed: boolean;
  detail?: string;
};

/** One row of the `agent_runs` table: the proof behind "How was this made?". */
export type AgentRun = {
  agent: AgentName;
  companyId: string | null;
  startedAt: string; // ISO date
  durationMs: number;
  sourcesUsed: string[]; // URLs
  output: string; // short summary
  checks: CheckResult[];
  simulated: boolean;
};

/** The six chat classes the Guard can return. */
export const guardClasses = [
  'in_scope',
  'unclear',
  'out_of_scope',
  'override_attempt',
  'other_company_private',
  'needs_human',
] as const;
export type GuardClass = (typeof guardClasses)[number];
