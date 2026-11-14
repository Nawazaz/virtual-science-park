import { Link, useNavigate } from '@tanstack/react-router';
import { LayoutDashboard, Users, Target, Columns3, Network, MessagesSquare, ClipboardList, ShieldCheck, Moon, Sun, ChevronDown, LogOut, Repeat } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useViewingAs } from '@/hooks/use-viewing-as';
import { SignInButton, useSignOut } from '@/components/park/access';
import { BrandLockup, BspMark } from '@/components/park/brand';
import { emailFor, initials, staffEmail, staffName } from '@/lib/demo-accounts';
const nav=[
 {to:'/',label:'Dashboard',Icon:LayoutDashboard,exact:true},
 {to:'/members',label:'Members',Icon:Users},
 {to:'/opportunities',label:'Opportunities',Icon:Target},
 {to:'/compare',label:'Compare',Icon:Columns3},
 {to:'/connections',label:'Connections',Icon:Network},
 {to:'/assistant',label:'Assistant',Icon:MessagesSquare},
 {to:'/staff',label:'For staff',Icon:ClipboardList,staffOnly:true},
 {to:'/trust',label:'Trust & quality',Icon:ShieldCheck},
] as const;
/** Tabs for the signed-in viewer: "For staff" only for park staff. Decided after mount so server and browser render the same first. */
function useNavLinks(){const {viewer}=useViewingAs();const [mounted,setMounted]=useState(false);useEffect(()=>setMounted(true),[]);
 return nav.filter(n=>!('staffOnly' in n)||(mounted&&viewer.kind==='staff'));}
function ThemeToggle(){const [dark,setDark]=useState(false);useEffect(()=>setDark(document.documentElement.classList.contains('dark')),[]);
 return <button type="button" aria-label={dark?'Switch to light mode':'Switch to dark mode'} className="grid size-9 place-items-center rounded-lg border bg-card hover:border-primary" onClick={()=>{const n=!dark;setDark(n);document.documentElement.classList.toggle('dark',n);try{localStorage.setItem('vsp-theme',n?'dark':'light');}catch{}}}>{dark?<Sun size={16}/>:<Moon size={16}/>}</button>;}
