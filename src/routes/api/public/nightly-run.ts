import { createFileRoute } from '@tanstack/react-router';
// "Run now" from the staff page: same job as the nightly cron, streamed so the browser keeps the request alive.
export const Route=createFileRoute('/api/public/nightly-run')({server:{handlers:{POST:async({request})=>{
 // Staff only: it rebuilds every profile and spends AI time for all members.
 const {currentViewer}=await import('@/lib/access.server');const {isStaff,staffOnlyMessage}=await import('@/lib/access-rules');if(!isStaff(currentViewer()))return Response.json({error:staffOnlyMessage},{status:403});
 const encoder=new TextEncoder();const stream=new ReadableStream({async start(c){const emit=(e:object)=>c.enqueue(encoder.encode(JSON.stringify(e)+'\n'));try{const {runNightly}=await import('@/lib/nightly.server');await runNightly(request,emit);}catch(e){emit({type:'error',message:e instanceof Error?e.message:'Nightly run failed.'});}finally{c.close();}}});
 return new Response(stream,{headers:{'Content-Type':'application/x-ndjson','Cache-Control':'no-cache, no-transform'}});
}}}});
