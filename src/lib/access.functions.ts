import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import type { Viewer } from './access-rules';
import { accountFor, emailFor, staffEmail, staffName } from './demo-accounts';

export const getViewer = createServerFn({ method: 'GET' }).handler(async (): Promise<Viewer> => {
  const { currentViewer } = await import('./access.server');
  return currentViewer();
});

const wrongLogin = 'Email or password is incorrect.';

/** Demo sign-in: email + password, checked on the server. Real accounts need Supabase Auth (Lovable). */
export const signIn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ email: z.string().trim().max(200), password: z.string().max(200) }))
  .handler(async ({ data }): Promise<Viewer> => {
    const { passwordMatches, setViewer, signInThrottle } = await import('./access.server');
    const throttle = signInThrottle();
    const wait = throttle.lockedFor(data.email);
    if (wait) throw new Error(`Too many wrong passwords. Try again in ${wait} seconds.`);
    const { publicDb } = await import('./db.server');
    const { data: companies, error } = await publicDb().from('companies').select('id,name');
    if (error) throw new Error(error.message);
    const viewer = accountFor(data.email, companies ?? []);
    // Same message whether the email or the password is wrong, so emails can't be probed.
    if (!passwordMatches(data.password) || !viewer) {
      throttle.failed(data.email);
      throw new Error(wrongLogin);
    }
    throttle.succeeded(data.email);
    setViewer(viewer);
    return viewer;
  });

export const signOut = createServerFn({ method: 'POST' }).handler(async (): Promise<Viewer> => {
  const { setViewer } = await import('./access.server');
  setViewer({ kind: 'guest' });
  return { kind: 'guest' };
});

/** The demo logins listed on the sign-in page. The password is only shown while it is the public default. */
export const getDemoAccounts = createServerFn({ method: 'GET' }).handler(async () => {
  const { demoPassword, demoPasswordIsPublic } = await import('./access.server');
  const { publicDb } = await import('./db.server');
  const { data, error } = await publicDb().from('companies').select('name').order('name');
  if (error) throw new Error(error.message);
  return {
    password: demoPasswordIsPublic() ? demoPassword() : null,
    accounts: [
      { name: staffName, email: staffEmail, role: 'Park staff' },
      ...(data ?? []).map((c) => ({ name: c.name, email: emailFor(c.name), role: 'Member company' })),
    ],
  };
});
