/**
 * Chat-first dispatcher for the local model (option D).
 *
 * One Ollama model can only work on a few requests at once. Without this, a person asking the
 * Assistant waits behind every Profiler or Matcher call already queued. The dispatcher hands out
 * model slots and always serves the chat lane (Guard, Assistant) before the background lane
 * (Profiler, Matcher, boundary tests). A running call is never interrupted: chat waits at most for
 * the call that is already using the model. Background work is split into small calls
 * (LOCAL_MATCH_BATCH), so that wait stays short.
 *
 * Pure code with no I/O, so it is unit-tested; model.server.ts wraps every Ollama request in it.
 */
export type Lane = 'chat' | 'background';

export type Slot = {
  /** Give the slot back. Safe to call more than once. */
  release: () => void;
  /** How long the request waited for a slot, in milliseconds. */
  waitedMs: number;
};

type Waiting = { grant: (slot: Slot) => void; queuedAt: number; lane: Lane };

export class Dispatcher {
  private running = 0;
  private readonly queues: Record<Lane, Waiting[]> = { chat: [], background: [] };
  /** Until this time a free slot is kept for chat only (see chatGraceMs). */
  private chatHoldUntil = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;

  /**
   * @param chatGraceMs One Assistant reply is two calls in a row (Guard, then answer). After a chat
   *   call ends, the slot stays reserved for chat this long, so background work can't slip in
   *   between the two and make the person wait a whole extra batch.
   */
  constructor(
    private readonly slots = 1,
    private readonly now: () => number = Date.now,
    private readonly chatGraceMs = 0,
  ) {}

  /** Wait for a model slot. Chat requests are served before background ones. */
  acquire(lane: Lane, signal?: AbortSignal): Promise<Slot> {
    if (signal?.aborted) return Promise.reject(signal.reason ?? new Error('Aborted'));
    return new Promise<Slot>((resolve, reject) => {
      const queuedAt = this.now();
      const entry: Waiting = { grant: resolve, queuedAt, lane };
      const onAbort = () => {
        const q = this.queues[lane];
        const i = q.indexOf(entry);
        if (i >= 0) {
          q.splice(i, 1);
          reject(signal?.reason ?? new Error('Aborted'));
        }
      };
      signal?.addEventListener('abort', onAbort, { once: true });
      entry.grant = (slot) => {
        signal?.removeEventListener('abort', onAbort);
        resolve(slot);
      };
      this.queues[lane].push(entry);
      this.next();
    });
  }

  /** Requests waiting per lane and slots in use, for logs and tests. */
  stats() {
    return { running: this.running, chat: this.queues.chat.length, background: this.queues.background.length };
  }

  private next() {
    while (this.running < this.slots) {
      let entry = this.queues.chat.shift();
      if (!entry) {
        if (!this.queues.background.length) return;
        const wait = this.chatHoldUntil - this.now();
        if (wait > 0) {
          // Slot reserved for a follow-up chat call; try background again when the grace ends.
          this.timer ??= setTimeout(() => {
            this.timer = undefined;
            this.next();
          }, wait);
          return;
        }
        entry = this.queues.background.shift()!;
      }
      this.running++;
      let released = false;
      const lane = entry.lane;
      entry.grant({
        waitedMs: this.now() - entry.queuedAt,
        release: () => {
          if (released) return;
          released = true;
          this.running--;
          if (lane === 'chat' && this.chatGraceMs > 0) this.chatHoldUntil = this.now() + this.chatGraceMs;
          this.next();
        },
      });
    }
  }
}

/**
 * Keep the slot until the model has finished streaming its reply (or the reader stops), not just
 * until the headers arrive: the model is busy for the whole stream.
 */
export function holdUntilDone(response: Response, release: () => void): Response {
  if (!response.body) {
    release();
    return response;
  }
  const reader = response.body.getReader();
  const body = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (done) {
          release();
          controller.close();
        } else controller.enqueue(value);
      } catch (e) {
        release();
        controller.error(e);
      }
    },
    cancel(reason) {
      release();
      return reader.cancel(reason);
    },
  });
  return new Response(body, { status: response.status, statusText: response.statusText, headers: response.headers });
}
