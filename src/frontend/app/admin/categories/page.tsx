'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Plus, Trash2, Tags } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { API_URL } from '@/lib/api';

interface Category {
  id: string; slug: string; name: string; order: number;
  bookCount: number; tractCount: number;
}

export default function AdminCategoriesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const token = () => localStorage.getItem('adminToken');

  useEffect(() => {
    if (!localStorage.getItem('adminToken')) { router.push('/admin'); return; }
    fetchCategories();
  }, [router]);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/api/categories`);
      setCategories(await res.json());
    } catch {
      toast({ title: 'Erreur', description: 'Chargement impossible', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/categories`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Création impossible');

      toast({
        title: 'Catégorie créée',
        description: 'Sa traduction en anglais et néerlandais est en cours.'
      });
      setName(''); fetchCategories();
    } catch (err) {
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : '',
        variant: 'destructive'
      });
    }
  };

  const save = async (id: string) => {
    await fetch(`${API_URL}/api/categories/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName })
    });
    toast({ title: 'Catégorie renommée' });
    setEditing(null); fetchCategories();
  };

  const remove = async (id: string) => {
    await fetch(`${API_URL}/api/categories/${id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token()}` }
    });
    toast({ title: 'Catégorie supprimée' });
    fetchCategories();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-8">
          <Link href="/admin/dashboard">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />Retour au Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Catégories</h1>
          <p className="text-gray-600">
            Classement partagé par les livres et les tracts
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Nouvelle catégorie</CardTitle>
            <CardDescription>
              Le libellé est traduit automatiquement en anglais et néerlandais.
              Son identifiant technique, lui, ne change jamais : les filtres et
              les liens partagés restent valides même après un changement de nom.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={create} className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[220px]">
                <Label htmlFor="name">Nom *</Label>
                <Input
                  id="name" required value={name}
                  placeholder="Évangélisation"
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <Button type="submit"><Plus className="mr-2 h-4 w-4" />Créer</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tags className="h-5 w-5" />Catégories existantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading && <p className="text-gray-500">Chargement...</p>}
            {!loading && categories.length === 0 && (
              <p className="text-gray-500">
                Aucune catégorie. Créez-en une pour commencer à classer vos
                publications.
              </p>
            )}

            <ul className="divide-y">
              {categories.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  {editing === c.id ? (
                    <>
                      <Input
                        className="max-w-xs" value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => save(c.id)}>Enregistrer</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                          Annuler
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <p className="font-medium">{c.name}</p>
                        <p className="text-sm text-gray-500">
                          {c.slug} · {c.tractCount} tract(s) · {c.bookCount} livre(s)
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm" variant="outline"
                          onClick={() => { setEditing(c.id); setEditName(c.name); }}
                        >
                          Renommer
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost">
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Supprimer « {c.name} » ?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Les {c.tractCount + c.bookCount} publication(s) classée(s)
                                ici sont conservées : seul le classement est retiré.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction onClick={() => remove(c.id)}>
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
