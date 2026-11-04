import type { StyleConfig } from './styles';
import { Fleuron } from './ornaments';

export function SectionHeading({
  eyebrow, title, subtitle, config, center = true, onDark = false
}: {
  eyebrow: string; title: string; subtitle?: string;
  config: StyleConfig; center?: boolean; onDark?: boolean;
}) {
  const fg = onDark ? 'var(--pv-band-fg)' : 'var(--pv-fg)';
  const muted = onDark ? 'color-mix(in srgb, var(--pv-band-fg) 70%, transparent)' : 'var(--pv-muted)';
  // Manuscrit : surtitre en rouge rubrique (or sur les bandes sombres).
  const eyebrowColor = config.ornate
    ? (onDark ? 'var(--pv-gold-soft)' : 'var(--pv-rubric)')
    : 'var(--pv-accent)';
  return (
    <div className={center ? 'text-center' : ''}>
      <span
        className="pv-eyebrow text-xs font-semibold uppercase tracking-[0.22em]"
        style={{ color: eyebrowColor }}
      >
        {eyebrow}
      </span>
      <h2
        className="pv-heading mt-3 text-3xl leading-tight md:text-4xl lg:text-[2.9rem]"
        style={{ color: fg, textTransform: config.headingUpper ? 'uppercase' : 'none' }}
      >
        {title}
      </h2>
      {config.ornate && (
        <Fleuron
          className={`mt-4 ${center ? 'mx-auto' : ''}`}
          color={onDark ? 'var(--pv-gold-soft)' : 'var(--pv-gold)'}
        />
      )}
      {config.accentUnderline && (
        <div
          className="mt-4 h-1 w-16 rounded"
          style={{ background: 'var(--pv-accent)', marginInline: center ? 'auto' : undefined }}
        />
      )}
      {subtitle && (
        <p className="mx-auto mt-4 max-w-2xl text-base" style={{ color: muted }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
