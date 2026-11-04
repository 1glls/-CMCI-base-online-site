'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2, Edit, Timer } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { API_URL, getImageUrl } from '@/lib/api';
import { type Countdown, phaseOf, progressOf, remaining, targetOf, visibleUnits } from '@/lib/countdown';

const UNIT_LABELS = { years: 'ans', months: 'mois', days: 'j', hours: 'h', mins: 'min', secs: 's' } as const;
const PHASE_LABELS = { upcoming: 'À venir', running: 'En cours', ended: 'Terminé (masqué)' } as const;

/** ISO → valeur d'un <input type="datetime-local"> (heure locale du navigateur). */
const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const EMPTY = {
  title: '', subtitle: '', startsAt: '', endsAt: '', location: '', schedule: '', info: '',
  linkUrl: '', linkLabel: '', image: '', showBanner: true, showHome: true, priority: 0, status: 'published',
};

/** Décompte en direct, identique à ce que verront les visiteurs. */
function LivePreview({ startsAt, endsAt }: { startsAt: string; endsAt: string }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  if (!startsAt || !endsAt || new Date(endsAt) <= new Date(startsAt)) return null;
  const c = { startsAt: new Date(startsAt).toISOString(), endsAt: new Date(endsAt).toISOString() };
  const phase = phaseOf(c, now);
  const r = remaining(targetOf(c, now), now);
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
      <p className="font-medium text-amber-900">
        {phase === 'upcoming' ? 'Commence dans' : phase === 'running' ? 'En cours · se termine dans' : 'Terminé : ne sera plus affiché'}
      </p>
      {phase !== 'ended' && (
        <p className="mt-1 font-mono text-amber-800">
          {visibleUnits(r).map((u) => `${r[u]} ${UNIT_LABELS[u]}`).join(' · ')}
        </p>
      )}
      {phase === 'running' && (
        <div className="mt-2 h-1.5 overflow-hidden rounded bg-amber-200">
          <div className="h-full bg-amber-600" style={{ width: `${progressOf(c, now) * 100}%` }} />
        </div>
      )}
    </div>
  );
}

