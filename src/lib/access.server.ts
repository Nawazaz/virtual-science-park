import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { deleteCookie, getCookie, setCookie } from '@tanstack/react-start/server';
import { canActAs, canSeeProfile, notAllowedMessage, type Viewer } from './access-rules';
import { SignInThrottle } from './demo-accounts';
import { decodeViewer, encodeViewer } from './session-token.server';

const cookieName = 'vsp_session';
const store = globalThis as { __vspSessionSecret?: string; __vspThrottle?: SignInThrottle };

/** The demo password, shown on the sign-in page unless DEMO_PASSWORD is set to a private one. */
export const defaultDemoPassword = 'bluepark2026';
export const demoPassword = () => process.env['DEMO_PASSWORD'] || defaultDemoPassword;
export const demoPasswordIsPublic = () => !process.env['DEMO_PASSWORD'];

/** Constant-time compare of hashes, so response time doesn't leak how much of the password matched. */
export function passwordMatches(given: string) {
  const h = (s: string) => createHash('sha256').update(s, 'utf8').digest();
  return timingSafeEqual(h(given), h(demoPassword()));
}

export const signInThrottle = () => (store.__vspThrottle ??= new SignInThrottle());

/** SESSION_SECRET keeps sign-ins across restarts; without it a random secret is used until the server stops. */
function secret() {
  return process.env['SESSION_SECRET'] || (store.__vspSessionSecret ??= randomBytes(32).toString('hex'));
}

export function currentViewer(): Viewer {
  return decodeViewer(getCookie(cookieName), secret());
}

export function setViewer(viewer: Viewer) {
  const token = encodeViewer(viewer, secret());
  if (!token) { deleteCookie(cookieName, { path: '/' }); return; }
  setCookie(cookieName, token, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 8, secure: process.env['NODE_ENV'] === 'production' });
}

/**
 * "Continue as visitor" on the sign-in page sets this cookie. Without a sign-in or this choice the
 * site sends people to the sign-in page first. It lasts until the browser closes, so the sign-in
 * page shows again next time.
 */
const visitorCookie = 'vsp_visitor';
export const choseVisitor = () => getCookie(visitorCookie) === '1';
export function setVisitorChoice(on: boolean) {
  if (on) setCookie(visitorCookie, '1', { httpOnly: true, sameSite: 'lax', path: '/', secure: process.env['NODE_ENV'] === 'production' });
  else deleteCookie(visitorCookie, { path: '/' });
}

/** Throws unless the viewer is this company or park staff. */
export function requireProfileAccess(companyId: string) {
  if (!canSeeProfile(currentViewer(), companyId)) throw new Error(notAllowedMessage);
}

/** Throws unless the viewer is signed in as this company. */
export function requireOwner(companyId: string) {
  if (!canActAs(currentViewer(), companyId)) throw new Error(notAllowedMessage);
}
