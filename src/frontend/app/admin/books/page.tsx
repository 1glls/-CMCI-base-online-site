'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, RefreshCw, Eye, EyeOff, Star, ExternalLink, Loader2, Link2, Link2Off, BarChart3, Heart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { API_URL, getImageUrl } from '@/lib/api';

interface Category { id: string; name: string; }
interface Book {
  id: string; title: string; author: string | null;
  language: string | null; languageCode: string | null;
  priceLabel: string | null; externalLink: string | null; source: string | null;
  coverDisplay: string | null; featured: boolean; hidden: boolean;
  status: string; categories: Category[]; workKey: string | null;
  views: number; likes: number;
}

interface Stats {
  topBooks: { id: string; title: string; language: string | null; views: number; likes: number; sourceDownloads: number | null; sourceLikes: number | null; }[];
  topCategories: { id: string; name: string; views: number; likes: number; books: number; }[];
  totals: { views: number; likes: number; };
  totalBooks: number;
}

export default function AdminBooksPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState<Stats | null>(null);

  const token = () => localStorage.getItem('adminToken');

  useEffect(() => {
    if (!localStorage.getItem('adminToken')) { router.push('/admin'); return; }
    fetchBooks();
    fetchStats();
  }, [router]);

  const fetchBooks = async () => {
    try {
      const res = await fetch(`${API_URL}/api/books/all`, {
        headers: { Authorization: `Bearer ${token()}` }
      });
      if (res.status === 401) { localStorage.removeItem('adminToken'); router.push('/admin'); return; }
      setBooks(await res.json());
    } catch {
      toast({ title: 'Erreur', description: 'Chargement impossible', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/books/stats`, {
        headers: { Authorization: `Bearer ${token()}` }
      });
      if (res.ok) setStats(await res.json());
    } catch { /* silencieux : les stats sont secondaires */ }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const group = async () => {
    if (selected.size < 2) return;
    try {
      const res = await fetch(`${API_URL}/api/books/group`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [...selected] })
      });
      if (!res.ok) throw new Error();
      toast({ title: 'Ouvrages reliés', description: `${selected.size} éditions regroupées.` });
      setSelected(new Set());
      fetchBooks();
    } catch {
      toast({ title: 'Échec du regroupement', variant: 'destructive' });
    }
  };

  const ungroup = async (id: string) => {
    try {
      await fetch(`${API_URL}/api/books/ungroup`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      fetchBooks();
    } catch {
      toast({ title: 'Échec', variant: 'destructive' });
    }
  };

  const sync = async () => {
    setSyncing(true);
    try {
      const res = await fetch(`${API_URL}/api/books/sync`, {
        method: 'POST', headers: { Authorization: `Bearer ${token()}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Échec');
      toast({
        title: 'Catalogue synchronisé',
        description: `${data.created} ajouté(s), ${data.updated} mis à jour, ${data.archived} archivé(s).`
      });
      fetchBooks();
    } catch (err) {
      toast({
        title: 'Synchronisation impossible',
        description: err instanceof Error ? err.message : '',
        variant: 'destructive'
      });
    } finally { setSyncing(false); }
  };

  const patch = async (id: string, data: Record<string, unknown>) => {
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => fd.append(k, String(v)));
    await fetch(`${API_URL}/api/books/${id}`, {
      method: 'PUT', headers: { Authorization: `Bearer ${token()}` }, body: fd
    });
    fetchBooks();
  };

  const visible = books.filter((b) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return b.title.toLowerCase().includes(q) || (b.author || '').toLowerCase().includes(q);
  });

  const ztfCount = books.filter((b) => b.source === 'ztfbooks').length;

  // Groupes existants (editions reliees), indexes par workKey.
  const groups = new Map<string, Book[]>();
  for (const b of books) {
    if (!b.workKey) continue;
    const g = groups.get(b.workKey) || [];
    g.push(b);
    groups.set(b.workKey, g);
  }
  const existingGroups = [...groups.values()].filter((g) => g.length > 1);

  // Candidats au regroupement : filtrés par la recherche, groupés par auteur,
  // pour repérer les mêmes ouvrages en plusieurs langues.
  const byAuthor = new Map<string, Book[]>();
  for (const b of visible) {
    const key = b.author || '—';
    const g = byAuthor.get(key) || [];
    g.push(b);
    byAuthor.set(key, g);
  }
  const authorGroups = [...byAuthor.entries()]
    .filter(([, g]) => g.length > 1)
    .sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8">
          <Link href="/admin/dashboard">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />Retour au Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Livres</h1>
          <p className="text-gray-600">Catalogue synchronisé depuis ztfbooks</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Synchronisation</CardTitle>
            <CardDescription>
              Récupère le catalogue ztfbooks : titres, couvertures, langues,
              catégories, liens de vente. Les livres se mettent à jour ;
              masquer ou mettre en avant reste votre choix et survit aux synchros.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-4">
              <Button onClick={sync} disabled={syncing}>
                {syncing
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Synchronisation…</>
                  : <><RefreshCw className="mr-2 h-4 w-4" />Synchroniser depuis ztfbooks</>}
              </Button>
              <span className="text-sm text-gray-600">{ztfCount} livre(s) ztfbooks</span>
            </div>
          </CardContent>
        </Card>

        {stats && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />Audience sur cmcibelgique.org
              </CardTitle>
              <CardDescription>
                Ce qui est le plus consulté sur notre site : {stats.totals.views} vue(s) et {stats.totals.likes} « j'aime »
                cumulés. Les compteurs ztfbooks (téléchargements / likes) sont indiqués pour comparaison — ils
                reflètent l'activité sur ztfbooks, souvent très faible.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="mb-2 text-sm font-semibold text-gray-700">Ouvrages les plus consultés</h3>
                <div className="space-y-1">
                  {stats.topBooks.filter((b) => b.views > 0 || b.likes > 0).slice(0, 10).map((b) => (
                    <div key={b.id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate">{b.title}</span>
                      <span className="flex shrink-0 items-center gap-3 text-xs text-gray-500">
                        <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" />{b.views}</span>
                        <span className="inline-flex items-center gap-1"><Heart className="h-3 w-3" />{b.likes}</span>
                        <span className="text-gray-400" title="ztfbooks : téléchargements / likes">ztf {b.sourceDownloads ?? 0}/{b.sourceLikes ?? 0}</span>
                      </span>
                    </div>
                  ))}
                  {stats.topBooks.every((b) => b.views === 0 && b.likes === 0) && (
                    <p className="text-sm text-gray-400">Aucune consultation enregistrée pour l'instant.</p>
                  )}
                </div>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold text-gray-700">Catégories / séries les plus consultées</h3>
                <div className="space-y-1">
                  {stats.topCategories.filter((c) => c.views > 0).slice(0, 10).map((c) => (
                    <div key={c.id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate">{c.name} <span className="text-xs text-gray-400">({c.books})</span></span>
                      <span className="inline-flex shrink-0 items-center gap-1 text-xs text-gray-500"><Eye className="h-3 w-3" />{c.views}</span>
                    </div>
                  ))}
                  {stats.topCategories.every((c) => c.views === 0) && (
                    <p className="text-sm text-gray-400">Aucune consultation enregistrée pour l'instant.</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {(existingGroups.length > 0 || authorGroups.length > 0) && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5 text-blue-600" />Regroupement par ouvrage
              </CardTitle>
              <CardDescription>
                ztfbooks ne relie pas les éditions d'un même livre entre langues. Reliez ici manuellement
                les éditions d'un même ouvrage : la fiche publique affichera alors « aussi disponible en… ».
                Cochez au moins deux éditions, puis « Relier ». Utilisez la recherche pour cibler un ouvrage.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selected.size >= 2 && (
                <div className="mb-4 flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
                  <span className="text-sm text-blue-800">{selected.size} édition(s) sélectionnée(s)</span>
                  <Button size="sm" onClick={group}><Link2 className="mr-1.5 h-4 w-4" />Relier comme un même ouvrage</Button>
                  <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Annuler</Button>
                </div>
              )}

              {existingGroups.length > 0 && (
                <div className="mb-6">
                  <h3 className="mb-2 text-sm font-semibold text-gray-700">Ouvrages déjà reliés</h3>
                  <div className="space-y-2">
                    {existingGroups.map((g) => (
                      <div key={g[0].workKey!} className="rounded-lg border p-3">
                        <div className="flex flex-wrap gap-2">
                          {g.map((b) => (
                            <span key={b.id} className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs">
                              <span className="font-medium">{b.language || '?'}</span>
                              <span className="max-w-[160px] truncate text-gray-500">{b.title}</span>
                              <button onClick={() => ungroup(b.id)} title="Dissocier" className="text-gray-400 hover:text-red-600">
                                <Link2Off className="h-3.5 w-3.5" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <h3 className="mb-2 text-sm font-semibold text-gray-700">
                Par auteur {query && <span className="font-normal text-gray-400">(filtré : « {query} »)</span>}
              </h3>
              {authorGroups.length === 0 && (
                <p className="text-sm text-gray-400">Affinez la recherche ci-dessus pour voir les éditions d'un auteur.</p>
              )}
              <div className="space-y-4">
                {authorGroups.slice(0, 12).map(([author, g]) => (
                  <div key={author}>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">{author}</p>
                    <div className="space-y-1">
                      {g.map((b) => (
                        <label key={b.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-gray-50">
                          <input type="checkbox" checked={selected.has(b.id)} onChange={() => toggleSelect(b.id)} />
                          <span className="w-16 shrink-0 text-xs font-medium text-gray-500">{b.language || '?'}</span>
                          <span className="truncate">{b.title}</span>
                          {b.workKey && <span className="ml-auto shrink-0 text-xs text-blue-500">relié</span>}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Catalogue</CardTitle>
            <input
              className="mt-2 w-full max-w-sm rounded-md border px-3 py-2 text-sm"
              placeholder="Rechercher un titre ou un auteur…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </CardHeader>
          <CardContent>
            {loading && <p className="text-gray-500">Chargement…</p>}
            {!loading && books.length === 0 && (
              <p className="text-gray-500">
                Aucun livre. Lancez une synchronisation pour peupler le catalogue.
              </p>
            )}

            <div className="space-y-3">
              {visible.map((b) => (
                <div
                  key={b.id}
                  className={`flex items-center gap-4 rounded-lg border p-3 ${b.hidden ? 'opacity-50' : ''}`}
                >
                  {b.coverDisplay && (
                    <img
                      src={getImageUrl(b.coverDisplay)} alt=""
                      className="h-16 w-12 shrink-0 rounded object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{b.title}</p>
                    <p className="truncate text-sm text-gray-500">
                      {b.author} · {b.language} · {b.priceLabel}
                      {b.status === 'archived' && ' · archivé'}
                    </p>
                    {b.categories.length > 0 && (
                      <p className="truncate text-xs text-gray-400">
                        {b.categories.map((c) => c.name).join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="ghost" size="sm" title={b.featured ? 'Retirer de la banderole' : 'Mettre en avant'}
                      onClick={() => patch(b.id, { featured: !b.featured })}
                    >
                      <Star className={`h-4 w-4 ${b.featured ? 'fill-accent text-accent' : 'text-gray-400'}`} />
                    </Button>
                    <Button
                      variant="ghost" size="sm" title={b.hidden ? 'Afficher' : 'Masquer'}
                      onClick={() => patch(b.id, { status: b.hidden ? 'published' : 'published', hidden: !b.hidden })}
                    >
                      {b.hidden ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    {b.externalLink && (
                      <a href={b.externalLink} target="_blank" rel="noreferrer"
                         className="p-2 text-gray-400 hover:text-primary" title="Voir sur ztfbooks">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
