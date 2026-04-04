"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Trash2, Edit, Plus, ArrowLeft, QrCode, Download } from "lucide-react"
import { QRCodeCanvas } from "qrcode.react"
import Link from "next/link"
import { API_URL } from "@/lib/api"

export default function AdminEvents() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<any>(null)
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    time: "",
    location: "",
    description: "",
    status: "published",
    registrationUrl: "",
    registrationButtonText: "",
    exploreButtonText: "",
    exploreUrl: "",
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [qrEvent, setQrEvent] = useState<any>(null)
  const [qrUrl, setQrUrl] = useState("")
  const qrRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const downloadQR = useCallback(() => {
    if (!qrRef.current || !qrEvent) return
    const canvas = qrRef.current.querySelector("canvas")
    if (!canvas) return
    const url = canvas.toDataURL("image/png")
    const link = document.createElement("a")
    link.download = `qr-${qrEvent.title.replace(/[^a-zA-Z0-9]/g, "-")}.png`
    link.href = url
    link.click()
  }, [qrEvent])

  const openQrDialog = (event: any) => {
    setQrEvent(event)
    setQrUrl(event.registrationUrl || "")
  }

  useEffect(() => {
    const token = localStorage.getItem("adminToken")
    if (!token) {
      router.push("/admin")
      return
    }
    fetchEvents(token)
  }, [router])

  const fetchEvents = async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/api/events/all`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      setEvents(data)
    } catch (error) {
      console.error("Error fetching events:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem("adminToken")
    if (!token) return

    const formDataToSend = new FormData()
    Object.entries(formData).forEach(([key, value]) => {
      formDataToSend.append(key, value)
    })
    if (imageFile) {
      formDataToSend.append("image", imageFile)
    }

    try {
      const url = editingEvent
        ? `${API_URL}/api/events/${editingEvent.id}`
        : `${API_URL}/api/events`
      const method = editingEvent ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: formDataToSend,
      })

      if (response.ok) {
        fetchEvents(token)
        setShowForm(false)
        setEditingEvent(null)
        resetForm()
      }
    } catch (error) {
      console.error("Error saving event:", error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet événement ?")) return

    const token = localStorage.getItem("adminToken")
    if (!token) return

    try {
      await fetch(`${API_URL}/api/events/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      fetchEvents(token)
    } catch (error) {
      console.error("Error deleting event:", error)
    }
  }

  const handleEdit = (event: any) => {
    setEditingEvent(event)
    setFormData({
      title: event.title,
      date: event.date,
      time: event.time,
      location: event.location,
      description: event.description,
      status: event.status,
      registrationUrl: event.registrationUrl || "",
      registrationButtonText: event.registrationButtonText || "",
      exploreButtonText: event.exploreButtonText || "",
      exploreUrl: event.exploreUrl || "",
    })
    setShowForm(true)
  }

  const resetForm = () => {
    setFormData({
      title: "",
      date: "",
      time: "",
      location: "",
      description: "",
      status: "published",
      registrationUrl: "",
      registrationButtonText: "",
      exploreButtonText: "",
      exploreUrl: "",
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
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Événements</h1>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvel événement
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>
                {editingEvent ? "Modifier l'événement" : "Nouvel événement"}
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="time">Heure</Label>
                    <Input
                      id="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="location">Lieu</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="image">Image</Label>
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  />
                </div>
                {/* Bouton d'inscription (optionnel) */}
                <div className="border-t pt-4 mt-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Bouton d'inscription (optionnel)</h3>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="registrationUrl">URL d'inscription (Google Form)</Label>
                      <Input
                        id="registrationUrl"
                        type="url"
                        placeholder="https://docs.google.com/forms/..."
                        value={formData.registrationUrl}
                        onChange={(e) => setFormData({ ...formData, registrationUrl: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Laissez vide si aucune inscription n'est nécessaire
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="registrationButtonText">Texte du bouton</Label>
                      <Input
                        id="registrationButtonText"
                        placeholder="S'inscrire (par défaut)"
                        value={formData.registrationButtonText}
                        onChange={(e) => setFormData({ ...formData, registrationButtonText: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                {/* Bouton Explorer (éditable) */}
                <div className="border-t pt-4 mt-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Bouton Explorer (par défaut : retour à l'accueil)</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="exploreButtonText">Texte du bouton</Label>
                      <Input
                        id="exploreButtonText"
                        placeholder="Explorer (par défaut)"
                        value={formData.exploreButtonText}
                        onChange={(e) => setFormData({ ...formData, exploreButtonText: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="exploreUrl">URL personnalisée</Label>
                      <Input
                        id="exploreUrl"
                        type="url"
                        placeholder="Laisser vide → retour à l'accueil"
                        value={formData.exploreUrl}
                        onChange={(e) => setFormData({ ...formData, exploreUrl: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Enregistrer</Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false)
                      setEditingEvent(null)
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Card key={event.id}>
              {event.image && (
                <div className="relative h-48 w-full overflow-hidden">
                  <img
                    src={`${API_URL}${event.image}`}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-lg">{event.title}</CardTitle>
                <p className="text-sm text-gray-500">
                  {event.date} • {event.time}
                </p>
                <p className="text-sm text-gray-500">{event.location}</p>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4 line-clamp-3">{event.description}</p>
                {event.registrationUrl && (
                  <div className="mb-3 p-2 bg-green-50 rounded text-sm text-green-700">
                    📝 Inscription: {event.registrationButtonText || "S'inscrire"}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(event)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openQrDialog(event)}
                    title="Générer un QR Code"
                  >
                    <QrCode className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(event.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* QR Code Dialog */}
        <Dialog open={!!qrEvent} onOpenChange={(open) => !open && setQrEvent(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>QR Code — {qrEvent?.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="qrUrl">URL du QR Code</Label>
                <Input
                  id="qrUrl"
                  type="url"
                  placeholder="https://..."
                  value={qrUrl}
                  onChange={(e) => setQrUrl(e.target.value)}
                />
                {qrEvent?.registrationUrl && qrUrl !== qrEvent.registrationUrl && (
                  <button
                    type="button"
                    className="text-xs text-blue-600 hover:underline mt-1"
                    onClick={() => setQrUrl(qrEvent.registrationUrl)}
                  >
                    Utiliser l'URL d'inscription
                  </button>
                )}
              </div>
              {qrUrl && (
                <div className="flex flex-col items-center gap-4">
                  <div ref={qrRef} className="bg-white p-4 rounded-lg">
                    <QRCodeCanvas
                      value={qrUrl}
                      size={256}
                      level="H"
                      includeMargin
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center break-all max-w-[280px]">
                    {qrUrl}
                  </p>
                  <Button onClick={downloadQR} className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Télécharger le QR Code
                  </Button>
                </div>
              )}
              {!qrUrl && (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Entrez une URL pour générer le QR Code
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
