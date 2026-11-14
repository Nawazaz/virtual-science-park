import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import type { LanguageModel } from 'ai';
import { gatewayProvider, reasoningOptions, type GatewayFailure } from './gateway.server';
import { Dispatcher, holdUntilDone, type Lane } from './dispatcher';

/**
 * One dispatcher per local model, per server process (kept on globalThis so dev hot reloads don't
 * make a second one). Each model has its own queue: the junior model's Guard calls never wait
 * behind the senior model's Matcher batches.
 */
const g = globalThis as { __vspDispatchers?: Map<string, Dispatcher> };
export const localDispatcher = (model = process.env['OLLAMA_MODEL'] ?? '') => {
  const all = (g.__vspDispatchers ??= new Map());
  let d = all.get(model);
  // instanceof: after a dev hot reload of dispatcher.ts the class changes, so a fresh one is made.
  if (!(d instanceof Dispatcher)) {
    d = new Dispatcher(Math.max(1, Number(process.env['LOCAL_AI_SLOTS'] ?? 1)), Date.now, 2000);
    all.set(model, d);
  }
  return d;
};

/**
 * Option C: a small "junior" model for quick, narrow jobs, next to the "senior" model.
 * - senior (OLLAMA_MODEL): Profiler, Matcher, Assistant answers.
 * - junior (OLLAMA_JUNIOR_MODEL): the Guard's one-word classification. Empty = use the senior.
 */
export type Tier = 'senior' | 'junior';
export const localModelName = (tier: Tier = 'senior') =>
  (tier === 'junior' && process.env['OLLAMA_JUNIOR_MODEL']) || process.env['OLLAMA_MODEL'] || '';

/**
 * One switch for every agent's model.
 * - GROQ_API_KEY set  → Groq's cloud API (local branch; GROQ_MODEL, default openai/gpt-oss-120b).
 * - OLLAMA_MODEL set  → a local model served by Ollama on this computer (local branch).
 * - otherwise         → Lovable's AI gateway (needs LOVABLE_API_KEY, only inside Lovable).
 */
export type AgentModel = {
  model: LanguageModel;
  /** Provider-specific settings (hosted reasoning options, Groq reasoning effort). */
  providerOptions: typeof reasoningOptions | Record<string, Record<string, string>>;
  /** Set when the provider answered with an error; agents turn it into a readable message. */
  state: { failure?: GatewayFailure; waitedMs?: number };
  runId: () => string | undefined;
  /**
   * Small budget (Ollama's small model, Groq's free plan of 8,000 tokens a minute): agents send
   * shorter page text, rank opportunities in batches and use temperature 0 for the Guard.
   */
  local: boolean;
  /** The model that answers, e.g. "qwen2.5:3b", for the run log. */
  name: string;
};

export const aiProvider = (): 'groq' | 'ollama' | 'lovable' =>
  process.env['GROQ_API_KEY'] ? 'groq' : process.env['OLLAMA_MODEL'] ? 'ollama' : 'lovable';
/** Ollama on this computer: the dispatcher, reply caps and junior model apply. */
export const isLocalAi = () => aiProvider() === 'ollama';
/** Lovable's paid gateway: only it uses the AI pause flag (and needs the admin key for it). */
export const usesLovableGateway = () => aiProvider() === 'lovable';

/**
 * Groq calls with readable errors. On "too many requests" (free plan: 8,000 tokens a minute) it waits
 * as long as Groq asks (max 30 s) and tries again, up to 3 times, instead of failing the agent.
 */
function groqFetch(state: { failure?: GatewayFailure }): typeof fetch {
  return async (input, init) => {
    for (let attempt = 0; ; attempt++) {
      let res: Response;
      try {
        res = await fetch(input, init);
      } catch (e) {
        if (init?.signal?.aborted) throw e;
        state.failure = { status: 503, message: 'Cannot reach Groq. Check the internet connection.' };
        throw new Error(state.failure.message);
      }
      if (res.status === 429 && attempt < 3) {
        const wait = Math.min(30, Number(res.headers.get('retry-after')) || 5);
        await res.text().catch(() => '');
        await new Promise((r) => setTimeout(r, wait * 1000));
        continue;
      }
      if (res.ok) return res;
      const text = await res.text().catch(() => '');
      let detail: string | undefined;
      try { detail = (JSON.parse(text) as { error?: { message?: string } }).error?.message; } catch { detail = undefined; }
      state.failure = {
        status: 500,
        message: res.status === 401 ? 'Groq rejected the API key (GROQ_API_KEY in .env.local).'
          : res.status === 429 ? 'Groq rate limit reached (free plan). Try again in a minute.'
          : `Groq error: ${detail ?? `status ${res.status}`}`,
      };
      return new Response(text, { status: res.status, statusText: res.statusText, headers: res.headers });
    }
  };
}

