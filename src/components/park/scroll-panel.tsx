import type { CSSProperties, ReactNode } from 'react';

/**
 * A long list that scrolls inside the page on tablets and desktops, so the page header, filters and
 * summaries stay in view ("frozen" page, scrolling list). On phones the page simply scrolls.
 * Height = the screen height minus `fit` rem (room for what sits above), but never less than `min` rem.
 * Keyboard users can focus the panel and scroll it with the arrow keys. `relative` keeps absolutely
 * positioned children (e.g. screen-reader-only labels) inside the panel instead of stretching the page.
 */
export function ScrollPanel({ label, fit = 16, min = 24, className = '', children }: {
  label: string; fit?: number; min?: number; className?: string; children: ReactNode;
}) {
  const vars = { '--sp-fit': `${fit}rem`, '--sp-min': `${min}rem` } as CSSProperties;
  return (
    <div role="region" aria-label={label} tabIndex={0} style={vars}
      className={`scroll-panel relative md:max-h-[max(var(--sp-min),calc(100dvh-var(--sp-fit)))] md:overflow-y-auto md:overscroll-contain md:pr-1.5 ${className}`}>
      {children}
    </div>
  );
}
