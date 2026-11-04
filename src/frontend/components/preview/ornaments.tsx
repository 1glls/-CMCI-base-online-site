/**
 * Ornements du style « Manuscrit sacré » (SVG en ligne, couleur héritée
 * via currentColor → or d'enluminure par défaut).
 */

/** Fleuron séparateur : filets, feuilles et croix centrale. */
export function Fleuron({ className = '', color = 'var(--pv-gold)' }: { className?: string; color?: string }) {
  return (
    <svg
      viewBox="0 0 240 24"
      className={`h-6 w-48 ${className}`}
      fill="none"
      stroke="currentColor"
      style={{ color }}
      aria-hidden="true"
    >
      <path d="M0 12H84" strokeWidth="1" />
      <path d="M156 12H240" strokeWidth="1" />
      <circle cx="88" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="152" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <path d="M93 12C100 4.5 108 4.5 113 12C108 19.5 100 19.5 93 12Z" fill="currentColor" fillOpacity=".25" strokeWidth="1" />
      <path d="M147 12C140 4.5 132 4.5 127 12C132 19.5 140 19.5 147 12Z" fill="currentColor" fillOpacity=".25" strokeWidth="1" />
      <path d="M120 2.5V21.5M114.5 8.5H125.5" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/** Coin enluminé (haut-gauche) ; les autres coins sont obtenus par symétrie. */
function Corner({ className, style }: { className: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 64 64" className={`absolute h-10 w-10 md:h-16 md:w-16 ${className}`} style={style} fill="none" stroke="currentColor" aria-hidden="true">
      <path d="M2 62V16Q2 2 16 2H62" strokeWidth="1.5" />
      <path d="M8 62V20Q8 8 20 8H62" strokeWidth=".75" />
      <circle cx="16" cy="16" r="3" fill="currentColor" stroke="none" />
      <path d="M16 16Q28 15 30 28Q18 27 16 16Z" fill="currentColor" fillOpacity=".45" strokeWidth=".75" />
    </svg>
  );
}

/** Cadre de page de manuscrit : double filet doré et quatre coins. */
export function CornerFrame() {
  return (
    <div className="pointer-events-none absolute inset-3 md:inset-6" style={{ color: 'var(--pv-gold)' }} aria-hidden="true">
      <div className="absolute inset-0" style={{ border: '1px solid color-mix(in srgb, var(--pv-gold) 60%, transparent)' }} />
      <div className="absolute inset-[6px]" style={{ border: '1px solid color-mix(in srgb, var(--pv-gold) 30%, transparent)' }} />
      <Corner className="-left-px -top-px" />
      <Corner className="-right-px -top-px" style={{ transform: 'scaleX(-1)' }} />
      <Corner className="-bottom-px -left-px" style={{ transform: 'scaleY(-1)' }} />
      <Corner className="-bottom-px -right-px" style={{ transform: 'scale(-1, -1)' }} />
    </div>
  );
}
