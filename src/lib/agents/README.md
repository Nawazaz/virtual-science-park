# Agents

One folder per owner (BLUEPRINT.md section 4). Lovable built the agents flat
in `src/lib/`; do not move those files. This folder holds the shared types
(`contracts.ts`) and each owner's notes.

## Where each agent lives

| Agent | Code (AI / network) | Pure rules (tested) | Test |
|---|---|---|---|
| Profiler | `src/lib/build-profile.server.ts`, `src/lib/website.server.ts` | `src/lib/profile-rules.ts` | `profile-rules.test.ts` |
| Scouts | `src/lib/scouts.server.ts` | `src/lib/opportunity-rules.ts` (`simulatedSamples`) | `opportunity-rules.test.ts` |
| Matcher | `src/lib/matcher.server.ts` | `src/lib/opportunity-rules.ts` (`scoreBreakdown`, `sanitizeWording`) | `opportunity-rules.test.ts` |
| Guard + Assistant | `src/lib/assistant.server.ts` | `src/lib/park-rules.ts` (`decideReply`, `boundaryTests`) | `park-rules.test.ts`, `boundary-cases.test.ts` |
| Connections, dashboard | `src/lib/park.functions.ts` | `src/lib/park-rules.ts` (`connectionBasis`, `completeness`) | `park-rules.test.ts` |
| Run log | `src/lib/agent-runs.server.ts` (writes `agent_runs`) | | |
| "What changed" | database function `replace_generated_profile` writes `profile_changes` | | |
| Nightly run | `src/lib/nightly.server.ts`, cron route `src/routes/api/public/cron/nightly.ts` (03:00 Stockholm) | `src/lib/nightly-rules.ts` | |
| News, testbeds | `src/lib/scouts.server.ts`, `src/lib/testbeds.functions.ts` | `src/lib/opportunity-rules.ts` (`newsFromPosts`, `testbedOpportunities`) | `sources.test.ts` |
