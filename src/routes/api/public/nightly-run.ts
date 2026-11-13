import { createFileRoute } from '@tanstack/react-router';
// "Run now" from the staff page: same job as the nightly cron, streamed so the browser keeps the request alive.
export const Route=createFileRoute('/api/public/nightly-run')({server:{handlers:{POST:async({request})=>{
 const encoder=new TextEncoder();const stream=new ReadableStream({async start(c){const emit=(e:object)=>c.enqueue(encoder.encode(JSON.stringify(e)+'\n'));try{const {runNightly}=await import('@/lib/nightly.server');await runNightly(request,emit);}catch(e){emit({type:'error',message:e instanceof Error?e.message:'Nightly run failed.'});}finally{c.close();}}});
 return new Response(stream,{headers:{'Content-Type':'application/x-ndjson','Cache-Control':'no-cache, no-transform'}});
}}}});
