import { Facebook, Instagram, Youtube, Mail } from 'lucide-react';

const LINKS = ['Accueil', 'Vision', 'Nos Valeurs', 'Événements', 'Assemblées', 'Publications'];

export function Footer() {
  return (
    <footer style={{ background: 'var(--pv-band-bg)', color: 'var(--pv-band-fg)' }}>
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-14 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <div className="pv-heading text-2xl font-bold">
            CMCI <span style={{ color: 'var(--pv-accent)' }}>Belgique</span>
          </div>
          <p className="mt-3 max-w-sm text-sm" style={{ color: 'color-mix(in srgb, var(--pv-band-fg) 70%, transparent)' }}>
            Une famille de disciples dévoués à Jésus-Christ, notre modèle en toutes choses.
          </p>
          <div className="mt-5 flex gap-3">
            {[Facebook, Instagram, Youtube, Mail].map((Icon, i) => (
              <span
                key={i}
                className="grid h-9 w-9 place-items-center rounded-full"
                style={{ background: 'color-mix(in srgb, var(--pv-band-fg) 12%, transparent)', color: 'var(--pv-band-fg)' }}
              >
                <Icon className="h-4 w-4" />
              </span>
            ))}
          </div>
        </div>

        <div>
          <h4 className="pv-heading text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--pv-accent)' }}>
            Liens rapides
          </h4>
          <ul className="mt-4 space-y-2 text-sm" style={{ color: 'color-mix(in srgb, var(--pv-band-fg) 78%, transparent)' }}>
            {LINKS.map((l) => <li key={l}>{l}</li>)}
          </ul>
        </div>

        <div>
          <h4 className="pv-heading text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--pv-accent)' }}>
            Contact
          </h4>
          <p className="mt-4 text-sm" style={{ color: 'color-mix(in srgb, var(--pv-band-fg) 78%, transparent)' }}>
            rue d'Anderlecht 4, 1000 Bruxelles<br />
            belgiquecmci@gmail.com<br />
            +32 465 68 01 05
          </p>
        </div>
      </div>
      <div
        className="border-t px-6 py-5 text-center text-xs"
        style={{ borderColor: 'color-mix(in srgb, var(--pv-band-fg) 14%, transparent)', color: 'color-mix(in srgb, var(--pv-band-fg) 60%, transparent)' }}
      >
        © 2026 CMCI Belgique. Fait avec ❤ pour la gloire de Dieu.
      </div>
    </footer>
  );
}
