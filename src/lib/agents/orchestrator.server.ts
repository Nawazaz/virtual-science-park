/**
 * Order of agents and the nightly run (BLUEPRINT.md, "How profiles stay current"):
 *   1. Scouts refresh opportunities
 *   2. Profiler rebuilds profiles (confirmed items never overwritten) and stores "what changed"
 *   3. Matcher re-ranks every company
 * Each step writes to agent_runs via run-log.server.ts.
 *
 * TODO: wire to a cron route protected by src/integrations/supabase/cron-auth.ts.
 */
export {};
