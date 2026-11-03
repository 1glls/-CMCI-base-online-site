import { ArrowRight, PlayCircle } from 'lucide-react';
import type { StyleConfig } from '../styles';

export function Hero({ config }: { config: StyleConfig }) {
  return (
    <section
      className="relative flex min-h-[78vh] items-center overflow-hidden"
      style={{ background: 'var(--pv-hero-bg)', color: 'var(--pv-hero-fg)' }}
    >
      {/* halo décoratif */}
      <div
        className="pv-float pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full opacity-25 blur-3xl"
        style={{ background: 'var(--pv-accent)' }}
      />
      <div
        className="pv-float pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full opacity-20 blur-3xl"
        style={{ background: 'var(--pv-accent-2)', animationDelay: '3s' }}
      />
      <div className="relative mx-auto w-full max-w-5xl px-6 text-center">
        <span
          className="inline-block rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-[0.22em]"
          style={{
            color: 'var(--pv-accent)',
            background: 'color-mix(in srgb, var(--pv-accent) 14%, transparent)',
          }}
        >
          CMCI Belgique
        </span>

        <h1
          className="pv-heading mx-auto mt-6 max-w-4xl text-4xl leading-[1.05] sm:text-6xl lg:text-7xl"
          style={{ textTransform: config.headingUpper ? 'uppercase' : 'none' }}
        >
          Une génération qui cherche Dieu
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg opacity-90 sm:text-xl">
          Former la jeunesse pour impacter le monde par la puissance de l'Évangile.
        </p>

        <p className="mx-auto mt-5 max-w-2xl text-sm italic opacity-70">
          « Allez, faites de toutes les nations des disciples. » — Matthieu 28:19-20
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            className="inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold shadow-lg"
            style={{ background: 'var(--pv-accent)', color: 'var(--pv-accent-ink)' }}
          >
            Découvrir notre vision <ArrowRight className="h-4 w-4" />
          </a>
          <a
            className="inline-flex items-center gap-2 rounded-full border px-7 py-3 text-sm font-semibold"
            style={{ borderColor: 'color-mix(in srgb, var(--pv-hero-fg) 40%, transparent)', color: 'var(--pv-hero-fg)' }}
          >
            <PlayCircle className="h-4 w-4" /> Prochains événements
          </a>
        </div>
      </div>
    </section>
  );
}
