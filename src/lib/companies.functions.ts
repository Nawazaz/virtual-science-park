import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { companySchema, itemSchema, priorities } from './profile-rules';
export const listCompanies=createServerFn({method:'GET'}).handler(async()=>{
 const {publicDb}=await import('./db.server');const db=publicDb();
 const {data,error}=await db.from('companies').select('id,name,website_url,created_at,profile_items(id,field,value,kind,confirmed_by_user),company_priorities(priority)').order('created_at',{ascending:false});if(error)throw new Error(error.message);return data??[];
});
export const getCompany=createServerFn({method:'GET'}).inputValidator(z.object({id:z.string().uuid()})).handler(async({data})=>{
 const {publicDb}=await import('./db.server');const db=publicDb(); const {data:company,error}=await db.from('companies').select('id,name,website_url,member_page_url,created_at,profile_items(*),company_priorities(priority)').eq('id',data.id).maybeSingle();if(error)throw new Error(error.message);return company;
});
export const addCompany=createServerFn({method:'POST'}).inputValidator(companySchema).handler(async({data})=>{
 const {publicDb}=await import('./db.server');const {data:row,error}=await publicDb().from('companies').insert({name:data.name,website_url:data.website_url,member_page_url:data.member_page_url??null}).select().single();if(error)throw new Error(error.message);return row;
});
export const saveItem=createServerFn({method:'POST'}).inputValidator(itemSchema).handler(async({data})=>{
 const {publicDb}=await import('./db.server');const db=publicDb();const value={field:data.field,value:data.value,confirmed_by_user:true,kind:'fact' as const};
 const result=data.id?await db.from('profile_items').update(value).eq('id',data.id).eq('company_id',data.company_id):await db.from('profile_items').insert({...value,company_id:data.company_id});if(result.error)throw new Error(result.error.message);return {ok:true};
});
export const deleteItem=createServerFn({method:'POST'}).inputValidator(z.object({id:z.string().uuid(),company_id:z.string().uuid()})).handler(async({data})=>{
 const {publicDb}=await import('./db.server');const {error}=await publicDb().from('profile_items').delete().eq('id',data.id).eq('company_id',data.company_id);if(error)throw new Error(error.message);return {ok:true};
});
export const setPriority=createServerFn({method:'POST'}).inputValidator(z.object({company_id:z.string().uuid(),priority:z.enum(priorities),enabled:z.boolean()})).handler(async({data})=>{
 const {publicDb}=await import('./db.server');const db=publicDb();const result=data.enabled?await db.from('company_priorities').upsert({company_id:data.company_id,priority:data.priority}):await db.from('company_priorities').delete().eq('company_id',data.company_id).eq('priority',data.priority);if(result.error)throw new Error(result.error.message);return {ok:true};
});
