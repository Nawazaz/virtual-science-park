<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Application architecture
- Public company reads and mutations use publishable-key server functions and explicit anonymous RLS. On the local branch every company read and write goes through the demo-account sign-in (/sign-in checks email + DEMO_PASSWORD with a lockout, then sets a signed vsp_session cookie; rules in access-rules.ts and demo-accounts.ts): other companies get public AI-found items only, staff see profiles and rankings, and only the company sees its chats and feedback or edits its profile. New server functions that return company data must apply the same rules.
- With a local model (OLLAMA_MODEL), every model call goes through the chat-first dispatcher in src/lib/ai/dispatcher.ts (lanes: chat = Guard and Assistant, background = Profiler, Matcher and boundary tests) and gets a reply-length cap. New agents pass their lane to agentModel().
- Website profile building uses a streaming TanStack HTTP route and server-only AI modules; this avoids buffering long AI operations and keeps keys private.
- Generated profiles are replaced atomically by a database function that preserves company-confirmed fields; rebuilds must never overwrite manual confirmation.
- Website fetching validates public addresses and every redirect and caps page count and content size; arbitrary private-network fetching is forbidden.
- Persistent AI denial state is private infrastructure data and uses the privileged client only for that state, never ordinary company reads.
- Opportunity scouts are server-only fetchers of fixed public sources plus the staff-curated testbeds table; pure parsing (news window, dedup, testbed mapping) lives in opportunity-rules; a source that fails or returns nothing gets flagged simulated samples and a recorded check status, so missing data is never silent.
- Match scores combine the AI relevance with a deterministic weighting in opportunity-rules (confirmed > fact > inferred, priority boost, down-vote penalty) and all match text passes an eligibility-wording sanitizer; keep these rules testable and outside the prompt.
- Every profile build, source refresh, match run and assistant answer writes one agent_runs row listing its deterministic checks; the "How was this made?" sheet reads the latest row, so new agents must log runs too.
- The selected company lives in the root ?company= search param and all internal links preserve search; pages read it via useViewingAs instead of local state.
- Shared evidence UI (EvidenceBadge, SourceChip, MatchScore, HowMadeLink) lives in src/components/park and pages must reuse it rather than restyle evidence inline.
- The assistant answers only from data loaded for the current company_id (its profile and matches).
- Assistant replies are decided by fixed code (park-rules decideReply) from an AI Guard class; the AI never chooses whether to refuse, and boundary tests on /trust exercise the real Guard.
- The nightly job (nightly.server.ts) runs sources → profiles → matching one company at a time, records failures instead of stopping, and logs one "Nightly run" agent_runs row; cron fires at 01:00 and 02:00 UTC and the handler runs only at 03:00 Stockholm so DST is handled in code.
