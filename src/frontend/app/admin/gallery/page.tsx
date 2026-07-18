'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, Image as ImageIcon } from 'lucide-react';
import { API_URL, getImageUrl } from '@/lib/api';

interface GalleryImage {
  id: string;
  alt: string;
  src: string;
  category: string;
  status?: string;
  createdAt: string;
}

export default function GalleryPage() {
  const router = useRouter();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [formData, setFormData] = useState({
    alt: '',
    src: '',
    category: '',
    status: 'published'
  });


  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin');
      return;
    }
    fetchImages();
  }, [router]);

  const fetchImages = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/gallery/all`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch gallery images');
      const data = await response.json();
      setImages(data);
    } catch (error) {
      console.error('Error fetching gallery:', error);
      alert('Erreur lors du chargement de la galerie');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      const url = editingId
        ? `${API_URL}/api/gallery/${editingId}`
        : `${API_URL}/api/gallery`;
      
      const method = editingId ? 'PUT' : 'POST';
      
      // Use FormData if there's a file, otherwise JSON
      let body;
      let headers: HeadersInit = {
        'Authorization': `Bearer ${token}`
      };
      
      if (imageFile) {
        const formDataToSend = new FormData();
        formDataToSend.append('alt', formData.alt);
        formDataToSend.append('category', formData.category);
        formDataToSend.append('status', formData.status);
        formDataToSend.append('image', imageFile);
        body = formDataToSend;
      } else {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify({
          alt: formData.alt,
          src: formData.src,
          category: formData.category,
          status: formData.status
        });
      }
      
      const response = await fetch(url, {
        method,
        headers,
        body
      });

      if (!response.ok) throw new Error('Failed to save image');
      
      alert(editingId ? 'Image modifiée avec succès' : 'Image ajoutée avec succès');
      setShowForm(false);
      setEditingId(null);
      setImageFile(null);
      setImagePreview('');
      setFormData({ alt: '', src: '', category: '', status: 'published' });
      fetchImages();
    } catch (error) {
      console.error('Error saving image:', error);
      alert('Erreur lors de la sauvegarde de l\'image');
    }
  };

  const handleEdit = (image: GalleryImage) => {
    setFormData({
      alt: image.alt,
      src: image.src,
      category: image.category,
      status: image.status || 'published'
    });
    setEditingId(image.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette image ?')) return;
    
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/gallery/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete image');
      
      alert('Image supprimée avec succès');
      fetchImages();
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Erreur lors de la suppression de l\'image');
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
    setFormData({ alt: '', src: '', category: '', status: 'published' });
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
            <h1 className="text-3xl font-bold text-gray-900">Gestion de la Galerie</h1>
            <p className="text-gray-600 mt-2">Gérez les images affichées dans la galerie</p>
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
            Nouvelle Image
          </Button>
        )}

        {showForm && (
          <Card className="p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">
              {editingId ? 'Modifier l\'image' : 'Nouvelle image'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Description (alt text)</label>
                <Input
                  type="text"
                  value={formData.alt}
                  onChange={(e) => setFormData({ ...formData, alt: e.target.value })}
                  required
                  placeholder="Description de l'image"
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
                      value={formData.src}
                      onChange={(e) => setFormData({ ...formData, src: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                      disabled={!!imageFile}
                    />
                  </div>
                  {(imagePreview || formData.src) && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-600 mb-1">Aperçu:</p>
                      <img 
                        src={imagePreview || getImageUrl(formData.src)} 
                        alt="Preview" 
                        className="w-full max-w-md h-48 object-cover rounded-lg border"
                      />
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Catégorie</label>
                <Input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Événements, Assemblées, etc."
                  required
                />
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
                  {editingId ? 'Modifier' : 'Ajouter'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Annuler
                </Button>
              </div>
            </form>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.length === 0 ? (
            <Card className="p-8 text-center col-span-full">
              <ImageIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Aucune image dans la galerie</p>
            </Card>
          ) : (
            images.map((image) => (
              <Card key={image.id} className="overflow-hidden">
                <div className="aspect-video relative">
                  <img 
                    src={getImageUrl(image.src)} 
                    alt={image.alt}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-2">{image.alt}</h3>
                  <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mb-2">
                    {image.category}
                  </span>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-xs px-2 py-1 rounded ${image.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {image.status === 'published' ? 'Publié' : 'Brouillon'}
                    </span>
                    <p className="text-xs text-gray-500">
                      {new Date(image.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(image)}
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Modifier
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(image.id)}
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
