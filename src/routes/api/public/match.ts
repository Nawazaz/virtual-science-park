import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
export const Route=createFileRoute('/api/public/match')({server:{handlers:{POST:async({request})=>{
 const parsed=z.object({company_id:z.string().uuid()}).safeParse(await request.json().catch(()=>null));if(!parsed.success)return Response.json({error:'Invalid company.'},{status:400});
 const encoder=new TextEncoder();const stream=new ReadableStream({async start(c){const emit=(e:object)=>c.enqueue(encoder.encode(JSON.stringify(e)+'\n'));try{const {runMatcher}=await import('@/lib/matcher.server');await runMatcher(parsed.data.company_id,request,emit);}catch(error){emit({type:'error',message:error instanceof Error?error.message:'Matching failed.'});}finally{c.close();}}});
 return new Response(stream,{headers:{'Content-Type':'application/x-ndjson','Cache-Control':'no-cache, no-transform'}});
}}}});
