'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon, Palette, Check, X } from 'lucide-react';
import { STYLES, ACCENTS, type StyleKey, type ThemeKey, type AccentKey } from './styles';

/**
 * Contrôle flottant du banc d'essai : choix du style + couleur d'accent +
 * bascule clair/sombre. Toujours stylé de façon autonome (indépendant des
 * tokens --pv-*) pour rester lisible quel que soit le style prévisualisé.
 */
export function StyleSwitcher({
  style, setStyle, theme, setTheme, accent, setAccent
}: {
  style: StyleKey; setStyle: (s: StyleKey) => void;
  theme: ThemeKey; setTheme: (t: ThemeKey) => void;
  accent: AccentKey; setAccent: (a: AccentKey) => void;
}) {
  // Replié par défaut sur téléphone : le panneau couvrirait toute la page.
  const [open, setOpen] = useState(true);
  useEffect(() => { setOpen(window.innerWidth >= 768); }, []);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-[100] grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-neutral-900/95 text-white shadow-2xl backdrop-blur"
        aria-label="Ouvrir le banc d'essai"
      >
        <Palette className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-[100] w-64 rounded-2xl border border-white/10 bg-neutral-900/95 p-3 text-white shadow-2xl backdrop-blur">
      <div className="mb-2 flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-wider text-white/60">
        <Palette className="h-4 w-4" /> Banc d'essai — styles
        <button onClick={() => setOpen(false)} className="ml-auto rounded p-0.5 hover:bg-white/10" aria-label="Replier le banc d'essai">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-1">
        {STYLES.map((s) => (
          <button
            key={s.key}
            onClick={() => setStyle(s.key)}
            className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left transition-colors ${
              style === s.key ? 'bg-white/15' : 'hover:bg-white/8'
            }`}
          >
            <span>
              <span className="block text-sm font-medium">{s.label}</span>
              <span className="block text-[11px] text-white/50">{s.hint}</span>
            </span>
            {style === s.key && <Check className="h-4 w-4 shrink-0 text-amber-400" />}
          </button>
        ))}
      </div>

      <div className="mt-3 px-1">
        <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/50">
          Couleur d'accent
        </div>
        <div className="flex flex-wrap gap-2">
          {ACCENTS.map((a) => (
            <button
              key={a.key}
              onClick={() => setAccent(a.key)}
              title={a.label}
              className={`h-7 w-7 rounded-full ring-offset-2 ring-offset-neutral-900 transition ${
                accent === a.key ? 'ring-2 ring-white' : 'ring-0 hover:scale-110'
              }`}
              style={{ background: a.swatch }}
            />
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1 rounded-lg bg-white/10 p-1">
        <button
          onClick={() => setTheme('light')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
            theme === 'light' ? 'bg-white text-neutral-900' : 'text-white/70 hover:text-white'
          }`}
        >
          <Sun className="h-3.5 w-3.5" /> Clair
        </button>
        <button
          onClick={() => setTheme('dark')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
            theme === 'dark' ? 'bg-white text-neutral-900' : 'text-white/70 hover:text-white'
          }`}
        >
          <Moon className="h-3.5 w-3.5" /> Sombre
        </button>
      </div>
    </div>
  );
}
