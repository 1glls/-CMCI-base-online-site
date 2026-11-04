import { ArrowRight, PlayCircle } from 'lucide-react';
import type { StyleConfig } from '../styles';
import { CornerFrame, Fleuron } from '../ornaments';

export function Hero({ config }: { config: StyleConfig }) {
  const ornate = config.ornate;
  return (
    <section
      className="relative flex min-h-[78vh] items-center overflow-hidden py-20"
      style={{ background: 'var(--pv-hero-bg)', color: 'var(--pv-hero-fg)' }}
    >
      {ornate ? (
        <>
          {/* lumière dorée descendant sur la page, cadre enluminé */}
          <div className="pv-rays pointer-events-none absolute inset-0" />
          <CornerFrame />
        </>
      ) : (
        <>
          {/* halo décoratif */}
          <div
            className="pv-float pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full opacity-25 blur-3xl"
            style={{ background: 'var(--pv-accent)' }}
          />
          <div
            className="pv-float pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full opacity-20 blur-3xl"
            style={{ background: 'var(--pv-accent-2)', animationDelay: '3s' }}
          />
        </>
      )}
      <div className="relative mx-auto w-full max-w-5xl px-8 text-center">
        <span
          className="pv-eyebrow inline-block rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-[0.22em]"
          style={ornate ? { color: 'var(--pv-rubric)' } : {
            color: 'var(--pv-accent)',
            background: 'color-mix(in srgb, var(--pv-accent) 14%, transparent)',
          }}
        >
          {ornate ? 'CMCI Belgique · Communauté Missionnaire Chrétienne Internationale' : 'CMCI Belgique'}
        </span>

        <h1
          className="pv-heading pv-h1-illum mx-auto mt-6 max-w-4xl text-4xl leading-[1.05] sm:text-6xl lg:text-7xl"
          style={{ textTransform: config.headingUpper ? 'uppercase' : 'none' }}
        >
          Une génération qui cherche Dieu
        </h1>

        {ornate && <Fleuron className="mx-auto mt-7 w-56" />}

        <p className="mx-auto mt-6 max-w-2xl text-lg opacity-90 sm:text-xl">
          Former la jeunesse pour impacter le monde par la puissance de l'Évangile.
        </p>

        {ornate ? (
          <blockquote className="mx-auto mt-8 max-w-2xl">
            <p className="pv-heading text-2xl italic leading-snug sm:text-3xl" style={{ fontWeight: 500 }}>
              «&nbsp;Réveille-toi, toi qui dors, relève-toi d’entre les morts, et Christ t’éclairera.&nbsp;»
            </p>
            <cite className="pv-caps mt-3 block text-xs not-italic" style={{ color: 'var(--pv-rubric)' }}>
              Éphésiens 5 : 14
            </cite>
          </blockquote>
        ) : (
          <p className="mx-auto mt-5 max-w-2xl text-sm italic opacity-70">
            « Allez, faites de toutes les nations des disciples. » — Matthieu 28:19-20
          </p>
        )}

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            className="pv-btn inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold shadow-lg"
            style={{ background: 'var(--pv-accent)', color: 'var(--pv-accent-ink)' }}
          >
            Découvrir notre vision <ArrowRight className="h-4 w-4" />
          </a>
          <a
            className="pv-btn inline-flex items-center gap-2 rounded-full border px-7 py-3 text-sm font-semibold"
            style={{
              borderColor: ornate ? 'var(--pv-gold)' : 'color-mix(in srgb, var(--pv-hero-fg) 40%, transparent)',
              color: 'var(--pv-hero-fg)',
            }}
          >
            <PlayCircle className="h-4 w-4" /> Prochains événements
          </a>
        </div>
      </div>
    </section>
  );
}
