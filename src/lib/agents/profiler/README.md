# Profiler (Owner A)

Reads company websites and the BSP member page, proposes profile items with a
quote and a link. Code checks: quote must exist in the page or the item
becomes Inferred; interests always Inferred; empty fields Missing; private
network links blocked. Current code: `src/lib/build-profile.server.ts`,
rules in `src/lib/profile-rules.ts`.

Still to do: "what changed" between two builds.
