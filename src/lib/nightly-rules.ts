/** Hour (0-23) in Europe/Stockholm for a given instant. Used to fire the nightly job at 03:00 local time across DST. */
export function stockholmHour(d:Date){return Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Stockholm',hour:'2-digit',hourCycle:'h23'}).format(d));}
export type NightlySummary={companies:number;changes:number;newOpportunities:number;failures:{step:string;company?:string;message:string}[]};
export function nightlyLine(s:NightlySummary){return `${s.companies} companies · ${s.changes} changes · ${s.failures.length} failures`;}
