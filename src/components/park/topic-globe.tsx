import { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { globeLayout, topicRadius } from '@/lib/globe-layout';

/**
 * 3D topic globe for the knowledge graph (three.js, loaded in the browser only).
 * Topics on the inner sphere, members on the outer sphere next to their topics; orange lines are
 * members named in another member's profile. Drag to turn, scroll to zoom, click to select.
 * It spins slowly unless the viewer stops it (the choice is remembered in this browser), asks for
 * reduced motion, or has something selected.
 */
const SPIN_KEY = 'vsp-globe-spin';
export type GlobeTopic = { id: string; label: string; category: string };
export type GlobeCompany = { id: string; name: string; topics: string[] };
export type GlobeFocus = { kind: 'topic' | 'company'; id: string } | null;

const C = { company: 0x1d9e75, tech: 0x7f77dd, sector: 0xd85a30, dim: 0x888780, hot: 0xef9f27, techLabel: '#3C3489', sectorLabel: '#993C1D', companyLabel: '#085041' };

export function TopicGlobe({ topics, companies, named, focus, onSelect, height = 460 }: {
  topics: GlobeTopic[]; companies: GlobeCompany[]; named: [string, string][]; focus: GlobeFocus;
  onSelect: (f: GlobeFocus) => void; height?: number | string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const paintRef = useRef<(f: GlobeFocus) => void>(() => {});
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;
  const focusRef = useRef(focus);
  focusRef.current = focus;
  const [spin, setSpin] = useState(true);
  const spinOn = useRef(true);
  const key = JSON.stringify([topics.map((t) => t.id), companies.map((c) => [c.id, c.topics]), named]);

  useEffect(() => {
    const el = box.current;
    if (!el || !topics.length) return;
    let stop = false;
    const cleanups: (() => void)[] = [];
    void import('three').then((THREE) => {
      if (stop) return;
      const scene = new THREE.Scene();
      const cam = new THREE.PerspectiveCamera(45, el.clientWidth / Math.max(el.clientHeight, 1), 1, 2000);
      cam.position.set(0, 0, 340);
      const ren = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      ren.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      ren.setSize(el.clientWidth, el.clientHeight);
      ren.domElement.setAttribute('aria-hidden', 'true');
      el.appendChild(ren.domElement);
      const globe = new THREE.Group();
      scene.add(globe);
      const layout = globeLayout(topics.map((t) => t.id), companies);
      const v = (p: [number, number, number]) => new THREE.Vector3(...p);

      globe.add(new THREE.Mesh(new THREE.SphereGeometry(topicRadius, 32, 24), new THREE.MeshBasicMaterial({ color: C.tech, wireframe: true, transparent: true, opacity: 0.07 })));
      type Obj = InstanceType<typeof THREE.Mesh> & { userData: { kind: 'topic' | 'company'; id: string; name: string; base: number; label?: InstanceType<typeof THREE.Sprite> } };
      const objs: Obj[] = [];
      const label = (text: string, bg: string, size = 1) => {
        const c = document.createElement('canvas');
        const x = c.getContext('2d')!;
        x.font = '500 26px sans-serif';
        const w = Math.ceil(x.measureText(text).width) + 28;
        c.width = w; c.height = 44;
        x.font = '500 26px sans-serif';
        x.fillStyle = bg;
        x.beginPath();
        if (x.roundRect) x.roundRect(0, 0, w, 44, 22); else x.rect(0, 0, w, 44);
        x.fill();
        x.fillStyle = '#ffffff';
        x.textBaseline = 'middle';
        x.fillText(text, 14, 23);
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
        s.scale.set((w / 4.4) * size, 10 * size, 1);
        return s;
      };
      for (const t of topics) {
        const p = v(layout.topics.get(t.id)!);
        const base = t.category === 'technology' ? C.tech : C.sector;
        const m = new THREE.Mesh(new THREE.SphereGeometry(4, 16, 12), new THREE.MeshBasicMaterial({ color: base, transparent: true })) as unknown as Obj;
        m.position.copy(p);
        const s = label(t.label, t.category === 'technology' ? C.techLabel : C.sectorLabel);
        s.position.copy(p.clone().multiplyScalar(1.13));
        m.userData = { kind: 'topic', id: t.id, name: t.label, base, label: s };
        globe.add(m); globe.add(s); objs.push(m);
      }
      for (const c of companies) {
        const m = new THREE.Mesh(new THREE.SphereGeometry(3, 14, 10), new THREE.MeshBasicMaterial({ color: C.company, transparent: true })) as unknown as Obj;
        const p = v(layout.companies.get(c.id)!);
        m.position.copy(p);
        // Member names: smaller teal labels just outside the dot.
        const s = label(c.name, C.companyLabel, 0.75);
        s.position.copy(p.clone().multiplyScalar(1.07));
        m.userData = { kind: 'company', id: c.id, name: c.name, base: C.company, label: s };
        globe.add(m); globe.add(s); objs.push(m);
      }
      type Ln = InstanceType<typeof THREE.Line> & { userData: { company?: string; topic?: string; named?: [string, string] } };
      const lines: Ln[] = [];
      const line = (a: [number, number, number], b: [number, number, number], color: number, opacity: number, data: Ln['userData']) => {
        const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints([v(a), v(b)]), new THREE.LineBasicMaterial({ color, transparent: true, opacity })) as unknown as Ln;
        l.userData = data; globe.add(l); lines.push(l);
      };
      for (const c of companies) for (const t of c.topics) if (layout.topics.has(t)) line(layout.companies.get(c.id)!, layout.topics.get(t)!, C.dim, 0.18, { company: c.id, topic: t });
      for (const [a, b] of named) if (layout.companies.has(a) && layout.companies.has(b)) line(layout.companies.get(a)!, layout.companies.get(b)!, C.hot, 0.9, { named: [a, b] });

      const topicsOf = new Map(companies.map((c) => [c.id, new Set(c.topics)]));
      const paint = (f: GlobeFocus) => {
        const on = (o: Obj) => !f || (f.kind === 'topic'
          ? (o.userData.kind === 'topic' ? o.userData.id === f.id : !!topicsOf.get(o.userData.id)?.has(f.id))
          : (o.userData.kind === 'company' ? o.userData.id === f.id || named.some(([a, b]) => (a === f.id && b === o.userData.id) || (b === f.id && a === o.userData.id)) : !!topicsOf.get(f.id)?.has(o.userData.id)));
        for (const o of objs) {
          const lit = on(o);
          (o.material as InstanceType<typeof THREE.MeshBasicMaterial>).color.setHex(lit ? o.userData.base : C.dim);
          (o.material as InstanceType<typeof THREE.MeshBasicMaterial>).opacity = lit ? 1 : 0.25;
          if (o.userData.label) o.userData.label.material.opacity = lit ? 1 : 0.2;
        }
        for (const l of lines) {
          const mat = l.material as InstanceType<typeof THREE.LineBasicMaterial>;
          if (l.userData.named) { mat.opacity = !f || (f.kind === 'company' && l.userData.named.includes(f.id)) ? 0.95 : 0.15; continue; }
          const lit = !!f && (f.kind === 'topic' ? l.userData.topic === f.id : l.userData.company === f.id);
          mat.color.setHex(lit ? C.hot : C.dim);
          mat.opacity = lit ? 0.9 : f ? 0.05 : 0.18;
        }
      };
      // Draw straight away too, so a selection shows even when animation frames are paused (hidden tab).
      paintRef.current = (f) => { paint(f); ren.render(scene, cam); };
      paintRef.current(focusRef.current);

      // Turning, zooming, hovering and clicking.
      const ray = new THREE.Raycaster();
      const at = new THREE.Vector2();
      const hit = (e: PointerEvent) => {
        const r = ren.domElement.getBoundingClientRect();
        at.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
        ray.setFromCamera(at, cam);
        return ray.intersectObjects(objs)[0]?.object as Obj | undefined;
      };
      let drag = false, moved = false, lx = 0, ly = 0, raf = 0;
      const down = (e: PointerEvent) => { drag = true; moved = false; lx = e.clientX; ly = e.clientY; el.style.cursor = 'grabbing'; };
      const up = (e: PointerEvent) => {
        if (drag && !moved) { const o = hit(e); selectRef.current(o ? { kind: o.userData.kind, id: o.userData.id } : null); }
        drag = false; el.style.cursor = 'grab';
      };
      const move = (e: PointerEvent) => {
        if (drag) {
          const dx = e.clientX - lx, dy = e.clientY - ly;
          if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
          globe.rotation.y += dx * 0.006; globe.rotation.x += dy * 0.006;
          lx = e.clientX; ly = e.clientY; return;
        }
        const o = hit(e);
        ren.domElement.title = o ? o.userData.name : '';
        el.style.cursor = o ? 'pointer' : 'grab';
      };
      const wheel = (e: WheelEvent) => { e.preventDefault(); cam.position.z = Math.min(540, Math.max(180, cam.position.z + e.deltaY * 0.3)); };
      ren.domElement.addEventListener('pointerdown', down);
      window.addEventListener('pointerup', up);
      ren.domElement.addEventListener('pointermove', move);
      ren.domElement.addEventListener('wheel', wheel, { passive: false });
      const loop = () => { if (!drag && spinOn.current) globe.rotation.y += 0.0022; ren.render(scene, cam); raf = requestAnimationFrame(loop); };
      loop();
      const ro = new ResizeObserver(() => { cam.aspect = el.clientWidth / Math.max(el.clientHeight, 1); cam.updateProjectionMatrix(); ren.setSize(el.clientWidth, el.clientHeight); ren.render(scene, cam); });
      ro.observe(el);
      cleanups.push(() => {
        cancelAnimationFrame(raf); ro.disconnect();
        window.removeEventListener('pointerup', up);
        ren.dispose(); ren.domElement.remove();
        scene.traverse((o) => { const m = o as { geometry?: { dispose(): void }; material?: { dispose(): void; map?: { dispose(): void } } }; m.geometry?.dispose(); m.material?.map?.dispose(); m.material?.dispose(); });
      });
    });
    return () => { stop = true; cleanups.forEach((f) => f()); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => { paintRef.current(focus); }, [focus]);
  // Saved choice wins; otherwise spin unless the viewer asked for reduced motion. Read after mount (browser only).
  useEffect(() => {
    let saved: string | null = null;
    try { saved = localStorage.getItem(SPIN_KEY); } catch { /* storage blocked: use the default */ }
    setSpin(saved ? saved === 'on' : !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);
  useEffect(() => { spinOn.current = spin && !focus; }, [spin, focus]);
  const toggleSpin = () => {
    const next = !spin;
    setSpin(next);
    try { localStorage.setItem(SPIN_KEY, next ? 'on' : 'off'); } catch { /* not remembered, still works */ }
  };

  return <div className="relative w-full" style={{ height }}>
    <div ref={box} className="relative size-full cursor-grab overflow-hidden rounded-[14px] bg-muted/40" role="img" aria-label="3D globe of topics and member companies. The topic list below gives the same information." />
    <button type="button" onClick={toggleSpin} title={spin ? 'Stop the globe turning' : 'Let the globe turn slowly'}
      className="absolute bottom-3 left-3 z-10 inline-flex items-center gap-1.5 rounded-lg border bg-card/90 px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur hover:border-primary">
      {spin ? <Pause size={14} aria-hidden /> : <Play size={14} aria-hidden />}{spin ? 'Stop spinning' : 'Spin'}
    </button>
  </div>;
}
