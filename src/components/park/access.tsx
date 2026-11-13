import { useQueryClient } from '@tanstack/react-query';
import { Link, useLocation, useNavigate, useRouter } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { Lock, LogIn } from 'lucide-react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { signOut } from '@/lib/access.functions';

/** After the session changes: reload route data and reset every query, so nothing cached for the old account stays on screen. */
export function useRefreshSession() {
  const qc = useQueryClient();
  const router = useRouter();
  return async () => {
    await router.invalidate();
    await qc.resetQueries();
  };
}

/** Signs out and goes to the sign-in page. */
export function useSignOut() {
  const run = useServerFn(signOut);
  const refresh = useRefreshSession();
  const navigate = useNavigate();
  return async () => {
    try {
      await run();
      await navigate({ to: '/sign-in', search: {} });
      await refresh();
      toast.success('Signed out');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not sign out');
    }
  };
}

/** Only same-site paths are allowed as a return address after sign-in. */
export const safeRedirect = (to: unknown) => (typeof to === 'string' && to.startsWith('/') && !to.startsWith('//') && !to.startsWith('/sign-in') ? to : '/');

/** A "Sign in" button that brings the person back to this page afterwards. */
export function SignInButton({ children = 'Sign in', size = 'sm', variant = 'default' }: { children?: ReactNode; size?: 'sm' | 'default'; variant?: 'default' | 'outline' }) {
  const { href } = useLocation();
  return (
    <Button asChild size={size} variant={variant}>
      <Link to="/sign-in" search={{ redirect: href }}>
        <LogIn size={15} aria-hidden />
        {children}
      </Link>
    </Button>
  );
}

/** Shown where a page would show another company's private data. */
export function PrivateNotice({ name, children, staff = true }: { companyId?: string; name: string; children: ReactNode; staff?: boolean }) {
  return (
    <div className="rounded-[14px] border border-dashed bg-card/50 p-5 text-sm" role="note">
      <p className="flex items-center gap-2 font-medium"><Lock size={15} aria-hidden />Private to {name}</p>
      <p className="mt-1 text-muted-foreground">{children}</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <SignInButton />
        <span className="text-xs text-muted-foreground">Sign in as {name}{staff ? ' or as park staff' : ''} to see this.</span>
      </div>
    </div>
  );
}
