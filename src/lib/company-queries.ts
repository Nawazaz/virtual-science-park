import { queryOptions } from '@tanstack/react-query';
import { listCompanies,getCompany } from './companies.functions';
export const companiesQuery=queryOptions({queryKey:['companies'],queryFn:()=>listCompanies()});
export const companyQuery=(id:string)=>queryOptions({queryKey:['company',id],queryFn:()=>getCompany({data:{id}})});
import { getCompanyMatches,getSources } from './opportunities.functions';
export const matchesQuery=(id:string)=>queryOptions({queryKey:['matches',id],queryFn:()=>getCompanyMatches({data:{id}})});
export const sourcesQuery=queryOptions({queryKey:['sources'],queryFn:()=>getSources()});
