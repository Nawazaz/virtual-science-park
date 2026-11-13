/**
 * Companies the app hides. "Example Company" is a placeholder from early testing: the shared database
 * does not let the app delete companies (no delete rule for the publishable key), so it is hidden
 * here instead: from lists, sign-in, connections, the staff page, the run log and the nightly job.
 * If the row is deleted in the database later, this rule simply has nothing left to hide.
 */
export const hiddenCompanyNames: readonly string[] = ['Example Company'];

export const isListed = (company: { name: string } | null | undefined) => !!company && !hiddenCompanyNames.includes(company.name);
