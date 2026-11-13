import type { Viewer } from './access-rules';

/**
 * Demo accounts for the local branch. There is no accounts table yet (that needs Lovable), so each
 * member company gets an email made from its name and park staff get one shared account. All use
 * the demo password (DEMO_PASSWORD). Pure code: shared by the server and the tests.
 */
export const staffEmail = 'staff@demo.vsp';
export const staffName = 'Blue Science Park staff';

export const slug = (name: string) =>
  name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'company';

export const emailFor = (companyName: string) => `${slug(companyName)}@demo.vsp`;
export const normalizeEmail = (email: string) => email.trim().toLowerCase();

/** Which viewer an email signs in as, or null when no account has that email. */
export function accountFor(email: string, companies: { id: string; name: string }[]): Viewer | null {
  const e = normalizeEmail(email);
  if (e === staffEmail) return { kind: 'staff' };
  const company = companies.find((c) => emailFor(c.name) === e);
  return company ? { kind: 'company', companyId: company.id } : null;
}

export function initials(name: string) {
  const words = name.replace(/[^\p{L}\p{N} ]/gu, ' ').split(/\s+/).filter(Boolean);
  if (!words.length) return '?';
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase();
  return (words[0]![0]! + words[1]![0]!).toUpperCase();
}

/**
 * Stops password guessing: after `maxFails` wrong passwords for one email, that email is locked for
 * `lockMs`. A correct password clears the count.
 */
export class SignInThrottle {
  private readonly fails = new Map<string, { count: number; lockedUntil: number }>();
  constructor(
    private readonly maxFails = 5,
    private readonly lockMs = 60_000,
    private readonly now: () => number = Date.now,
  ) {}

  /** Seconds left on the lock, or 0 when the email may try again. */
  lockedFor(email: string) {
    const f = this.fails.get(normalizeEmail(email));
    if (!f) return 0;
    const left = f.lockedUntil - this.now();
    return left > 0 ? Math.ceil(left / 1000) : 0;
  }

  failed(email: string) {
    const key = normalizeEmail(email);
    const f = this.fails.get(key);
    const count = f && f.lockedUntil <= this.now() && f.count >= this.maxFails ? 1 : (f?.count ?? 0) + 1;
    this.fails.set(key, { count, lockedUntil: count >= this.maxFails ? this.now() + this.lockMs : 0 });
  }

  succeeded(email: string) {
    this.fails.delete(normalizeEmail(email));
  }
}
