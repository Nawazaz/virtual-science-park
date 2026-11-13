# Matcher (Owner B)

Scoring lives in `scoreBreakdown` in `src/lib/opportunity-rules.ts` and matches
BLUEPRINT.md exactly:

```
final = relevance × evidenceWeight + priorityBoost + feedback   (0..100)
evidenceWeight  1.00 confirmed · 0.85 fact · 0.60 inferred · 0.40 none ("Weak basis")
priorityBoost   +15 when the type is a chosen priority
feedback        -30 voted down · -10 similar title of the same type voted down
```

`sanitizeWording` removes "eligible", "qualify" and "guaranteed". Tests:
`src/test/opportunity-rules.test.ts`. The "How was this made?" sheet shows the
breakdown for every match.
