import { useQuery } from '@tanstack/react-query';
import { useSearch } from '@tanstack/react-router';
import { companiesQuery } from '@/lib/company-queries';
/** The company selected in the top bar, stored in ?company=. Falls back to the first member. */
export function useViewingAs(){
 const search=useSearch({strict:false}) as {company?:string};
 const {data:companies=[]}=useQuery(companiesQuery);
 const sorted=[...companies].sort((a,b)=>a.name.localeCompare(b.name));
 const selected=sorted.find(c=>c.id===search.company)??[...sorted].sort((a,b)=>b.profile_items.filter(i=>i.kind!=='missing').length-a.profile_items.filter(i=>i.kind!=='missing').length)[0]??null;
 return {companies:sorted,selected,companyId:selected?.id??null};
}
