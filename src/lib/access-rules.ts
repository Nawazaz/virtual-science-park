// Who may see what. Pure rules, used by every server function that returns company data.
// The sign-in itself is simulated (pick a company in the top bar), but these rules run on the server.

export type Viewer = { kind: 'guest' } | { kind: 'staff' } | { kind: 'company'; companyId: string };
export type Access = 'owner' | 'staff' | 'public';

export const guestViewer: Viewer = { kind: 'guest' };

export function accessTo(viewer: Viewer, companyId: string): Access {
  if (viewer.kind === 'company' && viewer.companyId === companyId) return 'owner';
  if (viewer.kind === 'staff') return 'staff';
  return 'public';
}

/** Full profile, priorities, rankings and edit history: the company itself and Blue Science Park staff. */
export const canSeeProfile = (viewer: Viewer, companyId: string) => accessTo(viewer, companyId) !== 'public';

/** Chat, feedback and profile edits are the company's own interactions: the company only, not staff. */
export const canActAs = (viewer: Viewer, companyId: string) => accessTo(viewer, companyId) === 'owner';

/**
 * Asking the assistant about a company: the company itself (its saved conversation) and park staff.
 * Staff answers come only from data staff may already see (profile, priorities, matches); a staff
 * conversation is never saved to the company's chat, and staff never read the company's own chat.
 */
export const canAskAbout = (viewer: Viewer, companyId: string) => canSeeProfile(viewer, companyId);

/** Run-log name for staff questions, kept apart from the company's own "Assistant" runs. */
export const staffAssistantAgent = 'Staff assistant';
/** Run-log name for staff questions about the whole park (all members at once). */
export const parkAssistantAgent = 'Park assistant';

/** Public = found by the AI on public pages and not changed or added by the company. */
export const isPublicItem = (item: { confirmed_by_user: boolean }) => !item.confirmed_by_user;

/** A company as this viewer may see it: others get only public profile items and no priorities. */
export function visibleCompany<C extends { id: string; profile_items: { confirmed_by_user: boolean }[] }>(viewer: Viewer, company: C): C & { access: Access } {
  const access = accessTo(viewer, company.id);
  if (access !== 'public') return { ...company, access };
  const out = { ...company, profile_items: company.profile_items.filter(isPublicItem), access } as C & { access: Access };
  if ('company_priorities' in out) (out as { company_priorities: unknown[] }).company_priorities = [];
  return out;
}

/** Run log rows: park-wide runs for everyone; a company's runs like its profile; assistant answers only for the
 * company; staff assistant answers only for staff (the company doesn't see what staff asked about it). */
export function runVisible(viewer: Viewer, run: { agent: string; company_id: string | null }) {
  // Park-wide answers draw on every member's private profile and rankings: staff only, though no company is set.
  if (run.agent === parkAssistantAgent) return viewer.kind === 'staff';
  if (!run.company_id) return true;
  if (run.agent === 'Assistant') return canActAs(viewer, run.company_id);
  if (run.agent === staffAssistantAgent) return viewer.kind === 'staff';
  return canSeeProfile(viewer, run.company_id);
}

export const notAllowedMessage = 'Sign in as this company to do that (top bar).';

/** Park-wide jobs and member admin (nightly run, adding companies, testbeds): Blue Science Park staff only. */
export const isStaff = (viewer: Viewer) => viewer.kind === 'staff';
/** Shared work that spends time or AI but touches no company's private data (refresh sources, boundary tests): any signed-in account, not visitors. */
export const isSignedIn = (viewer: Viewer) => viewer.kind !== 'guest';
export const staffOnlyMessage = 'Only Blue Science Park staff can do that. Sign in as staff.';
export const signInMessage = 'Sign in to do that.';
