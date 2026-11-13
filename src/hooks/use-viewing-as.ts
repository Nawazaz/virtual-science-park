import { useQuery } from '@tanstack/react-query';
import { useSearch } from '@tanstack/react-router';
import { companiesQuery, viewerQuery } from '@/lib/company-queries';
import { accessTo, guestViewer, type Access, type Viewer } from '@/lib/access-rules';
/**
 * The company the pages show: the signed-in company, otherwise ?company= (staff and visitors pick it), otherwise the fullest profile.
 * `access` says what the (simulated) signed-in viewer may see of that company; the server enforces the same rule.
 */
export function useViewingAs(){
 const search=useSearch({strict:false}) as {company?:string};
 const {data:companies=[]}=useQuery(companiesQuery);
 const {data:viewer=guestViewer}=useQuery(viewerQuery);
 const sorted=[...companies].sort((a,b)=>a.name.localeCompare(b.name));
 const own=viewer.kind==='company'?sorted.find(c=>c.id===viewer.companyId):undefined;
 const selected=own??sorted.find(c=>c.id===search.company)??[...sorted].sort((a,b)=>b.profile_items.filter(i=>i.kind!=='missing').length-a.profile_items.filter(i=>i.kind!=='missing').length)[0]??null;
 const access:Access=selected?accessTo(viewer,selected.id):'public';
 return {companies:sorted,selected,companyId:selected?.id??null,viewer:viewer as Viewer,access,isOwner:access==='owner',canSeePrivate:access!=='public'};
}
