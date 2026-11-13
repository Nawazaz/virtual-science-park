async function streamJob(url:string,company_id:string,onProgress:(message:string)=>void,signal?:AbortSignal){
 const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({company_id}),signal:signal??null});
 if(!response.ok)throw new Error((await response.json()).error??'Request failed.');const reader=response.body?.getReader();if(!reader)throw new Error('No response from server.');
 const decoder=new TextDecoder();let buffer='';let done=false;
 while(true){const chunk=await reader.read();if(chunk.done)break;buffer+=decoder.decode(chunk.value,{stream:true});const lines=buffer.split('\n');buffer=lines.pop()??'';for(const line of lines){if(!line)continue;const event=JSON.parse(line);if(event.type==='error')throw new Error(event.message);if(event.type==='progress')onProgress(event.message);if(event.type==='done')done=true;}}
 if(!done)throw new Error('The job ended before saving. Please try again.');
}
export const buildProfileClient=(id:string,p:(m:string)=>void,s:AbortSignal)=>streamJob('/api/public/build-profile',id,p,s);
export const runMatchClient=(id:string,p:(m:string)=>void=()=>{},s?:AbortSignal)=>streamJob('/api/public/match',id,p,s);
export const runNightlyClient=(p:(m:string)=>void=()=>{})=>streamJob('/api/public/nightly-run','',p);
