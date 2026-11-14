import { Anchor, Cpu, Droplets, Factory, Shield, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

/**
 * Sign-in illustration: Blue Science Park at the centre of an ecosystem of member companies.
 * Members orbit on three rings with links that pulse to the hub; the park's focus areas float
 * around it. Pure SVG + CSS (classes in styles.css); everything stays still under reduced motion.
 */
const rings = [
  { r: 82, dots: 4, cls: 'vsp-spin-fast', size: 5 },
  { r: 128, dots: 6, cls: 'vsp-spin-mid', size: 4.2 },
  { r: 172, dots: 9, cls: 'vsp-spin-slow', size: 3.4 },
];
const areas = [
  { label: 'Maritime', Icon: Anchor, x: '6%', y: '14%' },
  { label: 'Digital', Icon: Cpu, x: '70%', y: '8%' },
  { label: 'Energy', Icon: Zap, x: '80%', y: '52%' },
  { label: 'Defence', Icon: Shield, x: '62%', y: '86%' },
  { label: 'Water', Icon: Droplets, x: '2%', y: '78%' },
  { label: 'Industry', Icon: Factory, x: '-4%', y: '46%' },
];

export function EcosystemOrbit({ className = '' }: { className?: string }) {
  return (
    <div className={`relative aspect-square w-full ${className}`} aria-hidden>
      <svg viewBox="0 0 400 400" className="absolute inset-0 size-full overflow-visible">
        <defs>
          <radialGradient id="eco-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00A3E2" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#00A3E2" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="200" cy="200" r="190" fill="url(#eco-glow)" />
        {[0, 1.3, 2.6].map((d) => (
          <circle key={d} cx="200" cy="200" r="60" fill="none" stroke="#83D0F5" strokeWidth="1" className="vsp-orbit vsp-pulse" style={{ animationDelay: `${d}s` }} />
        ))}
        {rings.map((ring) => (
          <g key={ring.r} className={`vsp-orbit ${ring.cls}`}>
            <circle cx="200" cy="200" r={ring.r} fill="none" stroke="#83D0F5" strokeOpacity="0.28" strokeDasharray="2 6" />
            {Array.from({ length: ring.dots }, (_, i) => {
              const a = (2 * Math.PI * i) / ring.dots + ring.r / 50;
              const x = 200 + ring.r * Math.cos(a), y = 200 + ring.r * Math.sin(a);
              return (
                <g key={i}>
                  {i % 2 === 0 && <line x1="200" y1="200" x2={x} y2={y} stroke="#00A3E2" strokeOpacity="0.45" strokeWidth="1" className="vsp-flow" />}
                  <circle cx={x} cy={y} r={ring.size + 4} fill="#00A3E2" fillOpacity="0.16" />
                  <circle cx={x} cy={y} r={ring.size} fill={i % 3 === 0 ? '#FFFFFF' : i % 3 === 1 ? '#A2EAF5' : '#00A3E2'} />
                </g>
              );
            })}
          </g>
        ))}
        <circle cx="200" cy="200" r="38" fill="#1B1C38" stroke="#83D0F5" strokeOpacity="0.6" />
        <image href="/brand/bsp-mark.svg" x="178" y="178" width="44" height="44" />
      </svg>
      {areas.map(({ label, Icon, x, y }, i) => (
        <span key={label} className="vsp-chip absolute" style={{ left: x, top: y, animationDelay: `${300 + i * 160}ms` }}>
          <span className="vsp-float inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur" style={{ animationDelay: `${i * 0.7}s` }}>
            <Icon size={12} className="text-[#83D0F5]" />{label}
          </span>
        </span>
      ))}
    </div>
  );
}

/** One product line at a time, sliding in every few seconds. Shows the first line only under reduced motion. */
export function RotatingLine({ lines, className = '' }: { lines: string[]; className?: string }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = window.setInterval(() => setI((n) => (n + 1) % lines.length), 3200);
    return () => window.clearInterval(t);
  }, [lines.length]);
  return (
    <span className={`relative block h-[1.6em] overflow-hidden ${className}`}>
      <span key={i} className="block animate-in fade-in slide-in-from-bottom-3 duration-500">{lines[i]}</span>
    </span>
  );
}
