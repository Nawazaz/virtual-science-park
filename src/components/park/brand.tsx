/**
 * Virtual Science Park logo. The images live in public/brand with the background removed, so they
 * work on light and dark. vsp-logo.webp is the full logo with its name and tagline, for slides.
 */
const logoIcon = '/brand/vsp-icon.png';

/** The laptop-and-park icon on its own. */
export function BrandMark({ className = 'size-10' }: { className?: string }) {
  return <img src={logoIcon} alt="" aria-hidden width={256} height={256} className={`shrink-0 object-contain ${className}`} />;
}

/** Icon with the name and tagline next to it. `tone` picks the text colour for the background it sits on. */
export function BrandLockup({ tone = 'default', tagline = true, className = '' }: { tone?: 'default' | 'sidebar'; tagline?: boolean; className?: string }) {
  return (
    <span className={`flex items-center gap-3 ${className}`}>
      <BrandMark className="size-11" />
      <span className="leading-tight">
        <span className="block font-display text-lg">Virtual Science Park</span>
        {tagline && <span className={`block text-[10px] font-semibold uppercase tracking-[0.14em] ${tone === 'sidebar' ? 'text-sidebar-foreground/60' : 'text-muted-foreground'}`}>Future of innovation</span>}
      </span>
    </span>
  );
}
