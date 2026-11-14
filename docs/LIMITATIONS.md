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
- **Events are simulated for now.** The events scout reads Blue Science Park's
  live event feed, but the feed has no upcoming events (the newest is from
  February 2026), so labelled samples are shown. Real events appear
  automatically once they are published. The demo focuses on funding (Vinnova,
  EU) and news and trends (Blue Science Park news), which are live.
- **Removing a profile item does not stick.** A rebuild (or the nightly run)
  can add a removed AI item back. Edited and confirmed items are kept. Fixing
  this needs a "removed by company" marker in the database.
- **Members are added by hand.** Blue Science Park's website lists all 56
  members in its WordPress API (`/wp-json/wp/v2/medlem`, with industry tags),
  but the app does not import from it yet.
- **A small local model is weaker.** With Ollama, profiles are thinner and the
  Guard can pick the wrong class more often. Measured on 2026-11-14: the 12
  boundary tests passed 12 of 12 with `qwen2.5:7b` on an M3 Pro (2 caught by
  the fixed rule, 10 by the AI Guard); smaller models scored lower (see
  LOCAL.md). Override attempts are caught by fixed code whatever the model.
- **Automatic quality numbers on /trust are proxies.** "Quote check on AI facts"
  means the quote was found on the cited page; "Top-5 matches backed by the
  profile" means a match cites a profile item. Neither shows that a fact or a
  match is right. The human-checked numbers go in docs/EVALUATION.md from
  `evals/golden-profiles.json` and `evals/relevance-labels.json`.
- The nightly run processes companies one at a time; with 40+ members it should
  move to a queue to stay within request time limits.

## Next steps
- Accounts and per-company row-level security (company member, staff, visitor).
- Queue-based nightly run with change alerts by email.
- Automated testbed and trend sources; more funding sources.
- A second event source, or staff-curated events (same pattern as testbeds).
- Import the full member list from Blue Science Park's API, finding each
  company's own website from its member page.
- A "removed by company" marker so removed profile items stay removed.
