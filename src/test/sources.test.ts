import { describe, it, expect } from 'vitest';
import { vinnovaSince } from '@/lib/opportunity-rules';
import { newsFromPosts, testbedOpportunities, simulatedSamples, NEWS_SOURCE, TESTBED_SOURCE } from '@/lib/opportunity-rules';
const now = new Date('2026-11-13T12:00:00Z');
const post = (link: string, date: string) => ({ link, date, title: { rendered: '<b>Hello &amp; welcome</b>' }, excerpt: { rendered: '<p>Some <i>news</i></p>' } });
describe('Real sources', () => {
  it('keeps news from the last 120 days only', () => expect(newsFromPosts([post('a', '2026-08-01T00:00:00'), post('b', '2026-07-01T00:00:00')], now).map(n => n.source_url)).toEqual(['a']));
  it('removes duplicate news by link', () => expect(newsFromPosts([post('a', '2026-11-01T00:00:00'), post('a', '2026-11-02T00:00:00')], now)).toHaveLength(1));
  it('strips HTML and stores the post date, not simulated', () => {
    const [n] = newsFromPosts([post('a', '2026-11-01T09:00:00')], now);
    expect(n).toMatchObject({ type: 'news', title: 'Hello & welcome', summary: 'Some news', deadline_or_date: '2026-11-01', simulated: false, source_name: NEWS_SOURCE });
  });
  const tb = { id: '1', name: 'Lab', organisation: 'Org', description: 'd', what_you_can_test: 'sensors', how_to_start: 'email us', location: 'Karlskrona', url: 'https://lab.se', active: true };
  it('turns only active testbeds into real testing items', () => {
    const r = testbedOpportunities([tb, { ...tb, id: '2', active: false }]);
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ type: 'testing', source_name: TESTBED_SOURCE, source_url: 'https://lab.se', purpose: 'sensors', key_requirements: 'email us', simulated: false });
  });
  it('with no active testbeds the samples are simulated', () => { const s = simulatedSamples(TESTBED_SOURCE); expect(s.length).toBeGreaterThan(0); expect(s.every(x => x.simulated && x.type === 'testing')).toBe(true); });
  it('Vinnova look-back is a rolling 6-month window, not a fixed date', () => {
    expect(vinnovaSince(now)).toBe('2026-05-14');
    expect(vinnovaSince(new Date('2027-06-01T00:00:00Z'))).toBe('2026-11-30');
  });
});