export default function AdminCountdownsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [items, setItems] = useState<Countdown[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [saving, setSaving] = useState(false);

  const token = () => localStorage.getItem('adminToken');

  useEffect(() => {
    if (!localStorage.getItem('adminToken')) { router.push('/admin'); return; }
    fetchItems();
  }, [router]);

  const fetchItems = async () => {
    try {
      const res = await fetch(`${API_URL}/api/countdowns/all`, { headers: { Authorization: `Bearer ${token()}` } });
      if (res.status === 401) { localStorage.removeItem('adminToken'); router.push('/admin'); return; }
      setItems(await res.json());
    } catch {
      toast({ title: 'Erreur', description: 'Chargement impossible', variant: 'destructive' });
    }
  };

  const set = <K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) => setForm((f) => ({ ...f, [key]: value }));

  const resetForm = () => {
    setForm(EMPTY);
    setImageFile(null);
    setImagePreview('');
    setEditingId(null);
  };

  const handleEdit = (c: Countdown) => {
    setForm({
      title: c.title, subtitle: c.subtitle || '', startsAt: toLocalInput(c.startsAt), endsAt: toLocalInput(c.endsAt),
      location: c.location || '', schedule: c.schedule || '', info: c.info || '', linkUrl: c.linkUrl || '',
      linkLabel: c.linkLabel || '', image: c.image || '', showBanner: c.showBanner, showHome: c.showHome,
      priority: c.priority, status: c.status,
    });
    setImageFile(null);
    setImagePreview('');
    setEditingId(c.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (new Date(form.endsAt) <= new Date(form.startsAt)) {
      toast({ title: 'Dates incohérentes', description: 'La fin doit être après le début.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'image') return;
        // L'heure saisie est locale : convertie en ISO ici, une seule fois
        if (k === 'startsAt' || k === 'endsAt') fd.append(k, new Date(String(v)).toISOString());
        else fd.append(k, String(v));
      });
      if (imageFile) fd.append('image', imageFile);
      else if (editingId && !form.image) fd.append('removeImage', 'true');

      const res = await fetch(`${API_URL}/api/countdowns${editingId ? `/${editingId}` : ''}`, {
        method: editingId ? 'PUT' : 'POST', headers: { Authorization: `Bearer ${token()}` }, body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Échec');
      toast({ title: editingId ? 'Compte à rebours modifié' : 'Compte à rebours créé' });
      resetForm();
      fetchItems();
    } catch (err) {
      toast({ title: 'Erreur', description: err instanceof Error ? err.message : '', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`${API_URL}/api/countdowns/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token()}` } });
    if (res.ok) { toast({ title: 'Supprimé' }); fetchItems(); }
    else toast({ title: 'Suppression impossible', variant: 'destructive' });
  };

  const now = new Date();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <Link href="/admin/dashboard">
            <Button variant="ghost" className="mb-4"><ArrowLeft className="mr-2 h-4 w-4" />Retour au Dashboard</Button>
          </Link>
          <h1 className="text-3xl font-bold">Comptes à rebours</h1>
          <p className="text-gray-600">
            Pour un événement qui se prépare ou se déroule sur une longue période (ex. le But Quinquennal).
            Avant la date de début, le site affiche « Commence dans… » ; pendant l'événement, « En cours · se termine
            dans… » ; après la fin, il disparaît tout seul.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{editingId ? 'Modifier' : 'Ajouter'} un compte à rebours</CardTitle>
              <CardDescription>Les textes sont traduits automatiquement en anglais et en néerlandais.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Titre *</Label>
                  <Input id="title" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Le But Quinquennal" required />
                </div>
                <div>
                  <Label htmlFor="subtitle">Sous-titre</Label>
                  <Input id="subtitle" value={form.subtitle} onChange={(e) => set('subtitle', e.target.value)} placeholder="2026–2030 · Un don de Dieu pour notre communauté" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startsAt">Début *</Label>
                    <Input id="startsAt" type="datetime-local" value={form.startsAt} onChange={(e) => set('startsAt', e.target.value)} required />
                  </div>
                  <div>
                    <Label htmlFor="endsAt">Fin *</Label>
                    <Input id="endsAt" type="datetime-local" value={form.endsAt} onChange={(e) => set('endsAt', e.target.value)} required />
                  </div>
                </div>
                <LivePreview startsAt={form.startsAt} endsAt={form.endsAt} />

                <div className="rounded-lg border p-3">
                  <p className="mb-2 text-sm font-semibold">Infos pratiques</p>
                  <div className="space-y-3">
                    <Input value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="Lieu (ex. rue d'Anderlecht 4, Bruxelles)" />
                    <Input value={form.schedule} onChange={(e) => set('schedule', e.target.value)} placeholder="Horaires (ex. chaque dimanche à 11h)" />
                    <Textarea value={form.info} onChange={(e) => set('info', e.target.value)} rows={3} placeholder="Autres informations utiles (inscription, contact, ce qu'il faut apporter…)" />
                    <div className="grid grid-cols-2 gap-3">
                      <Input value={form.linkUrl} onChange={(e) => set('linkUrl', e.target.value)} placeholder="Lien (https://…)" />
                      <Input value={form.linkLabel} onChange={(e) => set('linkLabel', e.target.value)} placeholder="Texte du bouton" />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="image">Image (page « Temps forts »)</Label>
                  <Input
                    id="image" type="file" accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      setImageFile(f);
                      setImagePreview(f ? URL.createObjectURL(f) : '');
                    }}
                  />
                  {(imagePreview || form.image) && (
                    <div className="mt-2 flex items-end gap-3">
                      <img src={imagePreview || getImageUrl(form.image)} alt="Aperçu" className="h-28 w-44 rounded-lg border object-cover" />
                      <Button type="button" variant="outline" size="sm" onClick={() => { set('image', ''); setImageFile(null); setImagePreview(''); }}>
                        Retirer l'image
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-6 text-sm">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={form.showBanner} onChange={(e) => set('showBanner', e.target.checked)} />
                    Bandeau en haut de toutes les pages
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={form.showHome} onChange={(e) => set('showHome', e.target.checked)} />
                    Grand bloc sur la page « Temps forts »
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="priority">Priorité</Label>
                    <Input id="priority" type="number" value={form.priority} onChange={(e) => set('priority', parseInt(e.target.value) || 0)} />
                    <p className="mt-1 text-xs text-gray-500">Le plus petit s'affiche en premier.</p>
                  </div>
                  <div>
                    <Label>Statut</Label>
                    <Select value={form.status} onValueChange={(v) => set('status', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="published">Publié</SelectItem>
                        <SelectItem value="draft">Brouillon</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1" disabled={saving}>
                    <Plus className="mr-2 h-4 w-4" />{editingId ? 'Enregistrer' : 'Ajouter'}
                  </Button>
                  {editingId && <Button type="button" variant="outline" onClick={resetForm}>Annuler</Button>}
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h2 className="text-xl font-bold">Comptes à rebours ({items.length})</h2>
            {items.length === 0 && <p className="text-sm text-gray-500">Aucun pour l'instant.</p>}
            {items.map((c) => {
              const phase = phaseOf(c, now);
              return (
                <Card key={c.id} className={phase === 'ended' || c.status === 'draft' ? 'opacity-60' : ''}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-lg"><Timer className="h-4 w-4 text-amber-600" />{c.title}</CardTitle>
                        <CardDescription>
                          {PHASE_LABELS[phase]}{c.status === 'draft' && ' · brouillon'} · du{' '}
                          {new Date(c.startsAt).toLocaleString('fr-BE', { dateStyle: 'medium', timeStyle: 'short' })} au{' '}
                          {new Date(c.endsAt).toLocaleString('fr-BE', { dateStyle: 'medium', timeStyle: 'short' })}
                        </CardDescription>
                        <p className="mt-1 text-xs text-gray-500">
                          {[c.showBanner && 'Bandeau', c.showHome && 'Temps forts'].filter(Boolean).join(' + ') || 'Nulle part'} · priorité {c.priority}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(c)}><Edit className="h-4 w-4" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Supprimer « {c.title} » ?</AlertDialogTitle>
                              <AlertDialogDescription>Le compte à rebours disparaîtra du site. Cette action est définitive.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(c.id)}>Supprimer</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardHeader>
                  {(c.subtitle || c.location) && (
                    <CardContent className="text-sm text-gray-600">
                      {c.subtitle && <p>{c.subtitle}</p>}
                      {c.location && <p className="text-xs text-gray-500">{c.location}</p>}
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
