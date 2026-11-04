import type { CSSProperties, ReactNode } from 'react';
import type { StyleConfig } from './styles';

/** Carte d'aperçu dont l'apparence dépend du style actif. */
export function PvCard({
  config, children, className = '', accentTop = false
}: {
  config: StyleConfig; children: ReactNode; className?: string; accentTop?: boolean;
}) {
  const base: CSSProperties = { borderRadius: 'var(--pv-radius)' };
  let style: CSSProperties = base;

  switch (config.cardStyle) {
    case 'soft':
      style = { ...base, background: 'var(--pv-surface)', boxShadow: 'var(--pv-shadow)', border: '1px solid var(--pv-border)' };
      break;
    case 'contrast':
      style = { ...base, background: 'var(--pv-surface)', border: '1px solid color-mix(in srgb, var(--pv-accent) 32%, var(--pv-border))', boxShadow: 'var(--pv-shadow)' };
      break;
    case 'rounded':
      style = { ...base, background: 'var(--pv-surface)', boxShadow: 'var(--pv-shadow)' };
      break;
    case 'outline':
      style = { ...base, background: 'transparent', border: '1px solid var(--pv-border)' };
      break;
    case 'manuscript':
      // Double filet doré, comme le cadre d'une page enluminée.
      style = {
        ...base,
        background: 'var(--pv-surface)',
        border: '1px solid color-mix(in srgb, var(--pv-gold) 70%, transparent)',
        boxShadow: 'inset 0 0 0 4px var(--pv-surface), inset 0 0 0 5px color-mix(in srgb, var(--pv-gold) 45%, transparent), var(--pv-shadow)',
      };
      break;
  }

  return (
    <div className={`pv-lift overflow-hidden ${className}`} style={style}>
      {accentTop && <div className="h-1 w-full" style={{ background: 'var(--pv-accent)' }} />}
      <div className="p-6">{children}</div>
    </div>
  );
}
