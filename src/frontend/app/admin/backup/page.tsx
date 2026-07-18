'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, DatabaseBackup, Trash2, ShieldAlert, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { API_URL } from '@/lib/api';

interface Backup {
  name: string;
  size: number;
  createdAt: string;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('fr-BE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

export default function AdminBackupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [backups, setBackups] = useState<Backup[]>([]);
  const [retention, setRetention] = useState(8);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin');
      return;
    }
    fetchBackups();
  }, [router]);

  const fetchBackups = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/backup`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.status === 401) {
        localStorage.removeItem('adminToken');
        router.push('/admin');
        return;
      }
      if (!response.ok) throw new Error('Chargement impossible');

      const data = await response.json();
      setBackups(data.backups || []);
      setRetention(data.retention ?? 8);
    } catch (error) {
      console.error('Error fetching backups:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger la liste des sauvegardes',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/backup`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Sauvegarde impossible');

      toast({
        title: 'Sauvegarde créée',
        description: `${data.backup.name} — ${formatSize(data.backup.size)}`
      });
      fetchBackups();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Sauvegarde impossible',
        variant: 'destructive'
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (name: string) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/backup/${name}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Suppression impossible');

      toast({ title: 'Sauvegarde supprimée', description: name });
      fetchBackups();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer cette sauvegarde',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/admin/dashboard">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour au Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Sauvegardes</h1>
          <p className="text-gray-600">
            Sauvegardes de la base de données du site
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Créer une sauvegarde</CardTitle>
            <CardDescription>
              Un instantané complet est créé sur le serveur, sans interrompre le site.
              Une sauvegarde automatique a par ailleurs lieu chaque semaine.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleCreate} disabled={creating} size="lg">
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sauvegarde en cours...
                </>
              ) : (
                <>
                  <DatabaseBackup className="mr-2 h-4 w-4" />
                  Sauvegarder maintenant
                </>
              )}
            </Button>

            <div className="mt-4 flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600" />
              <div className="text-sm text-amber-900">
                <p className="font-medium">Les sauvegardes restent sur le serveur</p>
                <p className="mt-1">
                  Elles contiennent des données personnelles (abonnés, soumissions de
                  formulaires) et ne sont volontairement pas téléchargeables depuis cette
                  page. Pour en récupérer une, utilisez le script{' '}
                  <code className="rounded bg-amber-100 px-1">
                    otherthings/scripts/backup-prod-db.sh
                  </code>.
                </p>
                <p className="mt-1">
                  Une sauvegarde stockée uniquement sur le serveur ne protège pas contre la
                  perte du serveur : rapatriez-en une régulièrement.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sauvegardes disponibles</CardTitle>
            <CardDescription>
              Les {retention} plus récentes sont conservées, les plus anciennes sont
              supprimées automatiquement.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading && <p className="text-gray-500">Chargement...</p>}

            {!loading && backups.length === 0 && (
              <p className="text-gray-500">
                Aucune sauvegarde pour le moment. Utilisez le bouton ci-dessus.
              </p>
            )}

            {!loading && backups.length > 0 && (
              <ul className="divide-y">
                {backups.map((backup, index) => (
                  <li key={backup.name} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium">
                        {formatDate(backup.createdAt)}
                        {index === 0 && (
                          <span className="ml-2 rounded bg-green-100 px-2 py-0.5 text-xs text-green-800">
                            la plus récente
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500">
                        {backup.name} — {formatSize(backup.size)}
                      </p>
                    </div>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer cette sauvegarde ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            {backup.name} sera définitivement supprimée du serveur.
                            {index === 0 && backups.length > 1 && (
                              <strong className="mt-2 block text-amber-700">
                                Attention : c&apos;est la sauvegarde la plus récente.
                              </strong>
                            )}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(backup.name)}>
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
