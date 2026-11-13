import { createOpenAI } from '@ai-sdk/openai';
import { createLovableAiGatewayRunIdFetch } from './run-id.ts';
export type GatewayFailure={status:number;message:string};
/** Per-request Responses provider that records the gateway's safe failure message. */
export function gatewayProvider(runId?:string){
 const key=process.env['LOVABLE_API_KEY'];if(!key)throw new Error('AI is not configured.');
 const run=createLovableAiGatewayRunIdFetch(runId);const state:{failure?:GatewayFailure}={};
 const provider=createOpenAI({baseURL:'https://ai.gateway.lovable.dev/v1',apiKey:key,headers:{'Lovable-API-Key':key,'X-Lovable-AIG-SDK':'vercel-ai-sdk'},fetch:async(i,init)=>{const r=await run.fetch(i,init);if(!r.ok){const b=await r.clone().json().catch(()=>null);state.failure={status:r.status,message:b?.message??b?.error?.message??`AI request failed (${r.status}).`};}return r;}});
 return {provider,state,runId:run.getRunId};
}
export const reasoningOptions={openai:{forceReasoning:true,reasoningEffort:'low' as const,reasoningSummary:'auto' as const,store:false,include:['reasoning.encrypted_content']}};
