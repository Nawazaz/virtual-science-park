# Known limitations and next steps

## Limitations
- **No login.** Every visitor can read and edit every company's data, including
  chat history (shared anonymous database access). The assistant itself only
  loads the current company's data, but a real service needs accounts and
  per-company access rules in the database.
- **No nightly run yet.** Profiles and sources refresh when a user clicks
  Rebuild / Refresh. The scheduled run in `src/lib/agents/orchestrator.server.ts`
  is designed but not built.
- **Testing and news items are simulated** samples (orange badge). Funding
  (Vinnova, EU) and events (Blue Science Park) come from live sources, with
  simulated fallback if a source fails.
- **Automatic quality numbers on /trust are proxies.** Profile accuracy there
  means "quote found on the cited page"; relevance means "top-5 match backed by
  a profile item". The human-checked numbers go in docs/EVALUATION.md from
  `evals/golden-profiles.json` and `evals/relevance-labels.json`.
- Match scoring differs slightly from the blueprint formula (see
  `src/lib/agents/matcher/README.md`).

## Next steps
- Accounts and per-company row-level security.
- Nightly scheduled run with change alerts.
- Real testbed catalogue and news/trend sources.
- TODO: add what you find during testing.
