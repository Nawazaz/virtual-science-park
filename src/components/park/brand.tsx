/**
 * Branding: Virtual Science Park is a Blue Science Park service for member companies and park staff.
 * Blue Science Park's logo is the only logo; "Virtual Science Park" appears as a quiet product name.
 * Files in public/brand: bsp-logo-white.svg (on navy), bsp-logo-navy.svg (on light), bsp-mark.svg (square).
 */

/**
 * Blue Science Park's horizontal logo. `tone`: 'white' on navy, 'navy' on light, 'auto' follows the theme
 * (navy in light mode, white in dark mode).
 */
export function BspLogo({ tone = 'auto', className = 'h-8' }: { tone?: 'white' | 'navy' | 'auto'; className?: string }) {
  const img = (src: string, extra = '') => <img src={src} alt="Blue Science Park" width={221} height={45} className={`w-auto ${className} ${extra}`} />;
  if (tone === 'white') return img('/brand/bsp-logo-white.svg');
  if (tone === 'navy') return img('/brand/bsp-logo-navy.svg');
  return <>{img('/brand/bsp-logo-navy.svg', 'dark:hidden')}{img('/brand/bsp-logo-white.svg', 'hidden dark:block')}</>;
}

/** Blue Science Park's square mark, for tight spaces such as the phone top bar. */
export function BspMark({ className = 'size-8' }: { className?: string }) {
  return <img src="/brand/bsp-mark.svg" alt="" aria-hidden width={45} height={45} className={`shrink-0 ${className}`} />;
}

/** The product name, set small and light so it reads as part of Blue Science Park rather than a second brand. */
export function ProductName({ tone = 'default', className = '' }: { tone?: 'default' | 'sidebar'; className?: string }) {
  return <span className={`block text-[12px] font-normal tracking-[0.06em] ${tone === 'sidebar' ? 'text-sidebar-foreground/70' : 'text-muted-foreground'} ${className}`}>Virtual Science Park</span>;
}

/**
 * Blue Science Park logo with the product name under it, lined up with the "BLUE SCIENCE PARK" wordmark
 * (the wordmark starts about 26% into the logo, which is 42px at the 32px logo height used here).
 */
export function BrandLockup({ tone = 'default', className = '' }: { tone?: 'default' | 'sidebar'; className?: string }) {
  return (
    <span className={`flex flex-col gap-1.5 ${className}`}>
      <BspLogo tone={tone === 'sidebar' ? 'white' : 'auto'} className="h-8" />
      <ProductName tone={tone} className="pl-[42px]" />
    </span>
  );
}
