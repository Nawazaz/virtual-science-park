import { describe, it, expect } from 'vitest';
import { accessTo, canActAs, canSeeProfile, isSignedIn, isStaff, runVisible, visibleCompany, type Viewer } from '@/lib/access-rules';
import { decodeViewer, encodeViewer } from '@/lib/session-token.server';

const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';
const asA: Viewer = { kind: 'company', companyId: A };
const staff: Viewer = { kind: 'staff' };
const guest: Viewer = { kind: 'guest' };

const company = {
  id: B,
  name: 'B',
  profile_items: [
    { id: 'ai', value: 'Found on the website', confirmed_by_user: false },
    { id: 'edit', value: 'Added by the company', confirmed_by_user: true },
  ],
  company_priorities: [{ priority: 'testing' }],
};

describe('Who may see what', () => {
  it('gives a company owner access only to itself', () => {
    expect(accessTo(asA, A)).toBe('owner');
    expect(accessTo(asA, B)).toBe('public');
    expect(accessTo(staff, B)).toBe('staff');
    expect(accessTo(guest, B)).toBe('public');
  });

  it('lets staff see profiles but not act as a company (chat, feedback, edits)', () => {
    expect(canSeeProfile(staff, B)).toBe(true);
    expect(canActAs(staff, B)).toBe(false);
    expect(canActAs(asA, A)).toBe(true);
  });

  it('shows other companies only AI-found public items and no priorities', () => {
    const seen = visibleCompany(asA, company);
    expect(seen.access).toBe('public');
    expect(seen.profile_items.map(i => i.id)).toEqual(['ai']);
    expect(seen.company_priorities).toEqual([]);
  });

  it('shows the full profile to the company itself and to staff', () => {
    expect(visibleCompany({ kind: 'company', companyId: B }, company).profile_items).toHaveLength(2);
    expect(visibleCompany(staff, company).company_priorities).toHaveLength(1);
  });

  it('hides assistant conversations from everyone but the company, staff included', () => {
    const chat = { agent: 'Assistant', company_id: B };
    expect(runVisible({ kind: 'company', companyId: B }, chat)).toBe(true);
    expect(runVisible(staff, chat)).toBe(false);
    expect(runVisible(asA, chat)).toBe(false);
    expect(runVisible(guest, { agent: 'Profile builder', company_id: B })).toBe(false);
    expect(runVisible(staff, { agent: 'Profile builder', company_id: B })).toBe(true);
    expect(runVisible(guest, { agent: 'Nightly run', company_id: null })).toBe(true);
  });
});

describe('Session token', () => {
  const secret = 'test-secret';

  it('round-trips a company and staff sign-in', () => {
    expect(decodeViewer(encodeViewer(asA, secret)!, secret)).toEqual(asA);
    expect(decodeViewer(encodeViewer(staff, secret)!, secret)).toEqual(staff);
    expect(encodeViewer(guest, secret)).toBeNull();
  });

  it('treats a changed company id as a visitor', () => {
    const token = encodeViewer(asA, secret)!;
    expect(decodeViewer(token.replace(A, B), secret)).toEqual(guest);
  });

  it('rejects a token signed with another secret, a missing signature or junk', () => {
    expect(decodeViewer(encodeViewer(staff, 'other')!, secret)).toEqual(guest);
    expect(decodeViewer('staff', secret)).toEqual(guest);
    expect(decodeViewer('staff.', secret)).toEqual(guest);
    expect(decodeViewer(undefined, secret)).toEqual(guest);
    expect(decodeViewer('company:not-a-uuid.x', secret)).toEqual(guest);
  });
});

describe('Who may start jobs', () => {
  const guest: Viewer = { kind: 'guest' };
  const staff: Viewer = { kind: 'staff' };
  const company: Viewer = { kind: 'company', companyId: '11111111-1111-4111-8111-111111111111' };
  const other = '22222222-2222-4222-8222-222222222222';
  it('only staff may run park-wide jobs (nightly run, add companies, testbeds)', () => {
    expect([guest, company, staff].map(isStaff)).toEqual([false, false, true]);
  });
  it('visitors may not refresh sources or run boundary tests; any signed-in account may', () => {
    expect([guest, company, staff].map(isSignedIn)).toEqual([false, true, true]);
  });
  it('a company may build or match only itself; staff may do any company', () => {
    expect(canSeeProfile(company, other)).toBe(false);
    expect(canSeeProfile(company, '11111111-1111-4111-8111-111111111111')).toBe(true);
    expect(canSeeProfile(staff, other)).toBe(true);
    expect(canSeeProfile(guest, other)).toBe(false);
  });
});
