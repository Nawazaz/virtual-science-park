import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
export const refreshSourcesFn=createServerFn({method:'POST'}).handler(async()=>{const {refreshSources}=await import('./scouts.server');return refreshSources();});
export const getSources=createServerFn({method:'GET'}).handler(async()=>{const {publicDb}=await import('./db.server');const {data,error}=await publicDb().from('source_checks').select('*').order('source_name');if(error)throw new Error(error.message);return data??[];});
export const getCompanyMatches=createServerFn({method:'GET'}).inputValidator(z.object({id:z.string().uuid()})).handler(async({data})=>{
 const {publicDb}=await import('./db.server');const db=publicDb();
 const [m,f]=await Promise.all([db.from('matches').select('*,opportunity:opportunities(*)').eq('company_id',data.id).order('score',{ascending:false}),db.from('feedback').select('*').eq('company_id',data.id)]);
 if(m.error)throw new Error(m.error.message);if(f.error)throw new Error(f.error.message);return {matches:m.data??[],feedback:f.data??[]};
});
export const setFeedback=createServerFn({method:'POST'}).inputValidator(z.object({company_id:z.string().uuid(),opportunity_id:z.string().uuid(),saved:z.boolean(),vote:z.enum(['up','down']).nullable()})).handler(async({data})=>{const {publicDb}=await import('./db.server');const {error}=await publicDb().from('feedback').upsert(data);if(error)throw new Error(error.message);return {ok:true};});
export const setMemberPage=createServerFn({method:'POST'}).inputValidator(z.object({id:z.string().uuid(),member_page_url:z.string().url().max(2048).nullable()})).handler(async({data})=>{const {publicDb}=await import('./db.server');const {error}=await publicDb().from('companies').update({member_page_url:data.member_page_url}).eq('id',data.id);if(error)throw new Error(error.message);return {ok:true};});
