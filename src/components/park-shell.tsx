import { Link, useNavigate } from '@tanstack/react-router';
import { Orbit, LayoutDashboard, Users, Target, Columns3, Network, MessagesSquare, ClipboardList, ShieldCheck, BookOpen, Moon, Sun } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useViewingAs } from '@/hooks/use-viewing-as';
const nav=[
 {to:'/',label:'Dashboard',Icon:LayoutDashboard,exact:true},
 {to:'/members',label:'Members',Icon:Users},
 {to:'/opportunities',label:'Opportunities',Icon:Target},
 {to:'/compare',label:'Compare',Icon:Columns3},
 {to:'/connections',label:'Connections',Icon:Network},
 {to:'/assistant',label:'Assistant',Icon:MessagesSquare},
 {to:'/staff',label:'For staff',Icon:ClipboardList},
 {to:'/trust',label:'Trust & quality',Icon:ShieldCheck},
 {to:'/about',label:'How it works',Icon:BookOpen},
] as const;
function ThemeToggle(){const [dark,setDark]=useState(false);useEffect(()=>setDark(document.documentElement.classList.contains('dark')),[]);
 return <button type="button" aria-label={dark?'Switch to light mode':'Switch to dark mode'} className="grid size-9 place-items-center rounded-lg border bg-card hover:border-primary" onClick={()=>{const n=!dark;setDark(n);document.documentElement.classList.toggle('dark',n);try{localStorage.setItem('vsp-theme',n?'dark':'light');}catch{}}}>{dark?<Sun size={16}/>:<Moon size={16}/>}</button>;}
function Switcher(){const {companies,selected}=useViewingAs();const navigate=useNavigate();if(!companies.length)return null;
 return <label className="flex min-w-0 items-center gap-2 text-sm"><span className="hidden text-muted-foreground sm:inline">Viewing as:</span><Select value={selected?.id??""} onValueChange={id=>navigate({to:'.',search:(p:Record<string,unknown>)=>({...p,company:id})})}><SelectTrigger aria-label="Viewing as company" className="h-9 w-44 bg-card sm:w-56"><SelectValue/></SelectTrigger><SelectContent>{companies.map(c=><SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></label>;}
export function ParkShell({children}:{children:ReactNode}){
 return <TooltipProvider delayDuration={200}><div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
  <aside className="sticky top-0 hidden h-screen flex-col bg-sidebar text-sidebar-foreground md:flex">
   <Link to="/" search={true} className="flex items-center gap-3 px-5 py-6"><span className="grid size-10 place-items-center rounded-full bg-sidebar-accent text-sidebar-primary"><Orbit size={22}/></span><span className="font-display text-lg leading-tight">Virtual<br/>Science Park</span></Link>
   <nav aria-label="Main" className="flex flex-1 flex-col gap-0.5 px-3">{nav.map(n=><Link key={n.to} to={n.to} search={true} activeOptions={{exact:'exact' in n}} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" activeProps={{className:'!bg-sidebar-accent !text-sidebar-accent-foreground font-medium'}}><n.Icon size={17} aria-hidden/>{n.label}</Link>)}</nav>
   <p className="px-5 py-5 text-[11px] leading-relaxed text-sidebar-foreground/60">Hackathon prototype for Blue Science Park members.</p>
  </aside>
  <div className="flex min-w-0 flex-col pb-20 md:pb-0">
   <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b bg-background/90 px-4 py-3 backdrop-blur md:px-8"><Link to="/" search={true} className="flex items-center gap-2 font-display text-lg md:hidden"><Orbit size={20} className="text-primary"/>VSP</Link><div className="md:flex-1"/><div className="flex items-center gap-2"><Switcher/><ThemeToggle/></div></header>
   <main className="fade-in mx-auto w-full max-w-[1200px] flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
   <footer className="border-t px-4 py-6 text-xs text-muted-foreground md:px-8"><p>Information and suggestions only. Not eligibility decisions or commitments by Blue Science Park.</p><p className="mt-1">Hackathon prototype. Information is not professional advice or a decision by Blue Science Park.</p></footer>
  </div>
  <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 flex overflow-x-auto border-t bg-card md:hidden">{nav.map(n=><Link key={n.to} to={n.to} search={true} activeOptions={{exact:'exact' in n}} className="flex min-w-[72px] flex-1 flex-col items-center gap-1 px-2 py-2 text-[10px] text-muted-foreground" activeProps={{className:'!text-primary font-semibold'}}><n.Icon size={18} aria-hidden/><span className="whitespace-nowrap">{n.label}</span></Link>)}</nav>
 </div></TooltipProvider>;
}
export function PageHeader({eyebrow,title,children,actions}:{eyebrow?:string;title:ReactNode;children?:ReactNode;actions?:ReactNode}){return <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div className="max-w-2xl">{eyebrow&&<p className="eyebrow mb-2">{eyebrow}</p>}<h1 className="font-display text-3xl md:text-4xl">{title}</h1>{children&&<div className="mt-2 text-muted-foreground">{children}</div>}</div>{actions&&<div className="flex flex-wrap gap-2">{actions}</div>}</div>;}
export function EmptyState({icon,title,children}:{icon?:ReactNode;title:string;children?:ReactNode}){return <div className="rounded-[14px] border border-dashed bg-card/50 p-8 text-center"><div className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-accent text-primary">{icon}</div><h3 className="font-display text-xl">{title}</h3>{children&&<div className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{children}</div>}</div>;}
