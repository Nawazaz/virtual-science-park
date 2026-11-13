import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import type { Viewer } from './access-rules';

export const getViewer = createServerFn({ method: 'GET' }).handler(async (): Promise<Viewer> => {
  const { currentViewer } = await import('./access.server');
  return currentViewer();
});

/** Simulated sign-in: no password. A real service would replace this with company accounts. */
export const signInAs = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ as: z.union([z.literal('guest'), z.literal('staff'), z.string().uuid()]) }))
  .handler(async ({ data }): Promise<Viewer> => {
    const { setViewer } = await import('./access.server');
    let viewer: Viewer = { kind: 'guest' };
    if (data.as === 'staff') viewer = { kind: 'staff' };
    else if (data.as !== 'guest') {
      const { publicDb } = await import('./db.server');
      const { data: company, error } = await publicDb().from('companies').select('id').eq('id', data.as).maybeSingle();
      if (error) throw new Error(error.message);
      if (!company) throw new Error('Company not found.');
      viewer = { kind: 'company', companyId: company.id };
    }
    setViewer(viewer);
    return viewer;
  });
