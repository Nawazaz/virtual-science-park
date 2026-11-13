import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link, useNavigate, useRouter } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { ArrowRight, Eye, EyeOff, Loader2, MessagesSquare, ShieldCheck, Sparkles } from 'lucide-react';
import { BrandLockup, BrandMark } from '@/components/park/brand';
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

const perks = [
  { Icon: ShieldCheck, text: 'A profile built from your public pages, with a source for every fact' },
  { Icon: Sparkles, text: 'Funding, events and testbeds ranked for your company' },
  { Icon: MessagesSquare, text: 'An assistant that answers only from your own data' },
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

  function pickDemo(account: { email: string }) {
    setEmail(account.email);
    setError(null);
    if (demo?.password) {
      setPassword(demo.password);
      submitRef.current?.focus();
    } else passwordRef.current?.focus();
  }

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[1.05fr_1fr]">
      <aside className="hidden flex-col justify-between bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <Link to="/" aria-label="Virtual Science Park home"><BrandLockup tone="sidebar" /></Link>
        <div className="max-w-md">
          <BrandMark className="mb-8 size-40 drop-shadow-[0_12px_30px_rgba(0,0,0,0.35)] xl:size-48" />
          <h2 className="font-display text-4xl leading-tight">Your company's window into Blue Science Park.</h2>
          <ul className="mt-8 space-y-4">
            {perks.map(({ Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-sm text-sidebar-foreground/85">
                <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-sidebar-accent text-sidebar-primary"><Icon size={15} aria-hidden /></span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-sidebar-foreground/60">Hackathon prototype for Blue Science Park members, Karlskrona.</p>
      </aside>

      <main className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-sm">
          <Link to="/" aria-label="Virtual Science Park home" className="mb-8 block lg:hidden"><BrandLockup /></Link>
          <h1 className="font-display text-3xl">Sign in</h1>
          <p className="mt-2 text-sm text-muted-foreground">Use your company account to see your private profile, matches and assistant.</p>

          {signedInAs && (
            <div className="mt-6 flex items-center gap-3 rounded-[14px] border bg-card p-3 text-sm">
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

          <section aria-labelledby="demo-heading" className="mt-8">
            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <h2 id="demo-heading" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Demo accounts</h2>
              <span className="h-px flex-1 bg-border" />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {!demo ? 'Loading demo accounts…' : demo.password ? <>Pick one to fill in the form. Password for all: <code className="rounded bg-muted px-1 py-0.5 font-mono text-foreground">{demo.password}</code></> : 'Pick one to fill in the email. Ask the team for the demo password.'}
            </p>
            <ul className="mt-3 max-h-64 space-y-1.5 overflow-y-auto">
              {(demo?.accounts ?? []).map((a) => (
                <li key={a.email}>
                  <button type="button" onClick={() => pickDemo(a)} className={`flex w-full items-center gap-3 rounded-[12px] border bg-card px-3 py-2 text-left text-sm hover:border-primary ${email === a.email ? 'border-primary' : ''}`}>
                    <Avatar name={a.name} className="size-8" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{a.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">{a.email}</span>
                    </span>
                    <span className="shrink-0 text-[11px] text-muted-foreground">{a.role}</span>
                  </button>
                </li>
              ))}            </ul>
          </section>

          {!signedInAs && (
            <button type="button" onClick={onVisitor} className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              Continue as visitor <ArrowRight size={14} aria-hidden />
            </button>
          )}
          {!signedInAs && <p className="mt-1 text-xs text-muted-foreground">Visitors see public profiles only.</p>}
          <p className="mt-6 text-[11px] leading-relaxed text-muted-foreground">Prototype accounts for the hackathon. The server checks the password and every request; real member accounts would use Supabase Auth.</p>
        </div>
      </main>
    </div>
  );
}