/** How much text of each page a small local model gets (the evidence check still uses the full page). */
export const localPageChars = () => Number(process.env['LOCAL_PAGE_CHARS'] ?? 6000);

/**
 * Cap how long a local reply may get. A small model can loop while writing JSON, and Ollama then
 * keeps generating forever (it shifts the context instead of stopping), blocking every other agent.
 * Chat replies are short (a Guard class, a 140-word answer); background ones list many items.
 */
const replyCap = (lane: Lane) =>
  Number(lane === 'chat' ? process.env['LOCAL_CHAT_MAX_TOKENS'] ?? 600 : process.env['LOCAL_MAX_TOKENS'] ?? 2500);
function withReplyCap(init: RequestInit | undefined, lane: Lane): RequestInit | undefined {
  if (typeof init?.body !== 'string') return init;
  try {
    const body = JSON.parse(init.body) as Record<string, unknown>;
    if (body['max_tokens'] != null || body['max_completion_tokens'] != null) return init;
    return { ...init, body: JSON.stringify({ ...body, max_tokens: replyCap(lane) }) };
  } catch {
    return init;
  }
}

/**
 * `lane` only matters for the local model: 'chat' (Guard, Assistant) goes ahead of 'background'
 * (Profiler, Matcher, boundary tests) in the dispatcher. The hosted gateway runs calls in parallel.
 * `tier` picks the senior or junior local model (option C); the hosted gateway has one model.
 */
export function agentModel(runId?: string, lane: Lane = 'background', tier: Tier = 'senior'): AgentModel {
  if (aiProvider() === 'groq') {
    const name = process.env['GROQ_MODEL'] || 'openai/gpt-oss-120b';
    const state: { failure?: GatewayFailure; waitedMs?: number } = {};
    const provider = createOpenAICompatible({
      name: 'groq',
      baseURL: 'https://api.groq.com/openai/v1',
      apiKey: process.env['GROQ_API_KEY']!,
      supportsStructuredOutputs: true,
      fetch: groqFetch(state),
    });
    // gpt-oss models think before answering; "low" keeps that short, so replies are fast and use few tokens.
    const providerOptions = name.startsWith('openai/gpt-oss') ? { groq: { reasoningEffort: 'low' } } : {};
    return { model: provider.chatModel(name), providerOptions, state, runId: () => undefined, local: true, name };
  }
  const ollamaModel = isLocalAi() ? localModelName(tier) : '';
  if (ollamaModel) {
    const baseURL = process.env['OLLAMA_BASE_URL'] ?? 'http://localhost:11434/v1';
    const state: { failure?: GatewayFailure; waitedMs?: number } = {};
    const provider = createOpenAICompatible({
      name: 'ollama',
      baseURL,
      supportsStructuredOutputs: true,
      fetch: async (input, init) => {
        init = withReplyCap(init, lane);
        const slot = await localDispatcher(ollamaModel).acquire(lane, init?.signal ?? undefined);
        state.waitedMs = (state.waitedMs ?? 0) + slot.waitedMs;
        let response: Response;
        try {
          response = await fetch(input, init);
        } catch {
          slot.release();
          state.failure = { status: 503, message: `Ollama is not running at ${baseURL}. Start the Ollama app and try again.` };
          throw new Error(state.failure.message);
        }
        if (response.ok) return holdUntilDone(response, slot.release);
        // Error replies are short: read them now and free the slot straight away.
        const text = await response.text().catch(() => '');
        slot.release();
        const failed = response;
        response = new Response(text, { status: failed.status, statusText: failed.statusText, headers: failed.headers });
        {
          let body: { error?: { message?: string } | string } | null = null;
          try { body = JSON.parse(text); } catch { body = null; }
          const detail = (typeof body?.error === 'object' ? body.error.message : body?.error) ?? `status ${response.status}`;
          state.failure = {
            status: response.status === 404 ? 404 : 500,
            message: response.status === 404
              ? `Ollama model "${ollamaModel}" is not downloaded. Run: ollama pull ${ollamaModel}`
              : `Local model error: ${detail}`,
          };
        }
        return response;
      },
    });
    return { model: provider.chatModel(ollamaModel), providerOptions: {}, state, runId: () => undefined, local: true, name: ollamaModel };
  }
  const { provider, state, runId: getRunId } = gatewayProvider(runId);
  return { model: provider.responses('openai/gpt-6-astra'), providerOptions: reasoningOptions, state, runId: getRunId, local: false, name: 'openai/gpt-6-astra' };
}
