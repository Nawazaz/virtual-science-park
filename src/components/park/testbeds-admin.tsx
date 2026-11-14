import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { listTestbeds, saveTestbed, setTestbedActive } from '@/lib/testbeds.functions';
import { refreshSourcesFn } from '@/lib/opportunities.functions';
import { SourceChip, fmtDate } from './evidence';
type Form={id?:string;name:string;organisation:string;description:string;what_you_can_test:string;how_to_start:string;location:string;url:string;added_by:string;active:boolean};
const empty:Form={name:'',organisation:'',description:'',what_you_can_test:'',how_to_start:'',location:'',url:'',added_by:'',active:true};
const fields:[keyof Form,string,boolean][]=[['name','Name',false],['organisation','Organisation',false],['url','Website (required)',false],['location','Location',false],['description','Description',true],['what_you_can_test','What you can test',true],['how_to_start','How to start',true],['added_by','Added by',false]];
export function TestbedsAdmin(){
 const {data:rows=[]}=useQuery({queryKey:['testbeds'],queryFn:()=>listTestbeds()});const qc=useQueryClient();
 const save=useServerFn(saveTestbed);const toggle=useServerFn(setTestbedActive);const refresh=useServerFn(refreshSourcesFn);
 const [f,setF]=useState<Form>(empty);const [busy,setBusy]=useState(false);
 // The form opens only when adding or editing, so the list isn't pushed down by eight empty fields.
 const [open,setOpen]=useState(false);const edit=(next:Form)=>{setF(next);setOpen(true);};const close=()=>{setF(empty);setOpen(false);};
 const after=async()=>{await refresh();await qc.invalidateQueries();};
 const submit=async(e:React.FormEvent)=>{e.preventDefault();if(!/^https?:\/\/\S+\.\S+/i.test(f.url.trim())){toast.error('A website starting with http:// or https:// is required.');return;}setBusy(true);try{await save({data:f});toast.success('Testbed saved and verified today');close();await after();}catch(err){toast.error(err instanceof Error?err.message:'Save failed');}finally{setBusy(false);}};
 const flip=async(id:string,active:boolean)=>{setBusy(true);try{await toggle({data:{id,active}});await after();}catch(err){toast.error(err instanceof Error?err.message:'Update failed');}finally{setBusy(false);}};
 return <div className="space-y-4">
  <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm text-muted-foreground">Active testbeds appear to members as Testing opportunities.</p>{!open&&<Button size="sm" onClick={()=>edit(empty)}>Add testbed</Button>}</div>
  {open&&<form onSubmit={submit} className="surface grid gap-3 p-4 md:grid-cols-2 animate-in fade-in slide-in-from-top-1 duration-200"><p className="font-medium md:col-span-2">{f.id?'Edit testbed':'Add a testbed'}</p>
   {fields.map(([k,l,long])=><div key={k} className="space-y-1"><Label htmlFor={`tb-${k}`}>{l}</Label>{long?<Textarea id={`tb-${k}`} rows={2} value={f[k] as string} onChange={e=>setF({...f,[k]:e.target.value})}/>:<Input id={`tb-${k}`} type={k==='url'?'url':'text'} required={k==='name'||k==='url'} value={f[k] as string} onChange={e=>setF({...f,[k]:e.target.value})}/>}</div>)}
   <div className="flex items-center gap-2 md:col-span-2"><Button type="submit" disabled={busy}>{f.id?'Save changes':'Add testbed'}</Button><Button type="button" variant="outline" onClick={close}>Cancel</Button><span className="text-xs text-muted-foreground">Saving sets “verified on” to today.</span></div></form>}
  <div>{rows.length===0?<p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">No testbeds yet. Until one is added, Testing shows labelled simulated samples.</p>:<ul className="grid gap-2 md:grid-cols-2">{rows.map(r=><li key={r.id} className={`surface p-3 text-sm ${r.active?'':'opacity-60'}`}>
   <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-medium">{r.name}{!r.active&&' (inactive)'}</span><span className="flex gap-2"><Button size="sm" variant="outline" disabled={busy} onClick={()=>edit({id:r.id,name:r.name,organisation:r.organisation,description:r.description,what_you_can_test:r.what_you_can_test,how_to_start:r.how_to_start,location:r.location,url:r.url,added_by:r.added_by,active:r.active})}>Edit</Button><Button size="sm" variant="outline" disabled={busy} onClick={()=>flip(r.id,!r.active)}>{r.active?'Deactivate':'Activate'}</Button></span></div>
   <p className="mt-1 text-xs text-muted-foreground">{[r.organisation,r.location].filter(Boolean).join(' · ')} · Verified {fmtDate(r.verified_on)}{r.added_by&&` by ${r.added_by}`}</p><div className="mt-1"><SourceChip url={r.url}/></div></li>)}</ul>}</div>
 </div>;
}
