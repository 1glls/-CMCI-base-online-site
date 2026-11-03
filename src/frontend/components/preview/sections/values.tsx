'use client';

import { Heart, Send, Cross, Globe } from 'lucide-react';
import { SectionHeading } from '../section-heading';
import { PvCard } from '../card';
import { useReveal } from '../use-reveal';
import type { StyleConfig } from '../styles';

const VALUES = [
  { n: '01', icon: Heart, title: 'Communauté', text: 'Une famille spirituelle unie par l’amour du Christ, vivant la communion fraternelle.' },
  { n: '02', icon: Send, title: 'Missionnaire', text: 'Appelés à porter l’Évangile partout, faisant des disciples dans toutes les nations.' },
  { n: '03', icon: Cross, title: 'Chrétienne', text: 'Christ est notre fondement, notre modèle et notre but ; nous marchons par Son Esprit.' },
  { n: '04', icon: Globe, title: 'Internationale', text: 'Nous accueillons toutes les nations, reflétant la diversité du Royaume des cieux.' },
];

export function Values({ config }: { config: StyleConfig }) {
  const { ref, inView } = useReveal();
  return (
    <section className="py-20" style={{ background: 'var(--pv-surface)' }}>
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading eyebrow="Nos piliers" title="Nos valeurs fondamentales" config={config} />

        <div ref={ref} className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((v, i) => (
            <div key={v.title} className={`pv-reveal ${inView ? 'pv-in' : ''}`} style={{ transitionDelay: `${i * 100}ms` }}>
              <PvCard config={config} accentTop={config.cardStyle === 'rounded'} className="h-full">
                <div className="flex items-center gap-3">
                  <span
                    className="grid h-11 w-11 place-items-center rounded-full"
                    style={{ background: 'color-mix(in srgb, var(--pv-accent) 16%, transparent)', color: 'var(--pv-accent)' }}
                  >
                    <v.icon className="h-5 w-5" />
                  </span>
                  <span className="pv-heading text-2xl font-bold" style={{ color: 'color-mix(in srgb, var(--pv-fg) 25%, var(--pv-accent))' }}>
                    {v.n}
                  </span>
                </div>
                <h3 className="pv-heading mt-4 text-xl font-bold" style={{ color: 'var(--pv-fg)' }}>{v.title}</h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--pv-muted)' }}>{v.text}</p>
              </PvCard>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
