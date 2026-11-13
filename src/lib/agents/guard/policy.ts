import type { GuardClass } from '../contracts';

/**
 * Fixed behaviour per Guard class. The AI only picks the class; the code
 * decides what happens next. Owner C: refine the wording.
 */
export type GuardPolicy = {
  /** May the assistant answer with data at all? */
  answer: boolean;
  /** Fixed text shown before (or instead of) any answer. Empty = none. */
  reply: string;
  /** Add a referral to Blue Science Park staff. */
  referToStaff: boolean;
};

export const policy: Record<GuardClass, GuardPolicy> = {
  in_scope: { answer: true, reply: '', referToStaff: false },
  unclear: {
    answer: false,
    reply:
      'I help with innovation, funding, events, testing and partners in the Blue Science Park network. Which of these is your question about?',
    referToStaff: false,
  },
  out_of_scope: {
    answer: false,
    reply:
      'That is outside what I can help with. I can find funding, events, testing environments and partners for your company. For example: "Which funding calls fit our profile?"',
    referToStaff: false,
  },
  override_attempt: {
    answer: false,
    reply: 'I cannot change my role or rules. I can still help you find opportunities for your company.',
    referToStaff: false,
  },
  other_company_private: {
    answer: false,
    reply: 'I cannot share another company\'s private profile or activity. I can only show public facts about other members.',
    referToStaff: false,
  },
  needs_human: {
    answer: true,
    reply:
      'This is information only, not an eligibility decision or a commitment from Blue Science Park.',
    referToStaff: true,
  },
};

export function decide(cls: GuardClass): GuardPolicy {
  return policy[cls];
}
