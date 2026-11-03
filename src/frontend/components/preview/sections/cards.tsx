'use client';

import { Clock, MapPin, ArrowRight } from 'lucide-react';
import { SectionHeading } from '../section-heading';
import { PvCard } from '../card';
import { useReveal } from '../use-reveal';
import type { StyleConfig } from '../styles';

const EVENTS = [
  { date: '12 juil. 2026', title: 'Barbecue 2026', text: 'Un moment de communion, de louange et de bonne humeur dans la présence de Dieu.', time: '12h00', place: 'Seraing' },
  { date: '04 sept. 2026', title: 'Excellence Académique', text: 'Une soirée d’enseignement dédiée à la réussite et à la vision pour la jeunesse.', time: '18h00', place: 'Bruxelles' },
  { date: '27 oct. 2026', title: 'Événement d’Octobre', text: 'Trois temps de révélation, d’adoration et de transformation spirituelle.', time: '19h00', place: 'Bruxelles' },
];

export function Cards({ config }: { config: StyleConfig }) {
  const { ref, inView } = useReveal();
  return (
    <section className="py-20" style={{ background: 'var(--pv-bg)' }}>
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading eyebrow="Agenda" title="Prochains événements" config={config} />

        <div ref={ref} className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {EVENTS.map((e, i) => (
            <div key={e.title} className={`pv-reveal ${inView ? 'pv-in' : ''}`} style={{ transitionDelay: `${i * 110}ms` }}>
              <PvCard config={config} className="h-full">
                {/* Zone visuelle (dégradé de marque en l'absence de photo) */}
                <div
                  className="-mx-6 -mt-6 mb-5 flex h-36 items-end p-4"
                  style={{ background: 'var(--pv-hero-bg)' }}
                >
                  <span
                    className="rounded-full px-3 py-1 text-xs font-semibold"
                    style={{ background: 'var(--pv-accent)', color: 'var(--pv-accent-ink)' }}
                  >
                    {e.date}
                  </span>
                </div>
                <h3 className="pv-heading text-xl font-bold" style={{ color: 'var(--pv-fg)' }}>{e.title}</h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--pv-muted)' }}>{e.text}</p>
                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: 'var(--pv-muted)' }}>
                  <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{e.time}</span>
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{e.place}</span>
                </div>
                <a
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold"
                  style={{ color: 'var(--pv-accent)' }}
                >
                  Explorer <ArrowRight className="h-4 w-4" />
                </a>
              </PvCard>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
