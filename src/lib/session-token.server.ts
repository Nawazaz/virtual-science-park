import { createHmac, timingSafeEqual } from 'node:crypto';
import { guestViewer, type Viewer } from './access-rules';

// The session cookie holds "staff" or "company:<id>" plus an HMAC signature,
// so the browser cannot change who it is signed in as without the server secret.
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const sign = (payload: string, secret: string) => createHmac('sha256', secret).update(payload).digest('base64url');

export function encodeViewer(viewer: Viewer, secret: string): string | null {
  if (viewer.kind === 'guest') return null;
  const payload = viewer.kind === 'staff' ? 'staff' : `company:${viewer.companyId}`;
  return `${payload}.${sign(payload, secret)}`;
}

export function decodeViewer(token: string | undefined, secret: string): Viewer {
  if (!token) return guestViewer;
  const dot = token.lastIndexOf('.');
  if (dot < 1) return guestViewer;
  const payload = token.slice(0, dot);
  const given = Buffer.from(token.slice(dot + 1));
  const expected = Buffer.from(sign(payload, secret));
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return guestViewer;
  if (payload === 'staff') return { kind: 'staff' };
  const id = payload.startsWith('company:') ? payload.slice('company:'.length) : '';
  return uuid.test(id) ? { kind: 'company', companyId: id.toLowerCase() } : guestViewer;
}
