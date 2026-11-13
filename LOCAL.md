# Run Virtual Science Park on your own computer

This is the `local` branch. Everything runs on your PC except the database,
which is your own free Supabase project:

| Part | Where it runs |
|---|---|
| App, pages, scouts, rules, nightly job | Your PC (`npm run dev:local`) |
| AI agents (Profiler, Matcher, Guard, Assistant) | Your PC, through [Ollama](https://ollama.com) |
| Database | Your own Supabase project (free tier) |

The `main` branch stays identical to the Lovable version. The only code
difference is `src/lib/ai/model.server.ts`: when `OLLAMA_MODEL` is set, every
agent uses the local model instead of Lovable's AI gateway.

## 1. Install Ollama and a model (one time)

```bash
winget install --id Ollama.Ollama -e
```

Give the model enough room to read website pages (then quit and reopen Ollama
from the system tray so it picks this up):

```bash
setx OLLAMA_CONTEXT_LENGTH 16384
```

Download the model (about 2 GB):

```bash
ollama pull qwen2.5:3b
```

`qwen2.5:3b` fits a 4 GB graphics card (GTX 1650). A bigger model gives
better profiles and Guard decisions if your hardware allows it: change
`OLLAMA_MODEL` in `.env.local` after pulling it.

## 2. Create your database (one time)

1. Sign up at [supabase.com](https://supabase.com) and create a new project
   (free tier, region close to you).
2. Open **SQL Editor**, paste the whole of [`local/setup.sql`](local/setup.sql)
   and click **Run**. It creates all tables, seeds Njord X, WIP and
   Kingspan BAGA, and adds the sample testing items.
3. Open **Project Settings → API keys** and copy the project URL, the
   publishable key and the secret (service role) key.

## 3. Fill in your settings (one time)

```bash
copy .env.local.example .env.local
```

Open `.env.local` and paste the values from step 2. It is never committed
(`*.local` is in `.gitignore`), so the keys stay on your PC.

## 4. Run it

```bash
npm install
```

```bash
npm run dev:local
```

Open http://localhost:8080. On a member, click **Build profile**, then open
**Opportunities**, click **Refresh sources** and run matching.

Run the nightly job by hand (the app must be running):

```bash
npm run nightly:local
```

To run it automatically every night at 03:00 while the PC is on, use Windows
Task Scheduler with the action
`cmd /c cd /d "%USERPROFILE%\OneDrive\Documents\virtual-science-park" && npm run nightly:local`.

## What to expect from a small local model

- **Slower:** a profile build or a match run can take a few minutes on a
  GTX 1650. The Matcher ranks 6 opportunities per call (`LOCAL_MATCH_BATCH`).
- **Thinner profiles:** the model reads the first 6,000 characters of each page
  (`LOCAL_PAGE_CHARS`). More facts get downgraded to "Inferred", because the
  quote check still compares against the full page. That is the safety rule
  doing its job.
- **Boundary tests:** expect fewer than 12 of 12 on `/trust`. The reply rules
  are fixed code, but a small model picks the wrong class more often.
- **Errors you may see:** "Ollama is not running" (start the Ollama app) or
  "model is not downloaded" (run `ollama pull <model>`).

## Keeping the local branch up to date

When a new Lovable zip lands on `main`, merge it in:

```bash
git switch local
```

```bash
git merge main
```

If Lovable changed `build-profile.server.ts`, `matcher.server.ts` or
`assistant.server.ts`, re-apply the switch: those files call `agentModel()`
from `src/lib/ai/model.server.ts` instead of creating the Lovable provider.