// Visitors get a "Sign in" button; a signed-in account gets a menu with Sign out. The server checks the session on every request.
// Staff and visitors also pick which company to look at; a signed-in company always looks at itself.
// Rendered only after mount: the server has no company list yet, so rendering it there made the page's first paint differ (hydration warning).
function Switcher(){const {companies,selected,viewer}=useViewingAs();const navigate=useNavigate();const signOutNow=useSignOut();const [mounted,setMounted]=useState(false);useEffect(()=>setMounted(true),[]);if(!mounted||!companies.length)return null;
 const name=viewer.kind==='staff'?staffName:viewer.kind==='company'?companies.find(c=>c.id===viewer.companyId)?.name??'Your company':null;
 return <div className="flex min-w-0 flex-wrap items-center justify-end gap-2 text-sm">
  {viewer.kind!=='company'&&<label className="flex min-w-0 items-center gap-2"><span className="hidden text-muted-foreground sm:inline">Viewing:</span><Select value={selected?.id??""} onValueChange={id=>navigate({to:'.',search:(p:Record<string,unknown>)=>({...p,company:id})})}><SelectTrigger aria-label="Viewing company" className="h-9 w-36 bg-card sm:w-48"><SelectValue/></SelectTrigger><SelectContent>{companies.map(c=><SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></label>}
  {name?<DropdownMenu><DropdownMenuTrigger className="flex h-9 items-center gap-2 rounded-full border bg-card py-1 pl-1 pr-3 hover:border-primary" aria-label={`Account: ${name}`}><span aria-hidden className="grid size-7 place-items-center rounded-full bg-accent text-[11px] font-semibold text-primary">{initials(name)}</span><span className="hidden max-w-36 truncate font-medium sm:inline">{name}</span><ChevronDown size={14} aria-hidden className="text-muted-foreground"/></DropdownMenuTrigger>
   <DropdownMenuContent align="end" className="w-64">
    <DropdownMenuLabel className="font-normal"><p className="truncate font-medium">{name}</p><p className="truncate text-xs text-muted-foreground">{viewer.kind==='staff'?staffEmail:emailFor(name)}</p><p className="mt-1 text-xs text-muted-foreground">{viewer.kind==='staff'?'Park staff: sees every profile and ranking':'Member company: sees and edits its own data'}</p></DropdownMenuLabel>
    <DropdownMenuSeparator/>
    <DropdownMenuItem asChild><Link to="/sign-in" search={{}}><Repeat size={15} aria-hidden/>Switch account</Link></DropdownMenuItem>
    <DropdownMenuItem onSelect={signOutNow}><LogOut size={15} aria-hidden/>Sign out</DropdownMenuItem>
    <DropdownMenuSeparator/>
    <p className="px-2 py-1.5 text-[11px] text-muted-foreground">Demo account for the hackathon prototype.</p>
   </DropdownMenuContent></DropdownMenu>
  :<SignInButton/>}
 </div>;}
export function ParkShell({children}:{children:ReactNode}){const links=useNavLinks();
 return <TooltipProvider delayDuration={200}><div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
  <aside className="sticky top-0 hidden h-screen flex-col bg-sidebar text-sidebar-foreground md:flex">
   <Link to="/" search={true} aria-label="Virtual Science Park home, a Blue Science Park service" className="block px-5 pb-5 pt-6"><BrandLockup tone="sidebar"/></Link>
   <div className="mx-5 mb-3 border-t border-sidebar-border"/>
   <nav aria-label="Main" className="flex flex-1 flex-col gap-0.5 px-3">{links.map(n=><Link key={n.to} to={n.to} search={true} activeOptions={{exact:'exact' in n}} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" activeProps={{className:'!bg-sidebar-accent !text-sidebar-accent-foreground font-medium'}}><n.Icon size={17} aria-hidden/>{n.label}</Link>)}</nav>
   <p className="px-5 py-5 text-[11px] leading-relaxed text-sidebar-foreground/60">A Blue Science Park service for member companies and park staff. Hackathon prototype.</p>
  </aside>
  <div className="flex min-w-0 flex-col pb-20 md:pb-0">
   <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b bg-background/90 px-4 py-3 backdrop-blur md:px-8"><Link to="/" search={true} aria-label="Virtual Science Park home, a Blue Science Park service" className="flex items-center gap-2 md:hidden"><BspMark className="size-7"/><span className="hidden whitespace-nowrap text-[13px] font-normal tracking-[0.04em] text-foreground/75 min-[430px]:inline">Virtual Science Park</span></Link><div className="md:flex-1"/><div className="flex items-center gap-2"><Switcher/><ThemeToggle/></div></header>
   <main className="fade-in mx-auto w-full max-w-[1200px] flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
   <footer className="border-t px-4 py-6 text-xs text-muted-foreground md:px-8"><p>Information and suggestions only. Not eligibility decisions or commitments by Blue Science Park.</p><p className="mt-1">Virtual Science Park is a Blue Science Park service for member companies and park staff. Hackathon prototype; information is not professional advice or a decision by Blue Science Park.</p></footer>
  </div>
  <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 flex overflow-x-auto border-t bg-card md:hidden">{links.map(n=><Link key={n.to} to={n.to} search={true} activeOptions={{exact:'exact' in n}} className="flex min-w-[72px] flex-1 flex-col items-center gap-1 px-2 py-2 text-[10px] text-muted-foreground" activeProps={{className:'!text-primary font-semibold'}}><n.Icon size={18} aria-hidden/><span className="whitespace-nowrap">{n.label}</span></Link>)}</nav>
 </div></TooltipProvider>;
}
export function PageHeader({eyebrow,title,children,actions}:{eyebrow?:string;title:ReactNode;children?:ReactNode;actions?:ReactNode}){return <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div className="max-w-2xl">{eyebrow&&<p className="eyebrow mb-2">{eyebrow}</p>}<h1 className="font-display text-3xl md:text-4xl">{title}</h1>{children&&<div className="mt-2 text-muted-foreground">{children}</div>}</div>{actions&&<div className="flex flex-wrap gap-2">{actions}</div>}</div>;}
export function EmptyState({icon,title,children}:{icon?:ReactNode;title:string;children?:ReactNode}){return <div className="rounded-[14px] border border-dashed bg-card/50 p-8 text-center"><div className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-accent text-primary">{icon}</div><h3 className="font-display text-xl">{title}</h3>{children&&<div className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{children}</div>}</div>;}
