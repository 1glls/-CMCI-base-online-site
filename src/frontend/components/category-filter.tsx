'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { GROUP_ORDER, groupForSlug } from '@/lib/book-categories';

interface Cat { slug: string; name: string; }

/**
 * Filtre par categorie a sections pliables : les 9 themes generaux sont
 * repliés par défaut, on déplie celui qu'on veut pour choisir une série.
 * Remplace le <select> natif dont les <optgroup> affichaient tout d'un bloc.
 */
export function CategoryFilter({
  categories, value, onChange, t
}: {
  categories: Cat[];
  value: string;
  onChange: (slug: string) => void;
  t: (key: string) => string;
}) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const byGroup = new Map<string, Cat[]>();
  for (const c of categories) {
    const g = groupForSlug(c.slug);
    const arr = byGroup.get(g) || [];
    arr.push(c);
    byGroup.set(g, arr);
  }
  const groups = GROUP_ORDER.filter((g) => byGroup.has(g));

  const selectedLabel = value === '__all__'
    ? t('books.allCategories')
    : (categories.find((c) => c.slug === value)?.name ?? t('books.allCategories'));

  const toggle = (g: string) => setExpanded((prev) => {
    const next = new Set(prev);
    next.has(g) ? next.delete(g) : next.add(g);
    return next;
  });
  const pick = (slug: string) => { onChange(slug); setOpen(false); };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 border border-or/40 bg-transparent px-4 py-2 text-sm text-ivoire transition-colors hover:border-or focus:border-or-clair focus:outline-none"
      >
        <span className="max-w-[180px] truncate">{selectedLabel}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-1/2 z-40 mt-2 max-h-80 w-72 -translate-x-1/2 overflow-auto border border-or/30 bg-nuit/95 p-1 text-left text-ivoire shadow-2xl backdrop-blur">
          <button
            onClick={() => pick('__all__')}
            className={`block w-full px-3 py-2 text-left text-sm transition-colors ${
              value === '__all__' ? 'bg-or/15 font-medium text-or-clair' : 'hover:bg-ivoire/5'
            }`}
          >
            {t('books.allCategories')}
          </button>

          {groups.map((g) => {
            const items = byGroup.get(g)!.slice().sort((a, b) => a.name.localeCompare(b.name));
            const hasSelected = items.some((c) => c.slug === value);
            const isOpen = expanded.has(g) || hasSelected;
            return (
              <div key={g}>
                <button
                  onClick={() => toggle(g)}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm font-semibold text-ivoire transition-colors hover:bg-ivoire/5"
                >
                  <span>{t(`books.groups.${g}`)}</span>
                  {isOpen
                    ? <ChevronDown className="h-4 w-4 shrink-0 text-or" />
                    : <ChevronRight className="h-4 w-4 shrink-0 text-or" />}
                </button>
                {isOpen && items.map((c) => (
                  <button
                    key={c.slug}
                    onClick={() => pick(c.slug)}
                    className={`block w-full py-1.5 pl-6 pr-3 text-left text-sm transition-colors ${
                      value === c.slug ? 'bg-or/15 font-medium text-or-clair' : 'text-ivoire/65 hover:bg-ivoire/5'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
