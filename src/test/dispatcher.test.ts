import { describe, expect, it, vi } from 'vitest';
import { Dispatcher, holdUntilDone } from '@/lib/ai/dispatcher';

const tick = () => new Promise((r) => setTimeout(r, 0));

describe('chat-first dispatcher', () => {
  it('serves waiting chat before waiting background work', async () => {
    const d = new Dispatcher(1);
    const order: string[] = [];
    const first = await d.acquire('background'); // the Matcher is using the model
    const bg = d.acquire('background').then((s) => { order.push('matcher batch 2'); return s; });
    const chat = d.acquire('chat').then((s) => { order.push('assistant'); return s; });
    expect(d.stats()).toEqual({ running: 1, chat: 1, background: 1 });
    first.release();
    (await chat).release();
    (await bg).release();
    expect(order).toEqual(['assistant', 'matcher batch 2']);
    expect(d.stats()).toEqual({ running: 0, chat: 0, background: 0 });
  });

  it('never interrupts the call already running', async () => {
    const d = new Dispatcher(1);
    const running = await d.acquire('background');
    let chatStarted = false;
    const chat = d.acquire('chat').then((s) => { chatStarted = true; return s; });
    await tick();
    expect(chatStarted).toBe(false);
    running.release();
    (await chat).release();
    expect(chatStarted).toBe(true);
  });

  it('keeps first-come order inside a lane and uses every slot', async () => {
    const d = new Dispatcher(2);
    const a = await d.acquire('chat');
    const b = await d.acquire('background'); // second slot, no wait
    const order: string[] = [];
    const c1 = d.acquire('chat').then((s) => { order.push('c1'); return s; });
    const c2 = d.acquire('chat').then((s) => { order.push('c2'); return s; });
    a.release();
    b.release();
    (await c1).release();
    (await c2).release();
    expect(order).toEqual(['c1', 'c2']);
  });

  it('reports how long a request waited', async () => {
    let t = 0;
    const d = new Dispatcher(1, () => t);
    const first = await d.acquire('background');
    const next = d.acquire('chat');
    t = 2500;
    first.release();
    const slot = await next;
    expect(slot.waitedMs).toBe(2500);
    expect(first.waitedMs).toBe(0);
  });

  it('keeps the slot for a follow-up chat call during the grace period', async () => {
    vi.useFakeTimers();
    try {
      let t = 0;
      const d = new Dispatcher(1, () => t, 2000);
      const guard = await d.acquire('chat'); // Guard is running
      const order: string[] = [];
      const bg = d.acquire('background').then((s) => { order.push('matcher'); return s; });
      t = 1000;
      guard.release(); // Guard done; the answer call is not queued yet
      await vi.advanceTimersByTimeAsync(0);
      expect(order).toEqual([]); // the matcher may not slip in
      t = 1500;
      const answer = await d.acquire('chat'); // answer call arrives within the grace
      order.push('answer');
      t = 9000;
      answer.release();
      t = 11500; // grace over and nobody else chatting
      await vi.advanceTimersByTimeAsync(2000);
      (await bg).release();
      expect(order).toEqual(['answer', 'matcher']);
    } finally {
      vi.useRealTimers();
    }
  });

  it('background work is not held up when nobody is chatting', async () => {
    const d = new Dispatcher(1, Date.now, 2000);
    const a = await d.acquire('background');
    const b = d.acquire('background');
    a.release();
    (await b).release(); // resolves straight away, no grace for background
    expect(d.stats().running).toBe(0);
  });

  it('releasing twice frees only one slot', async () => {
    const d = new Dispatcher(1);
    const s = await d.acquire('chat');
    s.release();
    s.release();
    expect(d.stats().running).toBe(0);
    const again = await d.acquire('chat');
    expect(d.stats().running).toBe(1);
    again.release();
  });

  it('drops a request that is aborted while waiting', async () => {
    const d = new Dispatcher(1);
    const running = await d.acquire('background');
    const ctrl = new AbortController();
    const waiting = d.acquire('background', ctrl.signal);
    ctrl.abort(new Error('user left'));
    await expect(waiting).rejects.toThrow('user left');
    expect(d.stats().background).toBe(0);
    running.release();
    expect(d.stats().running).toBe(0);
  });
});

describe('holdUntilDone', () => {
  it('keeps the slot until the streamed reply is fully read', async () => {
    let released = 0;
    const res = holdUntilDone(new Response('{"answer":"hi"}', { status: 200 }), () => released++);
    expect(released).toBe(0);
    expect(await res.text()).toBe('{"answer":"hi"}');
    expect(released).toBe(1);
  });

  it('frees the slot when the reader stops early', async () => {
    let released = 0;
    const res = holdUntilDone(new Response('partial'), () => released++);
    await res.body!.cancel();
    expect(released).toBe(1);
  });
});
