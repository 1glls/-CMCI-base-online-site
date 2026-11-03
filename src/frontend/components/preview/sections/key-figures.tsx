'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { SectionHeading } from '../section-heading';
import { useReveal } from '../use-reveal';
import type { StyleConfig } from '../styles';

interface Figure { value: number; display: (n: number) => string; label: string }

const FIGURES: Figure[] = [
  { value: 10, display: (n) => `${n} mds`, label: 'Personnes à atteindre par l’Évangile' },
  { value: 1, display: (n) => `${n} md`, label: 'Disciples formés' },
  { value: 250, display: (n) => `${n}`, label: 'Nations touchées' },
  { value: 2065, display: (n) => `${n}`, label: 'Échéance de la vision' },
];

function numberStyleFor(kind: StyleConfig['numberStyle']): CSSProperties {
  switch (kind) {
    case 'glow':
      return { color: 'var(--pv-accent)', textShadow: '0 0 28px color-mix(in srgb, var(--pv-accent) 55%, transparent)' };
    case 'gradient':
      return {
        backgroundImage: 'linear-gradient(120deg, var(--pv-accent), var(--pv-accent-2))',
        WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
      };
    case 'elegant':
      return { color: 'var(--pv-accent)', fontFamily: 'var(--pv-serif)' };
    default:
      return { color: 'var(--pv-band-fg)' };
  }
}

function CountUp({ figure, run }: { figure: Figure; run: boolean }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!run) return;
    const dur = 1400;
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(eased * figure.value));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, figure.value]);
  return <>{figure.display(n)}</>;
}

export function KeyFigures({ config }: { config: StyleConfig }) {
  const { ref, inView } = useReveal();
  const numStyle = numberStyleFor(config.numberStyle);

  return (
    <section className="py-20" style={{ background: 'var(--pv-band-bg)', color: 'var(--pv-band-fg)' }}>
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow="Notre but en chiffres clés"
          title="Transformer le monde par l'Évangile"
          config={config}
          onDark
        />

        <div ref={ref} className="mt-14 grid grid-cols-2 gap-8 lg:grid-cols-4">
          {FIGURES.map((f, i) => (
            <div
              key={f.label}
              className={`pv-reveal text-center ${inView ? 'pv-in' : ''}`}
              style={{ transitionDelay: `${i * 120}ms` }}
            >
              <div
                className="pv-heading text-5xl font-extrabold leading-none sm:text-6xl lg:text-7xl"
                style={numStyle}
              >
                <CountUp figure={f} run={inView} />
              </div>
              <div
                className="mx-auto mt-4 max-w-[12rem] text-sm"
                style={{ color: 'color-mix(in srgb, var(--pv-band-fg) 72%, transparent)' }}
              >
                {f.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
