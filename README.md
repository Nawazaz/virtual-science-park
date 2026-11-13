# Virtual Science Park

AI agents that help Blue Science Park member companies find relevant funding,
events, testing environments and partners, based on an evidence-backed
understanding of each company.

Built for the Campor × BUILD Hackathon 2026 (Blue Science Park challenge).

> **The AI is never trusted alone.** Each agent has rules in plain code that
> check its answer, and each rule has a test.

## What's in the app

| Page | What it shows |
|---|---|
| Dashboard `/` | Personal digest for the selected company: top 5 possible matches, what changed, possible connections |
| Members `/members` | Member directory, add or import members from the Blue Science Park member list |
| Profile `/companies/:id` | Evidence-backed profile (Fact / Inferred / Missing / Confirmed by company), edit and confirm items, priorities, what changed |
| Opportunities `/opportunities` | Funding, events, testing and news, ranked per company, with reasons, dates, sources, save and feedback |
| Compare `/compare` | Same opportunities, different profiles, different rankings |
| Connections `/connections` | Possible collaborations between members and the shared basis |
| Assistant `/assistant` | Chat scoped to one company, guarded by six fixed reply classes |
| For staff `/staff` | Shared interests across members, deadlines, source health |
| Trust & quality `/trust` | Quality checks, the 12 boundary tests run live, agent run log |
| How it works `/about` | Agent roles, sources, matching formula, boundaries |

A nightly run at 03:00 (Stockholm) refreshes sources, rebuilds profiles and re-ranks matches; staff can also run it on demand.

Every result has a "How was this made?" link showing the agent run, its
sources and each code check. Sample data is marked with an orange
**Simulated** badge.

## Agents

| Agent | AI does | Code checks (no AI) |
|---|---|---|
| **Profiler** | Reads company websites and member pages, proposes profile items with a quote and a link. | Quote must exist on the page or the item becomes "Inferred". Interests are always "Inferred". Empty fields become "Missing". Private network links blocked. |
| **Scouts** | Nothing, or a short summary. | Fetch Vinnova, Blue Science Park events, EU Funding & Tenders, Blue Science Park news, and testbeds curated by staff. Drop past deadlines, remove duplicates, every item has a link and a retrieved date. Fallback samples carry `simulated = true`. |
| **Matcher** | Relevance 0-100, a reason, and the profile items it used. | `final = relevance × evidenceWeight (1.00 / 0.85 / 0.60 / 0.40) + 15 priority boost − 30 down vote`. Drops reasons that cite unknown items. Blocks "eligible" and "guaranteed". |
| **Guard** | Classifies each chat message into one of six classes. | `decideReply` (fixed code) picks the reply. The assistant only loads the current company's data. 12 boundary tests run live on `/trust`. |
| **Assistant** | Answers using only fetched data. | Every answer carries source links. Decisions go to Blue Science Park staff. |

More: [docs/BLUEPRINT.md](docs/BLUEPRINT.md), [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md),
[docs/EVALUATION.md](docs/EVALUATION.md), [docs/LIMITATIONS.md](docs/LIMITATIONS.md).

## Setup

> **Run everything on your own computer** (local AI with Ollama, your own database):
> switch to the `local` branch and follow [LOCAL.md](LOCAL.md).

Requires Node.js 22 or newer.

```sh
git clone https://github.com/Nawazaz/virtual-science-park.git
cd virtual-science-park
npm install
cp .env.example .env   # fill in the Supabase values from the Lovable project
npm run dev
npm test
```

AI calls go through the Lovable AI gateway, so profile building and matching
only work in the Lovable-hosted app (the `LOVABLE_API_KEY` secret is kept in
Lovable, never in this repo). The rules and their tests run anywhere.

## Repo layout

```
docs/                 blueprint, architecture, evaluation, limitations, pitch
evals/                golden profiles, 12 boundary cases, relevance labels
src/lib/              agents: profiler, scouts, matcher, assistant + pure rules files
src/lib/agents/       shared types and per-owner notes (where each agent lives)
src/components/park/  shared evidence UI (badges, source chips, How was this made?)
src/routes/           pages
src/test/             one test file per rules file
drizzle/, supabase/   database (changed through Lovable only)
```

## Built with

TanStack Start, React, TypeScript, Tailwind CSS, Supabase, Lovable.
