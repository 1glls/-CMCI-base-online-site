'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Target } from 'lucide-react';

const START = new Date('2026-01-01T00:00:00');
const TARGET = new Date('2030-12-31T23:59:59');

function breakdown(target: Date, now: Date) {
  if (now >= target) return { years: 0, months: 0, days: 0, hours: 0, mins: 0, secs: 0 };
  let years = target.getFullYear() - now.getFullYear();
  let months = target.getMonth() - now.getMonth();
  let days = target.getDate() - now.getDate();
  let hours = target.getHours() - now.getHours();
  let mins = target.getMinutes() - now.getMinutes();
  let secs = target.getSeconds() - now.getSeconds();
  if (secs < 0) { secs += 60; mins--; }
  if (mins < 0) { mins += 60; hours--; }
  if (hours < 0) { hours += 24; days--; }
  if (days < 0) { days += new Date(target.getFullYear(), target.getMonth(), 0).getDate(); months--; }
  if (months < 0) { months += 12; years--; }
  return { years, months, days, hours, mins, secs };
}

const UNITS: { key: keyof ReturnType<typeof breakdown>; label: string }[] = [
  { key: 'years', label: 'ANS' },
  { key: 'months', label: 'MOIS' },
  { key: 'days', label: 'JOURS' },
  { key: 'hours', label: 'H' },
  { key: 'mins', label: 'MIN' },
  { key: 'secs', label: 'SEC' },
];

export function QuinquennialBar() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const bd = breakdown(TARGET, now ?? START);
  const progress = now
    ? Math.min(100, Math.max(0, ((now.getTime() - START.getTime()) / (TARGET.getTime() - START.getTime())) * 100))
    : 0;

  return (
    <div
      className="sticky top-0 z-40"
      style={{ background: 'var(--pv-band-bg)', color: 'var(--pv-band-fg)' }}
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-5 gap-y-2 px-4 py-2.5 sm:justify-between">
        <div className="flex items-center gap-2">
          <span
            className="grid h-7 w-7 place-items-center rounded-full"
            style={{ background: 'color-mix(in srgb, var(--pv-band-accent, var(--pv-accent)) 22%, transparent)' }}
          >
            <Target className="h-4 w-4" style={{ color: 'var(--pv-band-accent, var(--pv-accent))' }} />
          </span>
          <span className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--pv-band-accent, var(--pv-accent))' }}>
            Le But Quinquennal
          </span>
          <span className="hidden text-xs opacity-70 md:inline">2026–2030 · Un Don de Dieu pour notre Communauté</span>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2 tabular-nums">
            {UNITS.map((u, i) => (
              <div key={u.key} className={`flex flex-col items-center ${i > 2 ? 'hidden sm:flex' : ''}`}>
                <span className="text-base font-bold leading-none sm:text-lg">
                  {String(bd[u.key]).padStart(2, '0')}
                </span>
                <span className="text-[9px] opacity-60">{u.label}</span>
              </div>
            ))}
          </div>

          <a
            href="https://cmfinternational.org"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
            style={{ background: 'var(--pv-accent)', color: 'var(--pv-accent-ink)' }}
          >
            En savoir plus <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      <div className="h-0.5 w-full" style={{ background: 'color-mix(in srgb, var(--pv-band-fg) 15%, transparent)' }}>
        <div className="h-full" style={{ width: `${progress}%`, background: 'var(--pv-accent)' }} />
      </div>
    </div>
  );
}
