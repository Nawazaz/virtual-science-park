import { randomBytes } from 'node:crypto';
import { deleteCookie, getCookie, setCookie } from '@tanstack/react-start/server';
import { canActAs, canSeeProfile, notAllowedMessage, type Viewer } from './access-rules';
import { decodeViewer, encodeViewer } from './session-token.server';

const cookieName = 'vsp_session';
const store = globalThis as { __vspSessionSecret?: string };

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

/** Throws unless the viewer is this company or park staff. */
export function requireProfileAccess(companyId: string) {
  if (!canSeeProfile(currentViewer(), companyId)) throw new Error(notAllowedMessage);
}

/** Throws unless the viewer is signed in as this company. */
export function requireOwner(companyId: string) {
  if (!canActAs(currentViewer(), companyId)) throw new Error(notAllowedMessage);
}
