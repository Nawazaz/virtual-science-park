# Agents

One folder per owner (BLUEPRINT.md section 4). Stay in your own folder;
change `contracts.ts` only after telling the team.

## Where the Lovable code lives today

Lovable built the first version flat in `src/lib/`. Do not move these files
(the Lovable driver owns them); import from them or ask the driver.

| Agent | Existing Lovable file | Pure rules (tested) |
|---|---|---|
| Profiler | `src/lib/build-profile.server.ts`, `src/lib/website.server.ts` | `src/lib/profile-rules.ts` |
| Scouts | `src/lib/scouts.server.ts` | `src/lib/opportunity-rules.ts` (`simulatedSamples`) |
| Matcher | `src/lib/matcher.server.ts` | `src/lib/opportunity-rules.ts` (`scoreMatch`, `sanitizeWording`) |
| Guard + Assistant | not built yet | `guard/policy.ts` (started) |
| Run log | not built yet, needs an `agent_runs` table (ask the driver) | |
| Nightly run | not built yet (`src/integrations/supabase/cron-auth.ts` exists) | |
