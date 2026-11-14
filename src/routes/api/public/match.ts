import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
export const Route=createFileRoute('/api/public/match')({server:{handlers:{POST:async({request})=>{
 const parsed=z.object({company_id:z.string().uuid()}).safeParse(await request.json().catch(()=>null));if(!parsed.success)return Response.json({error:'Invalid company.'},{status:400});
 // Only the company itself or park staff may start AI work for a company.
 const {currentViewer}=await import('@/lib/access.server');const {canSeeProfile,notAllowedMessage}=await import('@/lib/access-rules');if(!canSeeProfile(currentViewer(),parsed.data.company_id))return Response.json({error:notAllowedMessage},{status:403});
 const encoder=new TextEncoder();const stream=new ReadableStream({async start(c){const emit=(e:object)=>c.enqueue(encoder.encode(JSON.stringify(e)+'\n'));try{const {runMatcher}=await import('@/lib/matcher.server');await runMatcher(parsed.data.company_id,request,emit);}catch(error){emit({type:'error',message:error instanceof Error?error.message:'Matching failed.'});}finally{c.close();}}});
 return new Response(stream,{headers:{'Content-Type':'application/x-ndjson','Cache-Control':'no-cache, no-transform'}});
}}}});
