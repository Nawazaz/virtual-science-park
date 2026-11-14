import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { canActAs, canSeeProfile } from './access-rules';
export const refreshSourcesFn=createServerFn({method:'POST'}).handler(async()=>{const {requireSignedIn}=await import('./access.server');requireSignedIn();const {refreshSources}=await import('./scouts.server');return refreshSources();});
export const getSources=createServerFn({method:'GET'}).handler(async()=>{const {publicDb}=await import('./db.server');const {data,error}=await publicDb().from('source_checks').select('*').order('source_name');if(error)throw new Error(error.message);return data??[];});
// Rankings: the company and park staff. Saved items and votes: the company only.
export const getCompanyMatches=createServerFn({method:'GET'}).inputValidator(z.object({id:z.string().uuid()})).handler(async({data})=>{
 const {currentViewer}=await import('./access.server');const v=currentViewer();const seeMatches=canSeeProfile(v,data.id),seeFeedback=canActAs(v,data.id);
 const {publicDb}=await import('./db.server');const db=publicDb();
 const [m,f]=await Promise.all([db.from('matches').select('*,opportunity:opportunities(*)').eq('company_id',data.id).order('score',{ascending:false}),db.from('feedback').select('*').eq('company_id',data.id)]);
 if(m.error)throw new Error(m.error.message);if(f.error)throw new Error(f.error.message);return {matches:seeMatches?m.data??[]:[],feedback:seeFeedback?f.data??[]:[],locked:!seeMatches};
});
export const setFeedback=createServerFn({method:'POST'}).inputValidator(z.object({company_id:z.string().uuid(),opportunity_id:z.string().uuid(),saved:z.boolean(),vote:z.enum(['up','down']).nullable()})).handler(async({data})=>{const {requireOwner}=await import('./access.server');requireOwner(data.company_id);const {publicDb}=await import('./db.server');const {error}=await publicDb().from('feedback').upsert(data);if(error)throw new Error(error.message);return {ok:true};});
export const setMemberPage=createServerFn({method:'POST'}).inputValidator(z.object({id:z.string().uuid(),member_page_url:z.string().url().max(2048).nullable()})).handler(async({data})=>{const {requireProfileAccess}=await import('./access.server');requireProfileAccess(data.id);const {publicDb}=await import('./db.server');const {error}=await publicDb().from('companies').update({member_page_url:data.member_page_url}).eq('id',data.id);if(error)throw new Error(error.message);return {ok:true};});
/** Re-rank after a vote or priority change using stored AI scores (no AI call). needsAi: run the full Matcher instead. */
export const rescoreFn=createServerFn({method:'POST'}).inputValidator(z.object({company_id:z.string().uuid()})).handler(async({data})=>{const {requireOwner}=await import('./access.server');requireOwner(data.company_id);const {rescoreMatches}=await import('./rescore.server');return rescoreMatches(data.company_id);});
