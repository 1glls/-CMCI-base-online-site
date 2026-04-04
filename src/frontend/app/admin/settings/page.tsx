'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Settings as SettingsIcon, Save, Phone, Mail, MapPin, Clock, Facebook, Instagram, Youtube } from 'lucide-react';
import { FaTiktok, FaTelegram, FaWhatsapp } from 'react-icons/fa';
import { API_URL } from '@/lib/api';

interface Settings {
  id: string;
  key: string;
  value: string;
  description?: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin');
      return;
    }
    fetchSettings();
  }, [router]);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/settings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch settings');
      const data = await response.json();
      // Ensure data is an array
      setSettings(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching settings:', error);
      alert('Erreur lors du chargement des paramètres');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSetting = async (key: string, value: string) => {
    setSaving(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/settings/${key}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ value })
      });

      if (!response.ok) throw new Error('Failed to update setting');
      
      alert('Paramètre mis à jour avec succès');
      fetchSettings();
    } catch (error) {
      console.error('Error updating setting:', error);
      alert('Erreur lors de la mise à jour du paramètre');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: string, newValue: string) => {
    setSettings(settings.map(s => 
      s.key === key ? { ...s, value: newValue } : s
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  // Grouper les paramètres par catégorie
  const contactSettings = settings.filter(s => s.key.startsWith('contact_'));
  const socialSettings = settings.filter(s => s.key.startsWith('social_'));
  const otherSettings = settings.filter(s => !s.key.startsWith('contact_') && !s.key.startsWith('social_'));

  const getSettingIcon = (key: string) => {
    if (key.includes('phone')) return <Phone className="w-4 h-4" />;
    if (key.includes('email')) return <Mail className="w-4 h-4" />;
    if (key.includes('address')) return <MapPin className="w-4 h-4" />;
    if (key.includes('hours')) return <Clock className="w-4 h-4" />;
    if (key.includes('facebook')) return <Facebook className="w-4 h-4" />;
    if (key.includes('instagram')) return <Instagram className="w-4 h-4" />;
    if (key.includes('youtube')) return <Youtube className="w-4 h-4" />;
    if (key.includes('tiktok')) return <FaTiktok className="w-4 h-4" />;
    if (key.includes('telegram')) return <FaTelegram className="w-4 h-4" />;
    if (key.includes('whatsapp')) return <FaWhatsapp className="w-4 h-4" />;
    return <SettingsIcon className="w-4 h-4" />;
  };

  const getSettingLabel = (key: string) => {
    const labels: { [key: string]: string } = {
      'contact_phone': 'Numéro de téléphone',
      'contact_email': 'Adresse email',
      'contact_address': 'Adresse physique',
      'contact_hours': 'Horaires d\'ouverture',
      'social_facebook': 'Facebook',
      'social_instagram': 'Instagram',
      'social_youtube': 'YouTube',
      'social_tiktok': 'TikTok',
      'social_telegram': 'Telegram',
      'social_whatsapp': 'WhatsApp',
    };
    return labels[key] || key;
  };

  const renderSettingGroup = (title: string, groupSettings: Settings[]) => {
    if (groupSettings.length === 0) return null;
    
    return (
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <SettingsIcon className="w-5 h-5" />
          {title}
        </h2>
        <div className="space-y-6">
          {groupSettings.map((setting) => (
            <div key={setting.id} className="border-b pb-6 last:border-0">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                    {getSettingIcon(setting.key)}
                    {getSettingLabel(setting.key)}
                  </label>
                  {setting.description && (
                    <p className="text-xs text-gray-500 mb-2">{setting.description}</p>
                  )}
                </div>
              </div>
              
              <Input
                type="text"
                value={setting.value}
                onChange={(e) => handleChange(setting.key, e.target.value)}
                className="mb-2"
                placeholder={setting.key.includes('social_') ? 'https://...' : ''}
              />
              
              <Button
                size="sm"
                onClick={() => handleUpdateSetting(setting.key, setting.value)}
                disabled={saving}
              >
                <Save className="w-4 h-4 mr-2" />
                Enregistrer
              </Button>
            </div>
          ))}
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Paramètres</h1>
            <p className="text-gray-600 mt-2">Configurez les paramètres globaux du site</p>
          </div>
          <Button 
            onClick={() => router.push('/admin/dashboard')}
            variant="outline"
          >
            Retour au Dashboard
          </Button>
        </div>

        {renderSettingGroup('Informations de Contact', contactSettings)}
        {renderSettingGroup('Réseaux Sociaux', socialSettings)}
        {renderSettingGroup('Autres Paramètres', otherSettings)}

        {settings.length === 0 && (
          <Card className="p-6">
            <div className="text-center py-8">
              <SettingsIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Aucun paramètre configuré</p>
            </div>
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Les paramètres peuvent être ajoutés directement 
                depuis la base de données ou via l'API backend. Contactez l'administrateur 
                système pour ajouter de nouveaux paramètres.
              </p>
            </div>
          </Card>
        )}

        <Card className="p-6 mt-6 bg-yellow-50">
          <h3 className="font-bold mb-2 flex items-center">
            <SettingsIcon className="w-5 h-5 mr-2" />
            Configuration des réseaux sociaux
          </h3>
          <p className="text-sm text-gray-700 mb-4">
            Pour configurer les clés API des réseaux sociaux (YouTube, Facebook, Instagram, TikTok), 
            modifiez le fichier <code className="bg-gray-200 px-1 py-0.5 rounded">.env</code> dans 
            le dossier <code className="bg-gray-200 px-1 py-0.5 rounded">src/backend/</code>.
          </p>
          <div className="text-xs text-gray-600 space-y-1">
            <div>• YOUTUBE_API_KEY et YOUTUBE_CHANNEL_ID</div>
            <div>• FACEBOOK_PAGE_ID et FACEBOOK_ACCESS_TOKEN</div>
            <div>• INSTAGRAM_USER_ID et INSTAGRAM_ACCESS_TOKEN</div>
            <div>• TIKTOK_ACCESS_TOKEN</div>
          </div>
        </Card>
      </div>
    </div>
  );
}
