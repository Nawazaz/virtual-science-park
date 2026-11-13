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
   and click **Run**. It creates all tables, adds 5 member companies (Njord X,
   WIP, Kingspan BAGA, Ocean Harvesting, Techinova) and the sample testing items.
3. Open a **New query**, paste the whole of
   [`local/companies-verified.sql`](local/companies-verified.sql) and click
   **Run**. It fills in the 5 companies' profiles, checked by hand against
   their public pages (every fact has a quote and a link).
4. Open **Project Settings → API keys** and copy the project URL, the
   publishable key and the secret (service role) key.

## 3. Fill in your settings (one time)

```bash
copy .env.local.example .env.local
```

Open `.env.local` and paste the values from step 4. It is never committed
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

## Quick start with the Lovable database (no Supabase sign-up)

You can skip step 2 and use the database from your Lovable project:
`copy .env .env.local`, then add the Ollama lines from `.env.local.example`.
Local mode needs no admin key. **Careful:** this is the live database the jury
sees, so profiles you build or rebuild locally replace what the demo shows.

To put the 5 checked company profiles into this database, run this once (it
uses the app's own key, so no SQL editor is needed):

```bash
npm run companies:local
```

The placeholder "Example Company" stays in this database, because the app's
key may not delete companies; the app hides it (`src/lib/hidden-companies.ts`).
With your own Supabase project, run
[`local/companies-verified.sql`](local/companies-verified.sql) in its SQL
editor instead: it deletes the placeholder too. Clicking **Build profile** on one of them afterwards replaces the
checked profile with the AI's version, so for the demo show the checked
profiles first.

## Signing in (demo accounts)

The site opens on the sign-in page until you sign in or choose **Continue as
visitor**. Signing in and the visitor choice both last until you close the
browser or restart the app (`npm run dev:local`), so starting the website
always opens on the sign-in page. Signing out brings it back too. Every account uses the
demo password `bluepark2026`, which the sign-in page lists along with the
accounts. Click an account there to fill in the form.

- **A company** (`<company-name>@demo.vsp`, for example `njord-x@demo.vsp`):
  you see that company's full profile, rankings and chat, and you can edit
  them. Other companies show only what the AI found on their public pages.
- **Blue Science Park staff** (`staff@demo.vsp`): you see every profile and
  ranking, plus the staff page and Compare. Chats and feedback stay private to
  each company.
- **Visitor** (not signed in): you see public profiles only.

The server checks the password, and checks the session cookie on every request.
After 5 wrong passwords an email is locked for a minute. When signed in, the
account menu (your initials, top right) has **Switch account** and **Sign out**.

- Set `SESSION_SECRET` in `.env.local` to any long random text. It signs the
  session cookie so the browser can't fake who is signed in.
- Set `DEMO_PASSWORD` to use your own password. The sign-in page then hides it
  and shows only the emails.

## Chat goes first (the dispatcher)

One local model serves all four AI agents. Every call to Ollama goes through a
small dispatcher (`src/lib/ai/dispatcher.ts`), which works in two lanes:

- **Chat lane:** the Guard and the Assistant, where a person is waiting.
- **Background lane:** the Profiler, the Matcher and the boundary tests.

When the model frees up, a waiting chat call goes next, even if background
calls were queued earlier. A call that is already running is never stopped,
so a chat waits at most for one Matcher batch (6 opportunities). After a chat
call, the model stays reserved for chat for 2 seconds, so the Guard and the
answer run back to back. The Assistant's "How was this made?" sheet shows how
long it waited.

Every local reply also has a length cap (`LOCAL_CHAT_MAX_TOKENS`,
`LOCAL_MAX_TOKENS`). Without it, a small model can get stuck repeating itself
while writing JSON, and Ollama keeps generating forever. Every other agent
then waits behind it. With the cap, that call fails with an error and the
queue moves on.

To scale up, raise `LOCAL_AI_SLOTS` together with Ollama's
`OLLAMA_NUM_PARALLEL`, or point `OLLAMA_BASE_URL` at a bigger machine. The
lanes stay the same.

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
