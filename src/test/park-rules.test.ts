import { describe, expect, it } from 'vitest';
import { decideReply, keyDate, boundaryTests, completeness, connectionBasis, parseMemberUrls } from '@/lib/park-rules';
import { scoreBreakdown } from '@/lib/opportunity-rules';
describe('park rules',()=>{
 it('override attempts get the fixed refusal and no AI answer',()=>{const r=decideReply('override_attempt');expect(r.answer).toBe(false);expect(r.fixedText).toBe('I cannot change my role or rules. I can still help you find opportunities for your company.');});
 it('needs_human answers with disclaimer and contact card',()=>{const r=decideReply('needs_human');expect(r.answer).toBe(true);expect(r.contactCard).toBe(true);expect(r.disclaimer).toContain('not an eligibility decision');});
 it('has exactly 12 boundary tests',()=>{expect(boundaryTests).toHaveLength(12);});
 it('key date takes the deadline',()=>{expect(keyDate('Opens 2026-12-01, Deadline 2027-01-12')).toBe('2027-01-12');});
 it('completeness counts non-missing fields out of eight',()=>{expect(completeness([{field:'technologies',value:'x',kind:'fact',confirmed_by_user:false},{field:'geography',value:'x',kind:'missing',confirmed_by_user:false}])).toBe(13);});
 it('connections ignore missing items',()=>{const a=[{field:'technologies',value:'Underwater acoustics',kind:'missing',confirmed_by_user:false}];const b=[{field:'technologies',value:'Underwater acoustics',kind:'fact',confirmed_by_user:false}];expect(connectionBasis(a,b)).toEqual([]);expect(connectionBasis(b,b)).toContain('acoustics');});
 it('parses member page urls into names',()=>{const r=parseMemberUrls('https://www.bluesciencepark.se/medlem/njord-x/\nnot a url\nhttps://www.bluesciencepark.se/medlem/kingspan-baga/');expect(r.map(x=>x.name)).toEqual(['Njord X','Kingspan Baga']);});
 it('testing priority boosts testing opportunities by 15',()=>{const base={aiScore:50,matchedItems:[],opportunity:{id:'1',type:'testing',title:'Lab'},downVoted:[]};expect(scoreBreakdown({...base,priorities:['testing']}).total-scoreBreakdown({...base,priorities:[]}).total).toBe(15);});
});
