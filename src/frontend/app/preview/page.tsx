'use client';

import './preview-theme.css';
import { useEffect, useState } from 'react';
import { StyleSwitcher } from '@/components/preview/style-switcher';
import { STYLE_CONFIG, type StyleKey, type ThemeKey, type AccentKey } from '@/components/preview/styles';
import { QuinquennialBar } from '@/components/preview/sections/quinquennial-bar';
import { Hero } from '@/components/preview/sections/hero';
import { KeyFigures } from '@/components/preview/sections/key-figures';
import { Values } from '@/components/preview/sections/values';
import { Cards } from '@/components/preview/sections/cards';
import { Footer } from '@/components/preview/sections/footer';

const NAV = ['Accueil', 'Découvrir', "Vie de l'église", 'Publications', 'Contact'];

function PreviewNav() {
  return (
    <nav style={{ background: 'var(--pv-bg)', borderBottom: '1px solid var(--pv-border)' }}>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <span className="pv-heading text-xl font-bold" style={{ color: 'var(--pv-fg)' }}>
          CMCI <span style={{ color: 'var(--pv-accent)' }}>Belgique</span>
        </span>
        <div className="hidden gap-6 text-sm md:flex" style={{ color: 'var(--pv-muted)' }}>
          {NAV.map((x) => <span key={x}>{x}</span>)}
        </div>
        <span className="rounded-full px-4 py-2 text-xs font-semibold" style={{ background: 'var(--pv-accent)', color: 'var(--pv-accent-ink)' }}>
          Nous rejoindre
        </span>
      </div>
    </nav>
  );
}

export default function PreviewPage() {
  const [style, setStyle] = useState<StyleKey>('editorial');
  const [theme, setTheme] = useState<ThemeKey>('light');
  const [accent, setAccent] = useState<AccentKey>('feu');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const s = localStorage.getItem('pvStyle') as StyleKey | null;
    const t = localStorage.getItem('pvTheme') as ThemeKey | null;
    const a = localStorage.getItem('pvAccent') as AccentKey | null;
    if (s && STYLE_CONFIG[s]) setStyle(s);
    if (t === 'light' || t === 'dark') setTheme(t);
    if (a) setAccent(a);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem('pvStyle', style);
    localStorage.setItem('pvTheme', theme);
    localStorage.setItem('pvAccent', accent);
  }, [style, theme, accent, ready]);

  // Changer de style adopte son thème conseillé, tout en laissant l'utilisateur
  // rebasculer clair/sombre librement ensuite.
  const chooseStyle = (s: StyleKey) => {
    setStyle(s);
    setTheme(STYLE_CONFIG[s].defaultTheme);
  };

  const config = STYLE_CONFIG[style];

  return (
    <div className="pv-root min-h-screen" data-style={style} data-theme={theme} data-accent={accent}>
      <QuinquennialBar />
      <PreviewNav />
      <Hero config={config} />
      <KeyFigures config={config} />
      <Values config={config} />
      <Cards config={config} />
      <Footer />
      <StyleSwitcher
        style={style} setStyle={chooseStyle}
        theme={theme} setTheme={setTheme}
        accent={accent} setAccent={setAccent}
      />
    </div>
  );
}
