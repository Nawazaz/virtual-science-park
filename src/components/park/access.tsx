import { useQueryClient } from '@tanstack/react-query';
import { useNavigate, useRouter } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { Lock } from 'lucide-react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { signInAs } from '@/lib/access.functions';

/** Simulated sign-in: sets the server session, then resets every query (refetching the ones on screen) so nothing cached from the old viewer stays. */
export function useSignIn(){
 const run=useServerFn(signInAs);const qc=useQueryClient();const router=useRouter();const navigate=useNavigate();
 return async(as:string)=>{try{const v=await run({data:{as}});if(v.kind==='company')await navigate({to:'.',search:(p:Record<string,unknown>)=>({...p,company:v.companyId})});await router.invalidate();await qc.resetQueries();}catch(e){toast.error(e instanceof Error?e.message:'Could not sign in');}};
}

/** Shown where a page would show another company's private data. */
export function PrivateNotice({companyId,name,children,staff=true}:{companyId:string;name:string;children:ReactNode;staff?:boolean}){
 const signIn=useSignIn();
 return <div className="rounded-[14px] border border-dashed bg-card/50 p-5 text-sm" role="note">
  <p className="flex items-center gap-2 font-medium"><Lock size={15} aria-hidden/>Private to {name}</p>
  <p className="mt-1 text-muted-foreground">{children}</p>
  <div className="mt-3 flex flex-wrap gap-2"><Button size="sm" onClick={()=>signIn(companyId)}>Sign in as {name}</Button>{staff&&<Button size="sm" variant="outline" onClick={()=>signIn('staff')}>Sign in as park staff</Button>}</div>
  <p className="mt-2 text-[11px] text-muted-foreground">Sign-in is simulated in this prototype. The server still checks it on every request.</p>
 </div>;
}
