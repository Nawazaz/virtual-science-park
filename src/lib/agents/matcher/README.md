# Matcher (Owner B)

Scoring lives in `scoreBreakdown` in `src/lib/opportunity-rules.ts`; the "How was this made?" sheet shows its breakdown.

**Note:** Lovable's `scoreMatch` in `src/lib/opportunity-rules.ts` uses a
different formula from BLUEPRINT.md:

| | Blueprint | Lovable today |
|---|---|---|
| Evidence weight | 1.00 / 0.85 / 0.60 / 0.40 | `0.4 + 0.6 × (1 / 0.75 / 0.4)`, no items 0.2 |
| Priority boost | +15 | +10 (funding, events, testing) |
| Down vote | -30 | -25 (and -10 for similar titles) |
| Blocked words | "eligible", "guaranteed" | "eligible", "qualify" only |

Pick one, make code and docs agree, then point the Matcher at it.
