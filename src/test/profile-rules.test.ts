import {describe,it,expect} from 'vitest';
import {validateEvidence,mergeConfirmed,confirmedItemUpdate,type GeneratedItem} from '@/lib/profile-rules';
import {safeWebsiteUrl} from '@/lib/website.server';
const fact:GeneratedItem={field:'technologies',value:'Uses sensors',kind:'fact',evidence_quote:'We use sensors',source_url:'https://example.com/'};
describe('Profile evidence rules',()=>{
 it('retains facts with exact quotes in their source',()=>expect(validateEvidence([fact],[{url:'https://example.com/',text:'We use sensors for testing.'}])[0]?.kind).toBe('fact'));
 it('downgrades a quote not found in its source',()=>expect(validateEvidence([fact],[{url:'https://example.com/',text:'We develop software.'}])[0]?.kind).toBe('inferred'));
 it('downgrades quotes longer than 25 words',()=>{const quote=Array(26).fill('word').join(' ');expect(validateEvidence([{...fact,evidence_quote:quote}],[{url:'https://example.com/',text:quote}])[0]?.kind).toBe('inferred');});
 it('always labels possible interests inferred',()=>expect(validateEvidence([{...fact,field:'possible_interests'}],[{url:'https://example.com/',text:'We use sensors'}])[0]?.kind).toBe('inferred'));
 it('returns missing for absent fields',()=>expect(validateEvidence([],[]).find(i=>i.field==='geography')?.kind).toBe('missing'));
 it('preserves confirmed fields on rebuild',()=>expect(mergeConfirmed([fact],[{field:'technologies',confirmed_by_user:true}])).toEqual([]));
 it('editing the text drops the old quote and link',()=>expect(confirmedItemUpdate('application_areas','Offshore wind',{value:'Shipping'})).toMatchObject({value:'Offshore wind',confirmed_by_user:true,evidence_quote:null,source_url:null}));
 it('confirming without changes keeps the quote and link',()=>expect(confirmedItemUpdate('application_areas','Shipping',{value:'Shipping '})).not.toHaveProperty('evidence_quote'));
 it('a new item added by the company has no quote or link',()=>expect(confirmedItemUpdate('technologies','Sonar',null)).toMatchObject({evidence_quote:null,source_url:null}));
 it('does not protect unconfirmed generated items',()=>expect(mergeConfirmed([fact],[{field:'technologies',confirmed_by_user:false}])).toEqual([fact]));
 it.each(['http://127.0.0.1','http://192.168.1.1','http://169.254.169.254','http://localhost','http://[::1]'])('blocks private fetch %s',url=>expect(()=>safeWebsiteUrl(url)).toThrow());
});
