import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import type { LanguageModel } from 'ai';
import { gatewayProvider, reasoningOptions, type GatewayFailure } from './gateway.server';
import { Dispatcher, holdUntilDone, type Lane } from './dispatcher';

/** One dispatcher per server process (kept on globalThis so dev hot reloads don't make a second one). */
const g = globalThis as { __vspDispatcher?: Dispatcher };
export const localDispatcher = () => {
  // instanceof: after a dev hot reload of dispatcher.ts the class changes, so a fresh one is made.
  if (!(g.__vspDispatcher instanceof Dispatcher))
    g.__vspDispatcher = new Dispatcher(Math.max(1, Number(process.env['LOCAL_AI_SLOTS'] ?? 1)), Date.now, 2000);
  return g.__vspDispatcher;
};

/**
 * One switch for every agent's model.
 * - OLLAMA_MODEL set  → a local model served by Ollama on this computer (local branch).
 * - otherwise         → Lovable's AI gateway (needs LOVABLE_API_KEY, only inside Lovable).
 */
export type AgentModel = {
  model: LanguageModel;
  /** Hosted-gateway reasoning settings; empty for the local model. */
  providerOptions: typeof reasoningOptions | Record<string, never>;
  /** Set when the provider answered with an error; agents turn it into a readable message. */
  state: { failure?: GatewayFailure; waitedMs?: number };
  runId: () => string | undefined;
  local: boolean;
};

export const isLocalAi = () => !!process.env['OLLAMA_MODEL'];

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
 */
export function agentModel(runId?: string, lane: Lane = 'background'): AgentModel {
  const ollamaModel = process.env['OLLAMA_MODEL'];
  if (ollamaModel) {
    const baseURL = process.env['OLLAMA_BASE_URL'] ?? 'http://localhost:11434/v1';
    const state: { failure?: GatewayFailure; waitedMs?: number } = {};
    const provider = createOpenAICompatible({
      name: 'ollama',
      baseURL,
      supportsStructuredOutputs: true,
      fetch: async (input, init) => {
        init = withReplyCap(init, lane);
        const slot = await localDispatcher().acquire(lane, init?.signal ?? undefined);
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
    return { model: provider.chatModel(ollamaModel), providerOptions: {}, state, runId: () => undefined, local: true };
  }
  const { provider, state, runId: getRunId } = gatewayProvider(runId);
  return { model: provider.responses('openai/gpt-6-astra'), providerOptions: reasoningOptions, state, runId: getRunId, local: false };
}
