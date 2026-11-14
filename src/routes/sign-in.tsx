import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link, useNavigate, useRouter } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { ArrowRight, ChevronDown, Eye, EyeOff, Loader2 } from 'lucide-react';
import { BrandLockup, BspLogo } from '@/components/park/brand';
import { EcosystemOrbit, RotatingLine } from '@/components/park/ecosystem-orbit';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRef, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { safeRedirect, useRefreshSession, useSignOut } from '@/components/park/access';
import { continueAsVisitor, getDemoAccounts, signIn } from '@/lib/access.functions';
import { companiesQuery, viewerQuery } from '@/lib/company-queries';
import { guestViewer } from '@/lib/access-rules';
import { initials, staffName } from '@/lib/demo-accounts';

export const Route = createFileRoute('/sign-in')({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } =>
    typeof search['redirect'] === 'string' ? { redirect: search['redirect'] } : {},
  head: () => ({
    meta: [
      { title: 'Sign in | Virtual Science Park' },
      { name: 'description', content: 'Sign in to your company account on the Virtual Science Park.' },
    ],
  }),
  component: SignInPage,
});

const productLines = [
  'Find funding that fits your company.',
  'Meet members who share your field.',
  'Test ideas in real environments.',
  'Ask questions, get answers with sources.',
];

const Avatar = ({ name, className = '' }: { name: string; className?: string }) => (
  <span aria-hidden className={`grid size-9 shrink-0 place-items-center rounded-full bg-accent text-xs font-semibold text-primary ${className}`}>{initials(name)}</span>
);

function SignInPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const router = useRouter();
  const run = useServerFn(signIn);
  const visitor = useServerFn(continueAsVisitor);
  const refresh = useRefreshSession();
  const signOutNow = useSignOut();
  const { data: viewer = guestViewer } = useQuery(viewerQuery);
  const { data: companies = [] } = useQuery(companiesQuery);
  const { data: demo } = useQuery({ queryKey: ['demo-accounts'], queryFn: () => getDemoAccounts() });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoOpen, setDemoOpen] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);

  const nameOf = (v: typeof viewer) => (v.kind === 'staff' ? staffName : v.kind === 'company' ? companies.find((c) => c.id === v.companyId)?.name ?? 'your company' : null);
  const signedInAs = nameOf(viewer);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const v = await run({ data: { email, password } });
      await refresh();
      toast.success(`Signed in as ${nameOf(v) ?? email}`);
      if (redirect) router.history.push(safeRedirect(redirect));
      else await navigate({ to: '/', search: v.kind === 'company' ? { company: v.companyId } : {} });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in.');
      setPassword('');
      passwordRef.current?.focus();
    } finally {
      setBusy(false);
    }
  }

  async function onVisitor() {
    try {
      await visitor();
      await refresh();
      router.history.push(safeRedirect(redirect));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not continue.');
    }
  }

  function pickDemo(accountEmail: string) {
    setEmail(accountEmail);
    setError(null);
    if (demo?.password) {
      setPassword(demo.password);
      submitRef.current?.focus();
    } else passwordRef.current?.focus();
  }

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[1.1fr_1fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <Link to="/" aria-label="Virtual Science Park home, a Blue Science Park service" className="relative z-10 w-fit"><BspLogo tone="white" className="h-8" /></Link>
        <div className="relative z-10 mx-auto w-full max-w-[400px] py-6">
          <EcosystemOrbit />
        </div>
        <div className="relative z-10 max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-sidebar-primary">Virtual Science Park</p>
          <h2 className="font-display text-2xl font-bold leading-snug xl:text-3xl">Blue Science Park's ecosystem, in one place.</h2>
          <RotatingLine lines={productLines} className="mt-2 text-sm text-sidebar-foreground/80" />
          <p className="sr-only">{productLines.join(' ')}</p>
        </div>
      </aside>

      <main className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-3 duration-500">
          <Link to="/" aria-label="Virtual Science Park home, a Blue Science Park service" className="mb-8 block lg:hidden"><BrandLockup /></Link>
          <h1 className="font-display text-2xl font-bold">Sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">For member companies and park staff.</p>

          {signedInAs && (
            <div className="mt-5 flex items-center gap-3 rounded-[12px] border bg-card p-3 text-sm">
              <Avatar name={signedInAs} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">Signed in as {signedInAs}</p>
                <button type="button" className="text-xs text-muted-foreground underline-offset-2 hover:underline" onClick={signOutNow}>Sign out</button>
              </div>
              <Button asChild size="sm" variant="outline"><Link to="/" search={viewer.kind === 'company' ? { company: viewer.companyId } : {}}>Continue</Link></Button>
            </div>
          )}

          <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="username" placeholder="you@company.se" value={email} onChange={(e) => setEmail(e.target.value)} required aria-invalid={!!error} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input id="password" ref={passwordRef} type={show ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required aria-invalid={!!error} className="pr-10" />
                <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'} className="absolute inset-y-0 right-0 grid w-10 place-items-center text-muted-foreground hover:text-foreground">
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
            <Button ref={submitRef} type="submit" className="w-full" disabled={busy || !email || !password}>
              {busy ? <><Loader2 size={16} className="animate-spin" aria-hidden />Signing in…</> : 'Sign in'}
            </Button>
          </form>

          <div className="mt-5 flex items-center justify-between gap-3 text-sm">
            {!signedInAs ? (
              <button type="button" onClick={onVisitor} className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
                Continue as visitor <ArrowRight size={14} aria-hidden />
              </button>
            ) : <span />}
            <button type="button" onClick={() => setDemoOpen(!demoOpen)} aria-expanded={demoOpen} aria-controls="demo-access" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              Demo access <ChevronDown size={14} aria-hidden className={`transition-transform ${demoOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
          {demoOpen && (
            <div id="demo-access" className="mt-3 animate-in fade-in slide-in-from-top-1 duration-200">
              <Select value={email && demo?.accounts.some((a) => a.email === email) ? email : undefined} onValueChange={pickDemo}>
                <SelectTrigger aria-label="Demo account" className="w-full bg-card text-sm"><SelectValue placeholder={demo ? 'Choose a demo account' : 'Loading…'} /></SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectGroup><SelectLabel>Park staff</SelectLabel>
                    {(demo?.accounts ?? []).filter((a) => a.role === 'Park staff').map((a) => <SelectItem key={a.email} value={a.email}>{a.name}</SelectItem>)}
                  </SelectGroup>
                  <SelectGroup><SelectLabel>Member companies</SelectLabel>
                    {(demo?.accounts ?? []).filter((a) => a.role !== 'Park staff').map((a) => <SelectItem key={a.email} value={a.email}>{a.name}</SelectItem>)}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <p className="mt-1.5 text-[11px] text-muted-foreground">Fills in a prototype login for the demo.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
