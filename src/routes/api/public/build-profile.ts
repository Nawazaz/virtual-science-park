import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
export const Route=createFileRoute('/api/public/build-profile')({server:{handlers:{POST:async({request})=>{
 const parsed=z.object({company_id:z.string().uuid()}).safeParse(await request.json().catch(()=>null));if(!parsed.success)return Response.json({error:'Invalid company.'},{status:400});
 const encoder=new TextEncoder();const stream=new ReadableStream({async start(controller){const emit=(event:object)=>controller.enqueue(encoder.encode(JSON.stringify(event)+'\n'));try{const {buildProfile}=await import('@/lib/build-profile.server');await buildProfile(parsed.data.company_id,request,emit);}catch(error){emit({type:'error',message:error instanceof Error?error.message:'Profile generation failed.'});}finally{controller.close();}}});
 return new Response(stream,{headers:{'Content-Type':'application/x-ndjson','Cache-Control':'no-cache, no-transform'}});
}}}});
