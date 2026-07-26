'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, RefreshCw, Eye, EyeOff, Star, ExternalLink, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { API_URL, getImageUrl } from '@/lib/api';

interface Category { id: string; name: string; }
interface Book {
  id: string; title: string; author: string | null;
  language: string | null; priceLabel: string | null;
  externalLink: string | null; source: string | null;
  coverDisplay: string | null; featured: boolean; hidden: boolean;
  status: string; categories: Category[];
}

export default function AdminBooksPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [query, setQuery] = useState('');

  const token = () => localStorage.getItem('adminToken');

  useEffect(() => {
    if (!localStorage.getItem('adminToken')) { router.push('/admin'); return; }
    fetchBooks();
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
