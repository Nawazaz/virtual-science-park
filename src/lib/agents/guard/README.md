# Guard and Assistant (Owner C)

Built by Lovable:
- `src/lib/assistant.server.ts`: the AI Guard classifies each message into one
  of six classes; `decideReply` in `src/lib/park-rules.ts` (fixed code) decides
  whether to answer, refuse, or add the staff disclaimer.
- The assistant loads only the current company's profile and matches.
- `/trust` → Boundary tests runs the 12 cases through the real Guard.
- `src/test/boundary-cases.test.ts` keeps `evals/boundary-cases.json` and the
  in-app cases identical.

Open points: chat history (`chat_messages`) is readable for every company with
the public key; per-company access needs login (see docs/LIMITATIONS.md).
