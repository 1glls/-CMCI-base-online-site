'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  Phone,
  Mail,
  Clock,
  Navigation
} from 'lucide-react';
import { API_URL } from '@/lib/api';

interface Assembly {
  id: string;
  city: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  schedule: string;
  phone: string;
  email: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  city: string;
  address: string;
  latitude: string;
  longitude: string;
  schedule: string;
  phone: string;
  email: string;
  status: string;
}

export default function AssembliesPage() {
  const router = useRouter();
  const [assemblies, setAssemblies] = useState<Assembly[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    city: '',
    address: '',
    latitude: '',
    longitude: '',
    schedule: '',
    phone: '',
    email: '',
    status: 'published'
  });

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin');
      return;
    }
    fetchAssemblies();
  }, [router]);

  const fetchAssemblies = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/assemblies/all`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch assemblies');
      const data = await response.json();
      setAssemblies(data);
    } catch (error) {
      console.error('Error:', error);
      alert('Erreur lors du chargement des assemblées');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('adminToken');
      const url = editingId 
        ? `${API_URL}/api/assemblies/${editingId}`
        : `${API_URL}/api/assemblies`;
      
      const response = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          latitude: formData.latitude ? parseFloat(formData.latitude) : null,
          longitude: formData.longitude ? parseFloat(formData.longitude) : null
        })
      });

      if (!response.ok) throw new Error('Failed to save assembly');
      
      alert(editingId ? 'Assemblée modifiée avec succès' : 'Assemblée créée avec succès');
      resetForm();
      fetchAssemblies();
    } catch (error) {
      console.error('Error:', error);
      alert('Erreur lors de la sauvegarde de l\'assemblée');
    }
  };

  const handleEdit = (assembly: Assembly) => {
    setEditingId(assembly.id);
    setFormData({
      city: assembly.city,
      address: assembly.address,
      latitude: assembly.latitude?.toString() || '',
      longitude: assembly.longitude?.toString() || '',
      schedule: assembly.schedule,
      phone: assembly.phone,
      email: assembly.email,
      status: assembly.status
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette assemblée ?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/assemblies/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete assembly');
      
      alert('Assemblée supprimée avec succès');
      fetchAssemblies();
    } catch (error) {
      console.error('Error:', error);
      alert('Erreur lors de la suppression de l\'assemblée');
    }
  };

  const resetForm = () => {
    setFormData({
      city: '',
      address: '',
      latitude: '',
      longitude: '',
      schedule: '',
      phone: '',
      email: '',
      status: 'published'
    });
    setEditingId(null);
    setShowForm(false);
  };

  const getCoordinatesFromAddress = async () => {
    if (!formData.address) {
      alert('Veuillez d\'abord saisir une adresse');
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.address)}`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        setFormData({
          ...formData,
          latitude: data[0].lat,
          longitude: data[0].lon
        });
        alert('Coordonnées trouvées avec succès!');
      } else {
        alert('Aucune coordonnée trouvée pour cette adresse');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Erreur lors de la recherche des coordonnées');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion des Assemblées</h1>
            <p className="text-gray-600 mt-2">Gérez les lieux de culte CMCI</p>
          </div>
          <div className="flex gap-4">
            <Button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2"
            >
              {showForm ? <X size={20} /> : <Plus size={20} />}
              {showForm ? 'Annuler' : 'Ajouter une assemblée'}
            </Button>
            <Button 
              onClick={() => router.push('/admin/dashboard')}
              variant="outline"
            >
              Retour au Dashboard
            </Button>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <Card className="p-6 mb-8">
            <h2 className="text-xl font-bold mb-6">
              {editingId ? 'Modifier l\'assemblée' : 'Nouvelle assemblée'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Ville *
                  </label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Bruxelles"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Adresse *
                  </label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="123 Avenue Louise, 1050 Bruxelles"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <Navigation size={16} />
                    Latitude
                  </label>
                  <Input
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    placeholder="50.8503"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <Navigation size={16} />
                    Longitude
                  </label>
                  <Input
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    placeholder="4.3517"
                  />
                </div>
              </div>

              <Button
                type="button"
                onClick={getCoordinatesFromAddress}
                variant="outline"
                className="w-full"
              >
                <Navigation size={16} className="mr-2" />
                Obtenir les coordonnées depuis l'adresse
              </Button>

              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <Clock size={16} />
                  Horaires *
                </label>
                <Input
                  value={formData.schedule}
                  onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                  placeholder="Dimanche 10h00 | Mercredi 19h00"
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <Phone size={16} />
                    Téléphone *
                  </label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+32 2 123 45 67"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <Mail size={16} />
                    Email *
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="bruxelles@cmci.be"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Statut
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="published">Publié</option>
                  <option value="draft">Brouillon</option>
                </select>
              </div>

              <div className="flex gap-4">
                <Button type="submit" className="flex-1">
                  <Save size={20} className="mr-2" />
                  {editingId ? 'Modifier' : 'Créer'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Annuler
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* List */}
        <div className="grid gap-6">
          {assemblies.length === 0 ? (
            <Card className="p-12 text-center">
              <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 mb-4">Aucune assemblée enregistrée</p>
              <Button onClick={() => setShowForm(true)}>
                <Plus size={20} className="mr-2" />
                Ajouter la première assemblée
              </Button>
            </Card>
          ) : (
            assemblies.map((assembly) => (
              <Card key={assembly.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <MapPin className="text-blue-600" size={24} />
                      <h3 className="text-xl font-bold">CMCI {assembly.city}</h3>
                      <span className={`px-2 py-1 rounded text-xs ${
                        assembly.status === 'published' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {assembly.status === 'published' ? 'Publié' : 'Brouillon'}
                      </span>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div className="space-y-2">
                        <p className="flex items-center gap-2">
                          <MapPin size={16} className="text-gray-400" />
                          {assembly.address}
                        </p>
                        <p className="flex items-center gap-2">
                          <Clock size={16} className="text-gray-400" />
                          {assembly.schedule}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="flex items-center gap-2">
                          <Phone size={16} className="text-gray-400" />
                          {assembly.phone}
                        </p>
                        <p className="flex items-center gap-2">
                          <Mail size={16} className="text-gray-400" />
                          {assembly.email}
                        </p>
                      </div>
                    </div>

                    {assembly.latitude && assembly.longitude && (
                      <div className="mt-3 text-xs text-gray-500">
                        📍 Coordonnées: {assembly.latitude}, {assembly.longitude}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(assembly)}
                    >
                      <Edit size={16} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(assembly.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
