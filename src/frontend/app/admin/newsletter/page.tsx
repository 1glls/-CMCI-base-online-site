'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Trash2, Send, Download, Clock, Calendar } from 'lucide-react';
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

interface Subscriber {
  id: number;
  email: string;
  status: string;
  createdAt: string;
}

interface Event {
  id: number;
  title: string;
  date: string;
  status: string;
}

interface Stats {
  total: number;
  active: number;
  unsubscribed: number;
}

interface AutomationSettings {
  enabled: boolean;
  frequency: string;
  day: string;
  time: string;
}

export default function NewsletterPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, unsubscribed: 0 });
  const [selectedEvents, setSelectedEvents] = useState<number[]>([]);
  const [customMessage, setCustomMessage] = useState<string>('Bonjour,\n\nDécouvrez nos prochains événements et rejoignez-nous pour vivre des moments de communion fraternelle et de croissance spirituelle.');
  const [automation, setAutomation] = useState<AutomationSettings>({
    enabled: false,
    frequency: 'weekly',
    day: 'monday',
    time: '09:00'
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSubscribers();
    fetchEvents();
    fetchStats();
    fetchAutomation();
  }, []);

  const fetchSubscribers = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/newsletter/subscribers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch subscribers');
      }
      
      const data = await response.json();
      setSubscribers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching subscribers:', error);
      setSubscribers([]);
    }
  };

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/events/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      
      // Filtrer uniquement les événements publiés
      // Ne pas filtrer par date car certaines dates sont au format texte
      const published = data.filter((event: Event) => event.status === 'published');
      
      setEvents(published);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/newsletter/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats({ total: 0, active: 0, unsubscribed: 0 });
    }
  };

  const fetchAutomation = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/newsletter/automation`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAutomation(data);
      }
    } catch (error) {
      console.error('Error fetching automation settings:', error);
    }
  };

  const handleUpdateAutomation = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/newsletter/automation`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(automation)
      });

      if (response.ok) {
        toast({
          title: 'Succès',
          description: 'Configuration de l\'envoi automatique mise à jour',
        });
      } else {
        throw new Error('Failed to update automation');
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour la configuration',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteSubscriber = async (id: number) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/newsletter/subscribers/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete subscriber');
      }

      toast({
        title: 'Succès',
        description: 'Abonné supprimé avec succès',
      });

      fetchSubscribers();
      fetchStats();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer l\'abonné',
        variant: 'destructive'
      });
    }
  };

  const handleSendNewsletter = async () => {
    if (selectedEvents.length === 0) {
      toast({
        title: 'Attention',
        description: 'Veuillez sélectionner au moins un événement',
        variant: 'destructive'
      });
      return;
    }

    if (stats.active === 0) {
      toast({
        title: 'Attention',
        description: 'Aucun abonné actif',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/newsletter/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          eventIds: selectedEvents,
          customMessage: customMessage.replace(/\n/g, '<br>')
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Succès',
          description: `Newsletter envoyée à ${data.successCount} abonnés`,
        });
        setSelectedEvents([]);
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'envoyer la newsletter',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportSubscribers = () => {
    const activeSubscribers = subscribers.filter(s => s.status === 'active');
    const csv = 'Email,Date d\'inscription,Statut\n' + 
      activeSubscribers.map(s => `${s.email},${new Date(s.createdAt).toLocaleDateString()},${s.status}`).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `abonnes-newsletter-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const toggleEventSelection = (eventId: number) => {
    setSelectedEvents(prev => 
      prev.includes(eventId) 
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestion Newsletter</h1>
          <p className="text-muted-foreground">Gérez vos abonnés et envoyez des newsletters</p>
        </div>
        <Button onClick={handleExportSubscribers} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Exporter CSV
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Abonnés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abonnés Actifs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Désabonnés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.unsubscribed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Automation Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Envoi Automatique
              </CardTitle>
              <CardDescription>
                Configurez l'envoi automatique de newsletters aux abonnés
              </CardDescription>
            </div>
            <Switch
              checked={automation.enabled}
              onCheckedChange={(checked) => {
                setAutomation({ ...automation, enabled: checked });
              }}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="frequency">Fréquence</Label>
              <Select
                value={automation.frequency}
                onValueChange={(value) => setAutomation({ ...automation, frequency: value })}
                disabled={!automation.enabled}
              >
                <SelectTrigger id="frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Quotidien</SelectItem>
                  <SelectItem value="weekly">Hebdomadaire</SelectItem>
                  <SelectItem value="monthly">Mensuel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {automation.frequency === 'weekly' && (
              <div className="space-y-2">
                <Label htmlFor="day">Jour</Label>
                <Select
                  value={automation.day}
                  onValueChange={(value) => setAutomation({ ...automation, day: value })}
                  disabled={!automation.enabled}
                >
                  <SelectTrigger id="day">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monday">Lundi</SelectItem>
                    <SelectItem value="tuesday">Mardi</SelectItem>
                    <SelectItem value="wednesday">Mercredi</SelectItem>
                    <SelectItem value="thursday">Jeudi</SelectItem>
                    <SelectItem value="friday">Vendredi</SelectItem>
                    <SelectItem value="saturday">Samedi</SelectItem>
                    <SelectItem value="sunday">Dimanche</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="time">Heure</Label>
              <Select
                value={automation.time}
                onValueChange={(value) => setAutomation({ ...automation, time: value })}
                disabled={!automation.enabled}
              >
                <SelectTrigger id="time">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="06:00">06:00</SelectItem>
                  <SelectItem value="07:00">07:00</SelectItem>
                  <SelectItem value="08:00">08:00</SelectItem>
                  <SelectItem value="09:00">09:00</SelectItem>
                  <SelectItem value="10:00">10:00</SelectItem>
                  <SelectItem value="12:00">12:00</SelectItem>
                  <SelectItem value="14:00">14:00</SelectItem>
                  <SelectItem value="18:00">18:00</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Calendar className="h-5 w-5 text-blue-600" />
            <div className="flex-1 text-sm">
              {automation.enabled ? (
                <p className="text-blue-900">
                  <strong>Envoi automatique activé :</strong>{' '}
                  {automation.frequency === 'weekly' && `Tous les ${automation.day === 'monday' ? 'lundis' : automation.day === 'tuesday' ? 'mardis' : automation.day === 'wednesday' ? 'mercredis' : automation.day === 'thursday' ? 'jeudis' : automation.day === 'friday' ? 'vendredis' : automation.day === 'saturday' ? 'samedis' : 'dimanches'}`}
                  {automation.frequency === 'daily' && 'Tous les jours'}
                  {automation.frequency === 'monthly' && 'Tous les mois'}
                  {' à '}{automation.time}
                </p>
              ) : (
                <p className="text-gray-600">L'envoi automatique est désactivé</p>
              )}
            </div>
          </div>

          <Button onClick={handleUpdateAutomation} className="w-full">
            Enregistrer la configuration
          </Button>
        </CardContent>
      </Card>

      {/* Send Newsletter Section */}
      <Card>
        <CardHeader>
          <CardTitle>Envoyer une Newsletter</CardTitle>
          <CardDescription>
            Personnalisez votre message et sélectionnez les événements à inclure
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Message personnalisé */}
          <div className="space-y-2">
            <Label htmlFor="customMessage">Message personnalisé</Label>
            <Textarea
              id="customMessage"
              placeholder="Écrivez votre message d'introduction..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Ce message apparaîtra en haut de la newsletter, avant la liste des événements
            </p>
          </div>

          {/* Sélection des événements */}
          <div className="space-y-2">
            <Label>Événements à inclure ({events.length} disponibles)</Label>
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun événement disponible</p>
            ) : (
              events.map(event => (
                <div key={event.id} className="flex items-center space-x-2 p-3 border rounded-lg">
                  <Checkbox
                    checked={selectedEvents.includes(event.id)}
                    onCheckedChange={() => toggleEventSelection(event.id)}
                  />
                  <div className="flex-1">
                    <p className="font-medium">{event.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {event.date} {event.time && `à ${event.time}`}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <Button 
            onClick={handleSendNewsletter} 
            disabled={loading || selectedEvents.length === 0}
            className="w-full"
          >
            <Send className="mr-2 h-4 w-4" />
            {loading ? 'Envoi en cours...' : `Envoyer à ${stats.active} abonnés`}
          </Button>
        </CardContent>
      </Card>

      {/* Subscribers List */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Abonnés</CardTitle>
          <CardDescription>
            {subscribers.length} abonné{subscribers.length > 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {subscribers.map(subscriber => (
              <div key={subscriber.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{subscriber.email}</p>
                  <p className="text-sm text-muted-foreground">
                    Inscrit le {new Date(subscriber.createdAt).toLocaleDateString('fr-BE')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={subscriber.status === 'active' ? 'default' : 'secondary'}>
                    {subscriber.status === 'active' ? 'Actif' : 'Désabonné'}
                  </Badge>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                        <AlertDialogDescription>
                          Êtes-vous sûr de vouloir supprimer l'abonné {subscriber.email} ?
                          Cette action est irréversible.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteSubscriber(subscriber.id)}>
                          Supprimer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
