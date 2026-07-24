'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft, Plus, Trash2, Copy, Check, Languages, ShieldAlert, ExternalLink, Pencil, Image as ImageIcon
} from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { API_URL, getImageUrl } from '@/lib/api';

interface Version {
  id: string; language: string; label: string; dir: string; title: string;
  file: string | null; previews: string[]; reviewed: boolean; status: string;
}
interface Category { id: string; slug: string; name: string; }
interface Tract {
  id: string; slug: string; title: string; description: string;
  cover: string | null; order: number; status: string;
  featured: boolean; versions: Version[]; categories: Category[];
}

const SITE = 'https://www.cmcibelgique.org';

export default function AdminTractsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [tracts, setTracts] = useState<Tract[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [openTract, setOpenTract] = useState<string | null>(null);

  const [form, setForm] = useState({ slug: '', title: '', description: '' });
  const [cover, setCover] = useState<File | null>(null);

  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [eCats, setECats] = useState<string[]>([]);

  const [editing, setEditing] = useState<string | null>(null);
  const [eForm, setEForm] = useState({ title: '', description: '', order: '0', status: 'published', featured: true });
  const [eCover, setECover] = useState<File | null>(null);
  const [eCoverPreview, setECoverPreview] = useState('');

  const [vForm, setVForm] = useState({ language: '', label: '', title: '', dir: 'ltr' });
  const [vFile, setVFile] = useState<File | null>(null);
  const [vPreviews, setVPreviews] = useState<FileList | null>(null);

  const token = () => localStorage.getItem('adminToken');

  useEffect(() => {
    if (!localStorage.getItem('adminToken')) { router.push('/admin'); return; }
    fetchTracts();
    fetch(`${API_URL}/api/categories`).then((r) => r.json())
      .then((d) => Array.isArray(d) && setAllCategories(d))
      .catch(() => {});
  }, [router]);

  const fetchTracts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/tracts/all`, {
        headers: { Authorization: `Bearer ${token()}` }
      });
      if (res.status === 401) { localStorage.removeItem('adminToken'); router.push('/admin'); return; }
      setTracts(await res.json());
    } catch {
      toast({ title: 'Erreur', description: 'Chargement impossible', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const createTract = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      fd.append('slug', form.slug);
      fd.append('title', form.title);
      fd.append('description', form.description);
      if (cover) fd.append('cover', cover);

      const res = await fetch(`${API_URL}/api/tracts`, {
        method: 'POST', headers: { Authorization: `Bearer ${token()}` }, body: fd
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Création impossible');

      toast({ title: 'Tract créé', description: `/t/${data.slug}` });
      setForm({ slug: '', title: '', description: '' }); setCover(null);
      fetchTracts();
    } catch (err) {
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : '',
        variant: 'destructive'
      });
    }
  };

  const addVersion = async (tractId: string) => {
    if (!vForm.language || !vForm.label) {
      toast({ title: 'Champs requis', description: 'Code de langue et nom natif', variant: 'destructive' });
      return;
    }
    try {
      const fd = new FormData();
      Object.entries(vForm).forEach(([k, v]) => fd.append(k, v));
      if (vFile) fd.append('file', vFile);
      if (vPreviews) Array.from(vPreviews).forEach((f) => fd.append('previews', f));

      const res = await fetch(`${API_URL}/api/tracts/${tractId}/versions`, {
        method: 'POST', headers: { Authorization: `Bearer ${token()}` }, body: fd
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ajout impossible');

      toast({
        title: 'Version ajoutée',
        description: 'Elle reste invisible tant qu\'elle n\'est pas relue et publiée.'
      });
      setVForm({ language: '', label: '', title: '', dir: 'ltr' });
      setVFile(null); setVPreviews(null);
      fetchTracts();
    } catch (err) {
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : '',
        variant: 'destructive'
      });
    }
  };

  const openEdit = (t: Tract) => {
    setEditing(t.id);
    setEForm({
      title: t.title, description: t.description,
      order: String(t.order), status: t.status, featured: t.featured
    });
    setECats(t.categories?.map((c) => c.id) ?? []);
    setECover(null); setECoverPreview('');
  };

  const saveTract = async (id: string) => {
    try {
      const fd = new FormData();
      fd.append('title', eForm.title);
      fd.append('description', eForm.description);
      fd.append('order', eForm.order);
      fd.append('status', eForm.status);
      fd.append('featured', String(eForm.featured));
      fd.append('categoryIds', JSON.stringify(eCats));
      if (eCover) fd.append('cover', eCover);

      const res = await fetch(`${API_URL}/api/tracts/${id}`, {
        method: 'PUT', headers: { Authorization: `Bearer ${token()}` }, body: fd
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Enregistrement impossible');

      toast({ title: 'Tract mis à jour' });
      setEditing(null); setECover(null); setECoverPreview('');
      fetchTracts();
    } catch (err) {
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : '',
        variant: 'destructive'
      });
    }
  };

  const onCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setECover(f);
    if (!f) { setECoverPreview(''); return; }
    const reader = new FileReader();
    reader.onloadend = () => setECoverPreview(reader.result as string);
    reader.readAsDataURL(f);
  };

  const patchVersion = async (id: string, data: Record<string, unknown>) => {
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => fd.append(k, String(v)));
    await fetch(`${API_URL}/api/tracts/versions/${id}`, {
      method: 'PUT', headers: { Authorization: `Bearer ${token()}` }, body: fd
    });
    fetchTracts();
  };

  const remove = async (url: string, label: string) => {
    await fetch(url, { method: 'DELETE', headers: { Authorization: `Bearer ${token()}` } });
    toast({ title: `${label} supprimé` });
    fetchTracts();
  };

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1800);
  };

  const isLive = (v: Version) => v.reviewed && v.status === 'published';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8">
          <Link href="/admin/dashboard">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />Retour au Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Tracts</h1>
          <p className="text-gray-600">Tracts imprimés et leurs versions linguistiques</p>
        </div>

        {/* Nouveau tract */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Nouveau tract</CardTitle>
            <CardDescription>
              Le slug détermine l&apos;adresse du QR-code : <code>/t/mon-slug</code>.
              Il ne devrait plus changer une fois le tract imprimé.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={createTract} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug" required value={form.slug}
                    placeholder="recevoir-jesus"
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="title">Titre *</Label>
                  <Input
                    id="title" required value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="desc">Description</Label>
                <Textarea
                  id="desc" rows={2} value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="cover">Couverture (image)</Label>
                <Input
                  id="cover" type="file" accept="image/*"
                  onChange={(e) => setCover(e.target.files?.[0] || null)}
                />
              </div>
              <Button type="submit"><Plus className="mr-2 h-4 w-4" />Créer</Button>
            </form>
          </CardContent>
        </Card>

        {loading && <p className="text-gray-500">Chargement...</p>}
        {!loading && tracts.length === 0 && (
          <p className="text-gray-500">Aucun tract pour le moment.</p>
        )}

        {tracts.map((t) => (
          <Card key={t.id} className="mb-6">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {t.title}
                    <a
                      href={`${SITE}/t/${t.slug}`} target="_blank" rel="noreferrer"
                      className="text-gray-400 hover:text-primary"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </CardTitle>
                  <CardDescription>
                    /t/{t.slug} · {t.versions.filter(isLive).length} langue(s) en ligne
                    sur {t.versions.length}
                  </CardDescription>
                </div>
                <div className="flex shrink-0 gap-2">
                <Button
                  variant={editing === t.id ? 'default' : 'outline'} size="sm"
                  onClick={() => (editing === t.id ? setEditing(null) : openEdit(t))}
                >
                  <Pencil className="mr-1 h-4 w-4" />Modifier
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Supprimer ce tract ?</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t.title}, ses {t.versions.length} version(s) et tous leurs
                        fichiers seront supprimés définitivement. Les QR-codes déjà
                        imprimés mèneront alors à une page « tract indisponible ».
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => remove(`${API_URL}/api/tracts/${t.id}`, 'Tract')}
                      >
                        Supprimer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {editing === t.id && (
                <div className="mb-6 rounded-lg border bg-gray-50 p-4">
                  <h3 className="mb-3 font-semibold">Modifier le tract</h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <Label>Titre</Label>
                      <Input value={eForm.title}
                        onChange={(e) => setEForm({ ...eForm, title: e.target.value })} />
                    </div>
                    <div>
                      <Label>Ordre d&apos;affichage</Label>
                      <Input type="number" value={eForm.order}
                        onChange={(e) => setEForm({ ...eForm, order: e.target.value })} />
                    </div>
                  </div>

                  <div className="mt-3">
                    <Label>Description</Label>
                    <Textarea rows={2} value={eForm.description}
                      onChange={(e) => setEForm({ ...eForm, description: e.target.value })} />
                  </div>

                  {/* Illustration : sert a la fois de vignette et de fond de banderole */}
                  <div className="mt-3">
                    <Label className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />Illustration du tract
                    </Label>
                    <Input type="file" accept="image/*" onChange={onCoverChange} />
                    <p className="mt-1 text-xs text-gray-500">
                      Cette image sert de vignette dans le catalogue <strong>et</strong> de
                      fond a la banderole de mise en avant. Un format paysage large
                      (16:9 environ) donne le meilleur resultat en pleine largeur.
                    </p>
                    {(eCoverPreview || t.cover) && (
                      <img
                        src={eCoverPreview || getImageUrl(t.cover)}
                        alt="Aperçu de l'illustration"
                        className="mt-2 h-40 w-full max-w-xl rounded-lg border object-cover"
                      />
                    )}
                  </div>

                  <div className="mt-3">
                    <Label>Catégories</Label>
                    {allCategories.length === 0 ? (
                      <p className="text-sm text-gray-500">
                        Aucune catégorie définie.{' '}
                        <Link href="/admin/categories" className="text-primary underline">
                          En créer une
                        </Link>
                      </p>
                    ) : (
                      <div className="mt-1 flex flex-wrap gap-2">
                        {allCategories.map((c) => {
                          const on = eCats.includes(c.id);
                          return (
                            <button
                              key={c.id} type="button"
                              onClick={() => setECats(on
                                ? eCats.filter((id) => id !== c.id)
                                : [...eCats, c.id])}
                              className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                                on ? 'border-primary bg-primary text-white' : 'bg-white hover:bg-gray-100'
                              }`}
                            >
                              {c.name}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={eForm.featured}
                        onChange={(e) => setEForm({ ...eForm, featured: e.target.checked })} />
                      Mettre en avant dans la banderole
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      Statut
                      <select className="h-9 rounded-md border px-2 text-sm" value={eForm.status}
                        onChange={(e) => setEForm({ ...eForm, status: e.target.value })}>
                        <option value="published">Publié</option>
                        <option value="draft">Brouillon</option>
                      </select>
                    </label>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button onClick={() => saveTract(t.id)}>Enregistrer</Button>
                    <Button variant="ghost" onClick={() => setEditing(null)}>Annuler</Button>
                  </div>
                </div>
              )}

              {/* Versions */}
              <div className="mb-4 space-y-3">
                {t.versions.map((v) => (
                  <div key={v.id} className="rounded-lg border p-3">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="font-semibold" dir={v.dir}>{v.label}</span>
                        <span className="ml-2 text-sm text-gray-500">
                          {v.language} · {v.dir.toUpperCase()}
                        </span>
                        {isLive(v) ? (
                          <span className="ml-2 rounded bg-green-100 px-2 py-0.5 text-xs text-green-800">
                            en ligne
                          </span>
                        ) : (
                          <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                            non visible
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant={v.reviewed ? 'default' : 'outline'} size="sm"
                          onClick={() => patchVersion(v.id, { reviewed: !v.reviewed })}
                        >
                          {v.reviewed ? 'Relu ✓' : 'Marquer relu'}
                        </Button>
                        <Button
                          variant="outline" size="sm"
                          onClick={() => patchVersion(v.id, {
                            status: v.status === 'published' ? 'draft' : 'published'
                          })}
                        >
                          {v.status === 'published' ? 'Publié' : 'Brouillon'}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Supprimer « {v.label} » ?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Le PDF et les aperçus seront supprimés du serveur.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => remove(`${API_URL}/api/tracts/versions/${v.id}`, 'Version')}
                              >
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      <span>{v.file ? 'PDF ✓' : 'PDF manquant'}</span>
                      <span>{v.previews.length} aperçu(s)</span>
                      {/* L'URL a encoder dans le QR de cette langue */}
                      <button
                        onClick={() => copy(`${SITE}/t/${t.slug}?de=${v.language}`, v.id)}
                        className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-1 hover:bg-gray-200"
                      >
                        {copied === v.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        {SITE.replace('https://', '')}/t/{t.slug}?de={v.language}
                      </button>
                    </div>

                    {!v.reviewed && (
                      <p className="mt-2 flex gap-2 text-xs text-amber-800">
                        <ShieldAlert className="h-4 w-4 shrink-0" />
                        Non relue par un locuteur natif : invisible sur le site, quel
                        que soit son statut.
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Ajout de version */}
              {openTract === t.id ? (
                <div className="rounded-lg border border-dashed p-4">
                  <div className="grid gap-3 md:grid-cols-4">
                    <div>
                      <Label>Code langue *</Label>
                      <Input
                        placeholder="nl" value={vForm.language}
                        onChange={(e) => setVForm({ ...vForm, language: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Nom natif *</Label>
                      <Input
                        placeholder="Nederlands" value={vForm.label}
                        onChange={(e) => setVForm({ ...vForm, label: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Titre traduit</Label>
                      <Input
                        value={vForm.title}
                        onChange={(e) => setVForm({ ...vForm, title: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Sens d&apos;écriture</Label>
                      <select
                        className="h-10 w-full rounded-md border px-3 text-sm"
                        value={vForm.dir}
                        onChange={(e) => setVForm({ ...vForm, dir: e.target.value })}
                      >
                        <option value="ltr">Gauche à droite</option>
                        <option value="rtl">Droite à gauche (arabe, ourdou…)</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div>
                      <Label>PDF</Label>
                      <Input
                        type="file" accept="application/pdf"
                        onChange={(e) => setVFile(e.target.files?.[0] || null)}
                      />
                    </div>
                    <div>
                      <Label>Images d&apos;aperçu (jusqu&apos;à 4)</Label>
                      <Input
                        type="file" accept="image/*" multiple
                        onChange={(e) => setVPreviews(e.target.files)}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Facultatif : sans images, les aper&ccedil;us sont g&eacute;n&eacute;r&eacute;s
                        automatiquement &agrave; partir du PDF, quelques secondes apr&egrave;s
                        l&apos;enregistrement.
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button onClick={() => addVersion(t.id)}>Ajouter la version</Button>
                    <Button variant="ghost" onClick={() => setOpenTract(null)}>Annuler</Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" onClick={() => setOpenTract(t.id)}>
                  <Languages className="mr-2 h-4 w-4" />Ajouter une langue
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
