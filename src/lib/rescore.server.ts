import { publicDb } from './db.server';
import { applyScoreRules } from './opportunity-rules';
import { logRun } from './agent-runs.server';
type Base = { ai: number; evidenceWeight: number; weakBasis: boolean };

/**
 * Re-rank a company's matches after a vote or priority change, without calling the AI.
 * The AI relevance and evidence weight come from the latest Matcher run (its `breakdowns`);
 * only the priority boost and feedback penalty are recomputed. Returns needsAi when no stored
 * breakdowns exist yet, so the caller can run the full Matcher instead.
 */
export async function rescoreMatches(companyId: string) {
  const started = Date.now();
  const db = publicDb();
  const { data: run, error: runError } = await db.from('agent_runs').select('output,started_at,sources_used,simulated').eq('agent', 'Matcher').eq('company_id', companyId).order('started_at', { ascending: false }).limit(1).maybeSingle();
  if (runError) throw new Error(runError.message);
  let stored: Record<string, Base> = {};
  try { stored = (JSON.parse(run?.output ?? '{}') as { breakdowns?: Record<string, Base> }).breakdowns ?? {}; } catch { stored = {}; }
  if (!run || !Object.keys(stored).length) return { rescored: 0, changed: 0, needsAi: true };

  const [m, p, f] = await Promise.all([
    db.from('matches').select('opportunity_id,score,opportunity:opportunities(id,type,title)').eq('company_id', companyId),
    db.from('company_priorities').select('priority').eq('company_id', companyId),
    db.from('feedback').select('opportunity:opportunities(id,type,title)').eq('company_id', companyId).eq('vote', 'down'),
  ]);
  for (const r of [m, p, f]) if (r.error) throw new Error(r.error.message);
  const priorities = (p.data ?? []).map((x) => x.priority);
  const downVoted = (f.data ?? []).flatMap((x) => (x.opportunity ? [x.opportunity] : []));

  const breakdowns: Record<string, ReturnType<typeof applyScoreRules>> = {};
  let changed = 0;
  for (const row of m.data ?? []) {
    const o = row.opportunity;
    const base = o ? stored[o.id] : undefined;
    if (!o || !base) continue;
    const b = applyScoreRules(base, { opportunity: o, priorities, downVoted });
    breakdowns[o.id] = b;
    if (b.total !== row.score) {
      const { error } = await db.from('matches').update({ score: b.total }).eq('company_id', companyId).eq('opportunity_id', o.id);
      if (error) throw new Error(error.message);
      changed++;
    }
  }
  const rescored = Object.keys(breakdowns).length;
  await logRun({
    agent: 'Matcher', company_id: companyId, started, sources: run.sources_used ?? [],
    output: JSON.stringify({ summary: `Re-ranked ${rescored} possible matches by code after a vote or priority change (${changed} score${changed === 1 ? '' : 's'} changed). AI relevance reused from the run on ${run.started_at.slice(0, 10)}.`, breakdowns }),
    checks: [
      { name: 'Re-ranked without AI', passed: true, detail: 'Stored AI relevance and evidence weight reused; only the priority boost and feedback penalty were recomputed' },
      { name: 'Score uses deterministic weighting', passed: true, detail: 'Confirmed > fact > inferred, priority boost, down-vote penalty' },
    ],
    simulated: run.simulated,
  });
  return { rescored, changed, needsAi: false };
}
