# Known limitations and next steps

## Limitations
- **No login.** Every visitor can read and edit every company's data, including
  chat history (shared anonymous database access). The assistant itself only
  loads the current company's data, but a real service needs accounts and
  per-company access rules in the database.
- **Open job endpoints.** Without login, anyone can call the "Run now" nightly
  endpoint and the build/match endpoints, which spend AI credits. The scheduled
  cron route is protected by a secret.
- **Testbeds are curated by hand.** Public testbed directories block automated
  fetching, so staff add testbeds with a link on /staff. Until at least one is
  added, sample testing items with the orange Simulated badge are shown.
- **Automatic quality numbers on /trust are proxies.** Profile accuracy there
  means "quote found on the cited page"; relevance means "top-5 match backed by
  a profile item". The human-checked numbers go in docs/EVALUATION.md from
  `evals/golden-profiles.json` and `evals/relevance-labels.json`.
- The nightly run processes companies one at a time; with 40+ members it should
  move to a queue to stay within request time limits.

## Next steps
- Accounts and per-company row-level security (company member, staff, visitor).
- Queue-based nightly run with change alerts by email.
- Automated testbed and trend sources; more funding sources.
- TODO: add what you find during testing.
