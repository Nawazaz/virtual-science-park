import type { AgentRun } from './contracts';

/**
 * Writes one row to `agent_runs`. The table does not exist yet: ask the
 * Lovable driver to add it (columns match `AgentRun` in contracts.ts).
 */
export async function logRun(run: AgentRun): Promise<void> {
  // TODO(Owner C): insert into agent_runs once the table exists.
  console.info('[agent_run]', run.agent, run.checks.filter((c) => !c.passed).length, 'failed checks');
}
