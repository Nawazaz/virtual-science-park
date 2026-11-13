import { describe, expect, it } from 'vitest';
import { accountFor, emailFor, initials, SignInThrottle, slug, staffEmail } from '@/lib/demo-accounts';

const companies = [
  { id: '11111111-1111-4111-8111-111111111111', name: 'Njord X' },
  { id: '22222222-2222-4222-8222-222222222222', name: 'Kingspan BAGA' },
  { id: '33333333-3333-4333-8333-333333333333', name: 'Ålö Marin AB' },
];

describe('demo accounts', () => {
  it('makes a readable email from the company name', () => {
    expect(emailFor('Njord X')).toBe('njord-x@demo.vsp');
    expect(emailFor('Ålö Marin AB')).toBe('alo-marin-ab@demo.vsp');
    expect(slug('!!!')).toBe('company');
  });

  it('finds the account for an email, ignoring case and spaces', () => {
    expect(accountFor('  NJORD-X@demo.vsp ', companies)).toEqual({ kind: 'company', companyId: companies[0]!.id });
    expect(accountFor(staffEmail, companies)).toEqual({ kind: 'staff' });
    expect(accountFor('alo-marin-ab@demo.vsp', companies)).toEqual({ kind: 'company', companyId: companies[2]!.id });
  });

  it('has no account for unknown emails', () => {
    expect(accountFor('someone@else.se', companies)).toBeNull();
    expect(accountFor('', companies)).toBeNull();
  });

  it('builds initials for the avatar', () => {
    expect(initials('Njord X')).toBe('NX');
    expect(initials('WIP')).toBe('WI');
    expect(initials('Blue Science Park staff')).toBe('BS');
    expect(initials('')).toBe('?');
  });
});

describe('sign-in throttle', () => {
  it('locks an email after 5 wrong passwords, then lets it try again', () => {
    let t = 0;
    const th = new SignInThrottle(5, 60_000, () => t);
    for (let i = 0; i < 4; i++) th.failed('a@demo.vsp');
    expect(th.lockedFor('a@demo.vsp')).toBe(0);
    th.failed('A@demo.vsp '); // same email, other spelling
    expect(th.lockedFor('a@demo.vsp')).toBe(60);
    t = 30_000;
    expect(th.lockedFor('a@demo.vsp')).toBe(30);
    expect(th.lockedFor('b@demo.vsp')).toBe(0); // other emails unaffected
    t = 60_001;
    expect(th.lockedFor('a@demo.vsp')).toBe(0);
    th.failed('a@demo.vsp'); // a fresh count after the lock ends
    expect(th.lockedFor('a@demo.vsp')).toBe(0);
  });

  it('a correct password clears the count', () => {
    const th = new SignInThrottle(2, 60_000, () => 0);
    th.failed('a@demo.vsp');
    th.succeeded('a@demo.vsp');
    th.failed('a@demo.vsp');
    expect(th.lockedFor('a@demo.vsp')).toBe(0);
  });
});
