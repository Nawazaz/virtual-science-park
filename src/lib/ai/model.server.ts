import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import type { LanguageModel } from 'ai';
import { gatewayProvider, reasoningOptions, type GatewayFailure } from './gateway.server';

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
  state: { failure?: GatewayFailure };
  runId: () => string | undefined;
  local: boolean;
};

export const isLocalAi = () => !!process.env['OLLAMA_MODEL'];

/** How much text of each page a small local model gets (the evidence check still uses the full page). */
export const localPageChars = () => Number(process.env['LOCAL_PAGE_CHARS'] ?? 6000);

export function agentModel(runId?: string): AgentModel {
  const ollamaModel = process.env['OLLAMA_MODEL'];
  if (ollamaModel) {
    const baseURL = process.env['OLLAMA_BASE_URL'] ?? 'http://localhost:11434/v1';
    const state: { failure?: GatewayFailure } = {};
    const provider = createOpenAICompatible({
      name: 'ollama',
      baseURL,
      supportsStructuredOutputs: true,
      fetch: async (input, init) => {
        let response: Response;
        try {
          response = await fetch(input, init);
        } catch {
          state.failure = { status: 503, message: `Ollama is not running at ${baseURL}. Start the Ollama app and try again.` };
          throw new Error(state.failure.message);
        }
        if (!response.ok) {
          const body = await response.clone().json().catch(() => null);
          const detail = body?.error?.message ?? body?.error ?? `status ${response.status}`;
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
