'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, User } from 'lucide-react';
import { API_URL, getImageUrl } from '@/lib/api';

interface Testimonial {
  id: string;
  name: string;
  role: string;
  quote: string;
  image?: string;
  status?: string;
  createdAt: string;
}

export default function TestimonialsPage() {
  const router = useRouter();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    quote: '',
    image: '',
    status: 'published'
  });


  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin');
      return;
    }
    fetchTestimonials();
  }, [router]);

  const fetchTestimonials = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/testimonials/all`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch testimonials');
      const data = await response.json();
      setTestimonials(data);
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      alert('Erreur lors du chargement des témoignages');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      const url = editingId
        ? `${API_URL}/api/testimonials/${editingId}`
        : `${API_URL}/api/testimonials`;
      
      const method = editingId ? 'PUT' : 'POST';
      
      // Use FormData if there's a file, otherwise JSON
      let body;
      let headers: HeadersInit = {
        'Authorization': `Bearer ${token}`
      };
      
      if (imageFile) {
        const formDataToSend = new FormData();
        formDataToSend.append('name', formData.name);
        formDataToSend.append('role', formData.role);
        formDataToSend.append('quote', formData.quote);
        formDataToSend.append('status', formData.status);
        formDataToSend.append('image', imageFile);
        body = formDataToSend;
      } else {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify(formData);
      }
      
      const response = await fetch(url, {
        method,
        headers,
        body
      });

      if (!response.ok) throw new Error('Failed to save testimonial');
      
      alert(editingId ? 'Témoignage modifié avec succès' : 'Témoignage créé avec succès');
      setShowForm(false);
      setEditingId(null);
      setImageFile(null);
      setImagePreview('');
      setFormData({ name: '', role: '', quote: '', image: '', status: 'published' });
      fetchTestimonials();
    } catch (error) {
      console.error('Error saving testimonial:', error);
      alert('Erreur lors de la sauvegarde du témoignage');
    }
  };

  const handleEdit = (testimonial: Testimonial) => {
    setFormData({
      name: testimonial.name,
      role: testimonial.role,
      quote: testimonial.quote,
      image: testimonial.image || '',
      status: testimonial.status || 'published'
    });
    setEditingId(testimonial.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce témoignage ?')) return;
    
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/testimonials/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete testimonial');
      
      alert('Témoignage supprimé avec succès');
      fetchTestimonials();
    } catch (error) {
      console.error('Error deleting testimonial:', error);
      alert('Erreur lors de la suppression du témoignage');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setImageFile(null);
    setImagePreview('');
    setFormData({ name: '', role: '', quote: '', image: '', status: 'published' });
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion des Témoignages</h1>
            <p className="text-gray-600 mt-2">Gérez les témoignages affichés sur le site</p>
          </div>
          <Button 
            onClick={() => router.push('/admin/dashboard')}
            variant="outline"
          >
            Retour au Dashboard
          </Button>
        </div>

        {!showForm && (
          <Button 
            onClick={() => setShowForm(true)}
            className="mb-6"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouveau Témoignage
          </Button>
        )}

        {showForm && (
          <Card className="p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">
              {editingId ? 'Modifier le témoignage' : 'Nouveau témoignage'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nom</label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Rôle / Fonction</label>
                <Input
                  type="text"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Témoignage</label>
                <Textarea
                  value={formData.quote}
                  onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                  rows={5}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Image</label>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Uploader depuis votre machine</label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="cursor-pointer"
                    />
                  </div>
                  <div className="text-center text-gray-500 text-sm">OU</div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">URL d'une image en ligne</label>
                    <Input
                      type="text"
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                      disabled={!!imageFile}
                    />
                  </div>
                  {(imagePreview || formData.image) && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-600 mb-1">Aperçu:</p>
                      <img 
                        src={imagePreview || getImageUrl(formData.image)} 
                        alt="Preview" 
                        className="w-32 h-32 object-cover rounded-lg border"
                      />
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Statut</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="published">Publié</option>
                  <option value="draft">Brouillon</option>
                </select>
              </div>
              <div className="flex gap-3">
                <Button type="submit">
                  {editingId ? 'Modifier' : 'Créer'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Annuler
                </Button>
              </div>
            </form>
          </Card>
        )}

        <div className="grid gap-6">
          {testimonials.length === 0 ? (
            <Card className="p-8 text-center">
              <User className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Aucun témoignage pour le moment</p>
            </Card>
          ) : (
            testimonials.map((testimonial) => (
              <Card key={testimonial.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      {testimonial.image ? (
                        <img 
                          src={getImageUrl(testimonial.image)} 
                          alt={testimonial.name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">{testimonial.name}</h3>
                        <p className="text-sm text-gray-600 mb-3">{testimonial.role}</p>
                        <p className="text-gray-700 italic">"{testimonial.quote}"</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-xs px-2 py-1 rounded ${testimonial.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {testimonial.status === 'published' ? 'Publié' : 'Brouillon'}
                          </span>
                          <p className="text-xs text-gray-500">
                            Créé le {new Date(testimonial.createdAt).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(testimonial)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(testimonial.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
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
