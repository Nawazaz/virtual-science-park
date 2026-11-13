# Known limitations and next steps

## Limitations
- **Sign-in uses demo accounts (local branch).** `/sign-in` takes an email and
  password. Each company gets `<name>@demo.vsp`, staff get `staff@demo.vsp`,
  and all share one demo password (`DEMO_PASSWORD`). The server checks the
  password, locks an email for a minute after 5 wrong tries, and checks a
  signed session cookie on every request (`src/lib/access-rules.ts`, tested):
  - Other companies see only what the AI found on public pages: no company
    edits, priorities, rankings, saved items, change history or chats.
  - Park staff see profiles and rankings, but not chats or feedback.
  - Only the company itself can edit its profile, vote or use its assistant.
  What is still missing: real accounts, each with its own password, and the same rules in the
  database. The database still allows anonymous access, so anyone holding the
  publishable key could read it directly. Next step: Supabase Auth plus
  row-level security per company (a schema change made in Lovable).
- **Open job endpoints.** Without real login, anyone can call the "Run now" nightly
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
