import { parseHTML } from 'linkedom';
import ipaddr from 'ipaddr.js';
import type { PageText } from './profile-rules';
export function safeWebsiteUrl(value:string){
 const url=new URL(value);const host=url.hostname.replace(/^\[|\]$/g,'');
 if(!['http:','https:'].includes(url.protocol)||url.username||url.password||(url.port&&!['80','443'].includes(url.port)))throw new Error('Use a public http or https website.');
 if(!host.includes('.')||host.endsWith('.local')||host.endsWith('.localhost')||host.endsWith('.internal')||host==='localhost')throw new Error('Private websites cannot be fetched.');
 if(ipaddr.isValid(host)&&ipaddr.process(host).range()!=='unicast')throw new Error('Private websites cannot be fetched.');
 return url;
}
async function checkDns(host:string){
 if(ipaddr.isValid(host))return;
 const replies=await Promise.all(['A','AAAA'].map(async(type)=>{const response=await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(host)}&type=${type}`,{headers:{accept:'application/dns-json'}});if(!response.ok)throw new Error('Could not validate website address.');return response.json() as Promise<{Answer?:{type:number;data:string}[]}>;}));
 const addresses=replies.flatMap(r=>r.Answer??[]).filter(a=>a.type===1||a.type===28);
 if(!addresses.length||addresses.some(a=>!ipaddr.isValid(a.data)||ipaddr.process(a.data).range()!=='unicast'))throw new Error('Website must resolve to a public address.');
}
export async function readPage(value:string,signal:AbortSignal):Promise<{page:PageText;links:string[]}>{
 let url=safeWebsiteUrl(value);let response:Response|undefined;
 for(let redirects=0;redirects<=4;redirects++){
 await checkDns(url.hostname);response=await fetch(url,{redirect:'manual',signal,headers:{'User-Agent':'VirtualScienceParkPrototype/1.0','Accept':'text/html'}});
 if(response.status>=300&&response.status<400){const location=response.headers.get('location');if(!location)throw new Error('Website redirect has no destination.');url=safeWebsiteUrl(new URL(location,url).href);continue;}break;
 }
 if(!response?.ok)throw new Error(`Website could not be read (${response?.status??'no response'}).`);
 if(!(response.headers.get('content-type')??'').includes('text/html'))throw new Error('The website did not return an HTML page.');
 const reader=response.body?.getReader();if(!reader)throw new Error('Website returned no content.');let bytes=0;const chunks:Uint8Array[]=[];
 while(true){const chunk=await reader.read();if(chunk.done)break;bytes+=chunk.value.length;if(bytes>1500000){await reader.cancel();throw new Error('Website page is too large.');}chunks.push(chunk.value);}
 const html=chunks.map(c=>new TextDecoder().decode(c)).join('');const {document}=parseHTML(html);
 const links=Array.from(document.querySelectorAll('a[href]')).filter(a=>/about|products|services|solutions|news|om oss|produkter|tjänster|nyheter/i.test(`${a.textContent} ${a.getAttribute('href')}`)).flatMap(a=>{try{const linked=new URL(a.getAttribute('href')??'',url);linked.hash='';return linked.origin===url.origin?[linked.href]:[];}catch{return [];}});
 document.querySelectorAll('script,style,noscript,svg,template').forEach(e=>e.remove());
 const text=(document.body?.textContent??document.textContent??'').replace(/\s+/g,' ').trim().slice(0,26000);
 if(!text)throw new Error('No readable text was found on this website.');
 return {page:{url:url.href,text},links:[...new Set(links)].filter(l=>l!==url.href).slice(0,4)};
}
export async function fetchWebsite(value:string,signal:AbortSignal,onProgress:(s:string)=>void){
 onProgress('Reading the company website…');const home=await readPage(value,signal);const pages=[home.page];
 for(const link of home.links){onProgress(`Reading supporting page ${pages.length} of ${home.links.length}…`);try{pages.push((await readPage(link,signal)).page);}catch(error){if(signal.aborted)throw error;}}
 return pages;
}
