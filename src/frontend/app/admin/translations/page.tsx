'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Languages, RefreshCw, Trash2, Plus, ShieldAlert, Loader2 } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { API_URL } from '@/lib/api';

interface Provider {
  id: string;
  name: string;
  service: string;
  apiKeyMasked: string | null;
  characterLimit: number;
  charactersUsed: number;
  remaining: number;
  usedPercent: number;
  remoteUsed: number | null;
  remoteLimit: number | null;
  lastCheckedAt: string | null;
  active: boolean;
  exhausted: boolean;
  priority: number;
  lastError: string | null;
}

const fmt = (n: number) => n.toLocaleString('fr-BE');

export default function AdminTranslationsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [totals, setTotals] = useState({ limit: 0, used: 0, remaining: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', apiKey: '', characterLimit: '500000', priority: '0' });

  const token = () => localStorage.getItem('adminToken');

  useEffect(() => {
    if (!localStorage.getItem('adminToken')) { router.push('/admin'); return; }
    fetchProviders();
  }, [router]);

  const fetchProviders = async () => {
    try {
      const res = await fetch(`${API_URL}/api/translations/providers`, {
        headers: { Authorization: `Bearer ${token()}` }
      });
      if (res.status === 401) { localStorage.removeItem('adminToken'); router.push('/admin'); return; }
      const data = await res.json();
      setProviders(data.providers || []);
      setTotals(data.totals || { limit: 0, used: 0, remaining: 0 });
    } catch {
      toast({ title: 'Erreur', description: 'Chargement impossible', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/translations/providers`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ajout impossible');

      if (data.verified) {
        toast({ title: 'Compte ajouté', description: 'Clé vérifiée auprès du fournisseur.' });
      } else {
        toast({
          title: 'Compte ajouté, mais clé non vérifiée',
          description: data.warning || 'Le fournisseur a refusé la clé.',
          variant: 'destructive'
        });
      }
      setForm({ name: '', apiKey: '', characterLimit: '500000', priority: '0' });
      fetchProviders();
    } catch (err) {
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : 'Ajout impossible',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = async (id: string) => {
    setRefreshingId(id);
    try {
      const res = await fetch(`${API_URL}/api/translations/providers/${id}/refresh`, {
        method: 'POST', headers: { Authorization: `Bearer ${token()}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: 'Consommation actualisée' });
      fetchProviders();
    } catch (err) {
      toast({
        title: 'Relevé impossible',
        description: err instanceof Error ? err.message : '',
        variant: 'destructive'
      });
    } finally {
      setRefreshingId(null);
    }
  };

  const handleToggle = async (p: Provider) => {
    await fetch(`${API_URL}/api/translations/providers/${p.id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !p.active })
    });
    fetchProviders();
  };

  const handleDelete = async (id: string) => {
    await fetch(`${API_URL}/api/translations/providers/${id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token()}` }
    });
    toast({ title: 'Compte supprimé' });
    fetchProviders();
  };

  const globalPercent = totals.limit > 0 ? Math.round((totals.used / totals.limit) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/admin/dashboard">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour au Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Traduction automatique</h1>
          <p className="text-gray-600">
            Comptes de traduction et consommation de caractères
          </p>
        </div>

        {/* Consommation globale */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Consommation globale</CardTitle>
            <CardDescription>
              Tous comptes confondus. Le quota DeepL se réinitialise chaque mois.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-2 flex justify-between text-sm">
              <span className="font-medium">{fmt(totals.used)} caractères utilisés</span>
              <span className="text-gray-600">{fmt(totals.remaining)} restants</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className={`h-full transition-all ${
                  globalPercent > 90 ? 'bg-red-500' : globalPercent > 70 ? 'bg-amber-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(100, globalPercent)}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {globalPercent}% de {fmt(totals.limit)} caractères
            </p>
          </CardContent>
        </Card>

        {/* Ajout d'un compte */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Ajouter un compte</CardTitle>
            <CardDescription>
              Quand un compte est épuisé, le suivant prend automatiquement le relais,
              par ordre de priorité.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="name">Nom du compte *</Label>
                  <Input
                    id="name" value={form.name} required
                    placeholder="DeepL principal"
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="apiKey">Clé API DeepL *</Label>
                  <Input
                    id="apiKey" type="password" value={form.apiKey} required
                    placeholder="xxxxxxxx-xxxx-...-xxxx:fx"
                    onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Le suffixe <code>:fx</code> identifie l&apos;offre gratuite. À récupérer
                    dans votre compte DeepL, onglet « Clés d&apos;API ».
                  </p>
                </div>
                <div>
                  <Label htmlFor="limit">Quota (caractères)</Label>
                  <Input
                    id="limit" type="number" value={form.characterLimit}
                    onChange={(e) => setForm({ ...form, characterLimit: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="priority">Priorité (0 = essayé en premier)</Label>
                  <Input
                    id="priority" type="number" value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  />
                </div>
              </div>
              <Button type="submit" disabled={saving}>
                {saving
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Vérification...</>
                  : <><Plus className="mr-2 h-4 w-4" />Ajouter et vérifier</>}
              </Button>
            </form>

            <div className="mt-4 flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600" />
              <div className="text-sm text-amber-900">
                <p className="font-medium">La clé est stockée en base</p>
                <p className="mt-1">
                  Elle n&apos;est jamais réaffichée en entier, mais elle figure dans les
                  sauvegardes de la base. Seul du contenu public (titres, descriptions)
                  est envoyé au service — jamais les données d&apos;abonnés ni les
                  soumissions de formulaires.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comptes */}
        <Card>
          <CardHeader>
            <CardTitle>Comptes configurés</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && <p className="text-gray-500">Chargement...</p>}
            {!loading && providers.length === 0 && (
              <p className="text-gray-500">
                Aucun compte configuré. La traduction automatique est indisponible
                tant qu&apos;aucun compte n&apos;est ajouté.
              </p>
            )}

            <div className="space-y-4">
              {providers.map((p) => (
                <div key={p.id} className="rounded-lg border p-4">
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold">
                        {p.name}
                        {!p.active && (
                          <span className="ml-2 rounded bg-gray-200 px-2 py-0.5 text-xs">désactivé</span>
                        )}
                        {p.exhausted && (
                          <span className="ml-2 rounded bg-red-100 px-2 py-0.5 text-xs text-red-800">épuisé</span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500">
                        {p.service} · clé {p.apiKeyMasked} · priorité {p.priority}
                      </p>
                      {p.lastError && (
                        <p className="mt-1 text-sm text-red-600">Dernière erreur : {p.lastError}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button
                        variant="outline" size="sm"
                        onClick={() => handleRefresh(p.id)}
                        disabled={refreshingId === p.id}
                      >
                        <RefreshCw className={`h-4 w-4 ${refreshingId === p.id ? 'animate-spin' : ''}`} />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleToggle(p)}>
                        {p.active ? 'Désactiver' : 'Activer'}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer ce compte ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              {p.name} sera retiré. Les traductions déjà produites sont conservées.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(p.id)}>
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  <div className="mb-1 flex justify-between text-sm">
                    <span>{fmt(p.charactersUsed)} / {fmt(p.characterLimit)}</span>
                    <span className="text-gray-600">{p.usedPercent}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className={`h-full ${
                        p.usedPercent > 90 ? 'bg-red-500' : p.usedPercent > 70 ? 'bg-amber-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${p.usedPercent}%` }}
                    />
                  </div>

                  <p className="mt-2 text-xs text-gray-500">
                    {p.lastCheckedAt
                      ? <>Relevé auprès du fournisseur le {new Date(p.lastCheckedAt).toLocaleString('fr-BE')}
                          {p.remoteUsed !== null && <> — {fmt(p.remoteUsed)} caractères comptés de leur côté</>}</>
                      : 'Jamais relevé auprès du fournisseur'}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
