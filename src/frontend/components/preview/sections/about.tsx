'use client';

import { SectionHeading } from '../section-heading';
import { PvCard } from '../card';
import { useReveal } from '../use-reveal';
import type { StyleConfig } from '../styles';

/** « Une communauté de disciples » — textes réels du site (fr.json, about.*). */
export function About({ config }: { config: StyleConfig }) {
  const { ref, inView } = useReveal();
  return (
    <section className="py-20" style={{ background: 'var(--pv-bg)' }}>
      <div ref={ref} className="mx-auto grid max-w-6xl gap-12 px-6 lg:grid-cols-[1.15fr_.85fr] lg:items-center">
        <div className={`pv-reveal ${inView ? 'pv-in' : ''}`}>
          <SectionHeading eyebrow="À propos" title="Une communauté de disciples" config={config} center={false} />
          {/* pv-dropcap : lettrine enluminée en style Manuscrit, sans effet ailleurs */}
          <p className="pv-dropcap mt-8 text-[1.05rem] leading-relaxed" style={{ color: 'var(--pv-fg)' }}>
            La Communauté Missionnaire Chrétienne Internationale (CMCI) est un mouvement de disciples dévoués à
            Jésus-Christ, notre modèle en toutes choses. Fondée sur la Parole de Dieu, notre mission est de former des
            disciples et d&apos;atteindre le monde avec l&apos;Évangile.
          </p>
          <p className="mt-4 leading-relaxed" style={{ color: 'var(--pv-muted)' }}>
            En Belgique, nous sommes une famille spirituelle unie par la foi et l&apos;amour du Christ. Nos assemblées
            sont des lieux de croissance, de communion fraternelle et d&apos;adoration véritable.
          </p>
        </div>

        <div className={`pv-reveal ${inView ? 'pv-in' : ''}`} style={{ transitionDelay: '150ms' }}>
          <PvCard config={config}>
            <figure className="px-2 py-4 text-center">
              <blockquote
                className="pv-heading text-2xl italic leading-snug md:text-3xl"
                style={{ color: 'var(--pv-fg)', fontWeight: config.ornate ? 500 : undefined }}
              >
                «&nbsp;Être disciple de Jésus, c&apos;est faire de Lui notre modèle absolu dans tout ce que nous pensons,
                disons et faisons.&nbsp;»
              </blockquote>
              <figcaption
                className="pv-caps mt-5 text-xs font-semibold uppercase tracking-[0.22em]"
                style={{ color: config.ornate ? 'var(--pv-rubric)' : 'var(--pv-accent)' }}
              >
                Vision CMCI
              </figcaption>
            </figure>
          </PvCard>
        </div>
      </div>
    </section>
  );
}
