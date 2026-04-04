"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Trash2, Edit, Plus, ArrowLeft, MoveUp, MoveDown } from "lucide-react"
import Link from "next/link"
import { API_URL } from "@/lib/api"

export default function AdminHeroSlides() {
  const [slides, setSlides] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingSlide, setEditingSlide] = useState<any>(null)
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    order: 0,
    status: "published",
    eventId: "",
    buttonText: "",
    buttonUrl: "",
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("adminToken")
    if (!token) {
      router.push("/admin")
      return
    }
    fetchSlides(token)
    fetchEvents(token)
  }, [router])

  const fetchSlides = async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/api/hero/all`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      setSlides(data)
    } catch (error) {
      console.error("Error fetching hero slides:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchEvents = async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/api/events/all`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      setEvents(data)
    } catch (error) {
      console.error("Error fetching events:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem("adminToken")
    if (!token) return

    const formDataToSend = new FormData()
    Object.entries(formData).forEach(([key, value]) => {
      formDataToSend.append(key, value.toString())
    })
    if (imageFile) {
      formDataToSend.append("image", imageFile)
    }

    try {
      const url = editingSlide
        ? `${API_URL}/api/hero/${editingSlide.id}`
        : `${API_URL}/api/hero`
      const method = editingSlide ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: formDataToSend,
      })

      if (response.ok) {
        fetchSlides(token)
        setShowForm(false)
        setEditingSlide(null)
        resetForm()
      }
    } catch (error) {
      console.error("Error saving hero slide:", error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce slide ?")) return

    const token = localStorage.getItem("adminToken")
    if (!token) return

    try {
      await fetch(`${API_URL}/api/hero/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      fetchSlides(token)
    } catch (error) {
      console.error("Error deleting hero slide:", error)
    }
  }

  const handleEdit = (slide: any) => {
    setEditingSlide(slide)
    setFormData({
      title: slide.title,
      subtitle: slide.subtitle,
      order: slide.order,
      status: slide.status,
      eventId: slide.eventId || "",
      buttonText: slide.buttonText || "",
      buttonUrl: slide.buttonUrl || "",
    })
    setShowForm(true)
  }

  const resetForm = () => {
    setFormData({
      title: "",
      subtitle: "",
      order: 0,
      status: "published",
      eventId: "",
      buttonText: "",
      buttonUrl: "",
    })
    setImageFile(null)
  }

  if (loading) return <div className="p-8">Chargement...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Slides Hero</h1>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau slide
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>
                {editingSlide ? "Modifier le slide" : "Nouveau slide"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Titre</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="subtitle">Sous-titre</Label>
                  <Textarea
                    id="subtitle"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    rows={2}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="order">Ordre d'affichage</Label>
                  <Input
                    id="order"
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="eventId">Lier un événement (optionnel)</Label>
                  <select
                    id="eventId"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={formData.eventId}
                    onChange={(e) => setFormData({ ...formData, eventId: e.target.value })}
                  >
                    <option value="">Aucun événement</option>
                    {events.map((event) => (
                      <option key={event.id} value={event.id}>
                        {event.title} - {event.date}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Si un événement est lié, le titre/sous-titre seront automatiquement remplacés par les infos de l'événement
                  </p>
                </div>
                <div>
                  <Label htmlFor="image">Image de fond</Label>
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  />
                </div>
                {/* Bouton personnalisé (optionnel) */}
                <div className="border-t pt-4 mt-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Bouton personnalisé (optionnel)</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="buttonText">Texte du bouton</Label>
                      <Input
                        id="buttonText"
                        placeholder="Ex: S'inscrire, En savoir plus..."
                        value={formData.buttonText}
                        onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="buttonUrl">URL du bouton</Label>
                      <Input
                        id="buttonUrl"
                        type="url"
                        placeholder="https://docs.google.com/forms/..."
                        value={formData.buttonUrl}
                        onChange={(e) => setFormData({ ...formData, buttonUrl: e.target.value })}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ajoutez un bouton d'action sur le slide (inscription, lien externe, etc.). Si un événement lié a une URL d'inscription, elle sera utilisée automatiquement.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Enregistrer</Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false)
                      setEditingSlide(null)
                      resetForm()
                    }}
                  >
                    Annuler
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-6">
          {slides.map((slide) => (
            <Card key={slide.id}>
              <div className="flex">
                {slide.image && (
                  <div className="w-64 h-40 flex-shrink-0 overflow-hidden">
                    <img
                      src={`${API_URL}${slide.image}`}
                      alt={slide.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span>{slide.title}</span>
                      <span className="text-sm font-normal text-gray-500">
                        Ordre: {slide.order}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-2">{slide.subtitle}</p>
                    {slide.eventId && (
                      <div className="mb-3 p-2 bg-blue-50 rounded text-sm text-blue-700">
                        🔗 Lié à un événement
                      </div>
                    )}
                    {slide.buttonText && slide.buttonUrl && (
                      <div className="mb-3 p-2 bg-green-50 rounded text-sm text-green-700">
                        🔘 Bouton: {slide.buttonText}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(slide)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(slide.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
