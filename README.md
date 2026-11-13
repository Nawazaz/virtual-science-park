# Virtual Science Park

AI agents that help Blue Science Park member companies find relevant funding,
events, testing environments and partners, based on an evidence-backed
understanding of each company.

Built for the Campor × BUILD Hackathon 2026 (Blue Science Park challenge).

> **The AI is never trusted alone.** Each agent has rules in plain code that
> check its answer, and each rule has a test.

## Agents

| Agent | AI does | Code checks (no AI) |
|---|---|---|
| **Profiler** | Reads company websites and member pages, proposes profile items with a quote and a link. | Quote must exist on the page or the item becomes "Inferred". Interests are always "Inferred". Empty fields become "Missing". Private network links blocked. |
| **Scouts** | Nothing, or a short summary. | Fetch Vinnova, Blue Science Park events and EU Funding & Tenders. Drop past deadlines, remove duplicates, every item has a link and a retrieved date. Fallback samples carry `simulated = true`. |
| **Matcher** | Relevance 0-100, a reason, and the profile items it used. | Final score from a fixed formula. Drops reasons that cite unknown items. Blocks "eligible" wording. |
| **Guard** | Classifies each chat message. | Fixed reply per class. Chat only reads the current company's data. |
| **Assistant** | Answers using only fetched data. | Every answer carries source links. Decisions go to Blue Science Park staff. |

More: [docs/BLUEPRINT.md](docs/BLUEPRINT.md), [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md),
[docs/EVALUATION.md](docs/EVALUATION.md), [docs/LIMITATIONS.md](docs/LIMITATIONS.md).

## Setup

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
src/lib/agents/       agent code per owner (contracts, guard, matcher, ...)
src/lib/              Lovable-built profiler, scouts and matcher
src/routes/           pages
src/test/             one test file per rules file
drizzle/, supabase/   database (changed through Lovable only)
```

## Built with

TanStack Start, React, TypeScript, Tailwind CSS, Supabase, Lovable.
