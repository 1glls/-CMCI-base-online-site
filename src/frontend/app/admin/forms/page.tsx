"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Trash2, Edit, Plus, ArrowLeft, Eye, Copy, GripVertical, ChevronDown, ChevronUp, FileText, ExternalLink, Download } from "lucide-react"
import Link from "next/link"
import { API_URL } from "@/lib/api"

interface FormField {
  id: string
  label: string
  type: "text" | "email" | "phone" | "number" | "date" | "textarea" | "select" | "radio" | "checkbox"
  required: boolean
  placeholder?: string
  options?: string[] // Pour select, radio, checkbox
}

interface Form {
  id: string
  title: string
  description: string | null
  slug: string
  fields: string
  googleSheetId: string | null
  googleSheetUrl: string | null
  status: string
  submitCount: number
  createdAt: string
  _count?: { submissions: number }
}

const FIELD_TYPES = [
  { value: "text", label: "Texte court" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Téléphone" },
  { value: "number", label: "Nombre" },
  { value: "date", label: "Date" },
  { value: "textarea", label: "Texte long" },
  { value: "select", label: "Liste déroulante" },
  { value: "radio", label: "Choix unique" },
  { value: "checkbox", label: "Choix multiple" },
]

function generateId() {
  return 'field_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7)
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 60)
}

export default function AdminForms() {
  const [forms, setForms] = useState<Form[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingForm, setEditingForm] = useState<Form | null>(null)
  const [viewingSubmissions, setViewingSubmissions] = useState<string | null>(null)
  const [submissions, setSubmissions] = useState<any[]>([])

  // Form builder state
  const [formTitle, setFormTitle] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formSlug, setFormSlug] = useState("")
  const [formStatus, setFormStatus] = useState("published")
  const [googleSheetId, setGoogleSheetId] = useState("")
  const [googleSheetUrl, setGoogleSheetUrl] = useState("")
  const [fields, setFields] = useState<FormField[]>([])
  const [autoSlug, setAutoSlug] = useState(true)

  // Field editor
  const [editingFieldIndex, setEditingFieldIndex] = useState<number | null>(null)

  const router = useRouter()
  const frontendUrl = typeof window !== 'undefined' ? window.location.origin : ''

  useEffect(() => {
    const token = localStorage.getItem("adminToken")
    if (!token) {
      router.push("/admin")
      return
    }
    fetchForms(token)
  }, [router])

  const fetchForms = async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/api/forms/all`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      setForms(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error fetching forms:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSubmissions = async (formId: string) => {
    const token = localStorage.getItem("adminToken")
    if (!token) return
    try {
      const response = await fetch(`${API_URL}/api/forms/${formId}/submissions`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      setSubmissions(Array.isArray(data) ? data : [])
      setViewingSubmissions(formId)
    } catch (error) {
      console.error("Error fetching submissions:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem("adminToken")
    if (!token) return

    if (fields.length === 0) {
      alert("Ajoutez au moins un champ au formulaire")
      return
    }

    const body = {
      title: formTitle,
      description: formDescription || null,
      slug: formSlug,
      fields,
      googleSheetId: googleSheetId || null,
      googleSheetUrl: googleSheetUrl || null,
      status: formStatus,
    }

    try {
      const url = editingForm
        ? `${API_URL}/api/forms/${editingForm.id}`
        : `${API_URL}/api/forms`
      const method = editingForm ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        fetchForms(token)
        resetForm()
        setShowForm(false)
        setEditingForm(null)
      } else {
        const err = await response.json()
        alert(err.error || "Erreur lors de la sauvegarde")
      }
    } catch (error) {
      console.error("Error saving form:", error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce formulaire et toutes ses réponses ?")) return
    const token = localStorage.getItem("adminToken")
    if (!token) return

    try {
      await fetch(`${API_URL}/api/forms/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      fetchForms(token)
    } catch (error) {
      console.error("Error deleting form:", error)
    }
  }

  const handleEdit = (form: Form) => {
    setEditingForm(form)
    setFormTitle(form.title)
    setFormDescription(form.description || "")
    setFormSlug(form.slug)
    setFormStatus(form.status)
    setGoogleSheetId(form.googleSheetId || "")
    setGoogleSheetUrl(form.googleSheetUrl || "")
    setFields(JSON.parse(form.fields))
    setAutoSlug(false)
    setShowForm(true)
  }

  const resetForm = () => {
    setFormTitle("")
    setFormDescription("")
    setFormSlug("")
    setFormStatus("published")
    setGoogleSheetId("")
    setGoogleSheetUrl("")
    setFields([])
    setAutoSlug(true)
    setEditingFieldIndex(null)
  }

  // Field management
  const addField = () => {
    const newField: FormField = {
      id: generateId(),
      label: "",
      type: "text",
      required: false,
      placeholder: "",
    }
    setFields([...fields, newField])
    setEditingFieldIndex(fields.length)
  }

  const updateField = (index: number, updates: Partial<FormField>) => {
    const updated = [...fields]
    updated[index] = { ...updated[index], ...updates }
    setFields(updated)
  }

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index))
    setEditingFieldIndex(null)
  }

  const moveField = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= fields.length) return
    const updated = [...fields]
    ;[updated[index], updated[newIndex]] = [updated[newIndex], updated[index]]
    setFields(updated)
    setEditingFieldIndex(newIndex)
  }

  const exportSubmissionsCSV = (formId: string) => {
    const form = forms.find(f => f.id === formId)
    if (!form || submissions.length === 0) return

    const formFields: FormField[] = JSON.parse(form.fields)
    const headers = ['Date', ...formFields.map(f => f.label)]
    
    const rows = submissions.map(sub => {
      const data = JSON.parse(sub.data)
      return [
        new Date(sub.createdAt).toLocaleString('fr-BE'),
        ...formFields.map(f => {
          const val = data[f.id] || ''
          return Array.isArray(val) ? val.join('; ') : String(val)
        })
      ]
    })

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${form.slug}-reponses.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <div className="p-8">Chargement...</div>

  // Viewing submissions
  if (viewingSubmissions) {
    const form = forms.find(f => f.id === viewingSubmissions)
    const formFields: FormField[] = form ? JSON.parse(form.fields) : []

    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => setViewingSubmissions(null)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Réponses : {form?.title}</h1>
                <p className="text-sm text-gray-500">{submissions.length} réponse(s)</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => exportSubmissionsCSV(viewingSubmissions)}>
              <Download className="mr-2 h-4 w-4" />
              Exporter CSV
            </Button>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {submissions.length === 0 ? (
            <p className="text-center text-gray-500 py-12">Aucune réponse pour le moment</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded-lg shadow">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Date</th>
                    {formFields.map(f => (
                      <th key={f.id} className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                        {f.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {submissions.map(sub => {
                    const data = JSON.parse(sub.data)
                    return (
                      <tr key={sub.id} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {new Date(sub.createdAt).toLocaleString('fr-BE')}
                        </td>
                        {formFields.map(f => (
                          <td key={f.id} className="px-4 py-3 text-sm">
                            {Array.isArray(data[f.id]) ? data[f.id].join(', ') : (data[f.id] || '-')}
                          </td>
                        ))}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    )
  }

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
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Formulaires</h1>
          </div>
          <Button onClick={() => { resetForm(); setShowForm(!showForm); setEditingForm(null); }}>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau formulaire
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>
                {editingForm ? "Modifier le formulaire" : "Nouveau formulaire"}
              </CardTitle>
              <CardDescription>
                Construisez votre formulaire champ par champ
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Infos de base */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="formTitle">Titre du formulaire *</Label>
                    <Input
                      id="formTitle"
                      value={formTitle}
                      onChange={(e) => {
                        setFormTitle(e.target.value)
                        if (autoSlug) setFormSlug(slugify(e.target.value))
                      }}
                      placeholder="Ex: Inscription Retraite 2026"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="formSlug">Slug (URL) *</Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        id="formSlug"
                        value={formSlug}
                        onChange={(e) => { setFormSlug(e.target.value); setAutoSlug(false); }}
                        placeholder="inscription-retraite-2026"
                        required
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      URL : {frontendUrl}/formulaires/{formSlug || '...'}
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="formDesc">Description</Label>
                  <Textarea
                    id="formDesc"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Description affichée en haut du formulaire..."
                    rows={2}
                  />
                </div>

                {/* Google Sheets */}
                <div className="border rounded-lg p-4 bg-green-50/50">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z" fill="#0F9D58"/>
                      <path d="M7 7h4v4H7zm0 6h4v4H7zm6-6h4v4h-4zm6 6h-4v4h4z" fill="#0F9D58" opacity="0.5"/>
                    </svg>
                    Google Sheets (optionnel)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="sheetId" className="text-xs">ID du Spreadsheet</Label>
                      <Input
                        id="sheetId"
                        value={googleSheetId}
                        onChange={(e) => setGoogleSheetId(e.target.value)}
                        placeholder="1BxiMVs0XRA5nFMdKvBd..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="sheetUrl" className="text-xs">URL du Sheet (référence)</Label>
                      <Input
                        id="sheetUrl"
                        value={googleSheetUrl}
                        onChange={(e) => setGoogleSheetUrl(e.target.value)}
                        placeholder="https://docs.google.com/spreadsheets/d/..."
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Les réponses seront sauvegardées dans la DB + envoyées au Google Sheet. 
                    Partagez le Sheet avec le compte de service en éditeur.
                  </p>
                </div>

                {/* Statut */}
                <div>
                  <Label>Statut</Label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                  >
                    <option value="published">Publié (accepte les réponses)</option>
                    <option value="draft">Brouillon (non visible)</option>
                    <option value="closed">Fermé (visible mais n&apos;accepte plus)</option>
                  </select>
                </div>

                {/* FIELD BUILDER */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Champs du formulaire</h3>
                    <Button type="button" variant="outline" size="sm" onClick={addField}>
                      <Plus className="mr-1 h-4 w-4" /> Ajouter un champ
                    </Button>
                  </div>

                  {fields.length === 0 && (
                    <div className="text-center py-8 text-gray-400 border-2 border-dashed rounded-lg">
                      <FileText className="mx-auto h-10 w-10 mb-2 opacity-50" />
                      <p>Aucun champ. Cliquez sur &quot;Ajouter un champ&quot; pour commencer.</p>
                    </div>
                  )}

                  <div className="space-y-3">
                    {fields.map((field, index) => (
                      <div
                        key={field.id}
                        className={`border rounded-lg p-3 transition-colors ${
                          editingFieldIndex === index ? 'border-blue-400 bg-blue-50/50' : 'bg-white'
                        }`}
                      >
                        {/* Field header */}
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium truncate block">
                              {field.label || "(Sans nom)"}
                            </span>
                            <span className="text-xs text-gray-400">
                              {FIELD_TYPES.find(t => t.value === field.type)?.label}
                              {field.required && ' • Obligatoire'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7"
                              onClick={() => moveField(index, -1)} disabled={index === 0}>
                              <ChevronUp className="h-3 w-3" />
                            </Button>
                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7"
                              onClick={() => moveField(index, 1)} disabled={index === fields.length - 1}>
                              <ChevronDown className="h-3 w-3" />
                            </Button>
                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7"
                              onClick={() => setEditingFieldIndex(editingFieldIndex === index ? null : index)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700"
                              onClick={() => removeField(index)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        {/* Field editor (expanded) */}
                        {editingFieldIndex === index && (
                          <div className="mt-3 pt-3 border-t space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div>
                                <Label className="text-xs">Label *</Label>
                                <Input
                                  value={field.label}
                                  onChange={(e) => updateField(index, { label: e.target.value })}
                                  placeholder="Ex: Nom complet"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Type</Label>
                                <select
                                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                  value={field.type}
                                  onChange={(e) => {
                                    const type = e.target.value as FormField['type']
                                    const updates: Partial<FormField> = { type }
                                    if (['select', 'radio', 'checkbox'].includes(type)) {
                                      updates.options = field.options || ['Option 1', 'Option 2']
                                    }
                                    updateField(index, updates)
                                  }}
                                >
                                  {FIELD_TYPES.map(t => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <Label className="text-xs">Placeholder</Label>
                                <Input
                                  value={field.placeholder || ""}
                                  onChange={(e) => updateField(index, { placeholder: e.target.value })}
                                  placeholder="Texte indicatif..."
                                />
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id={`req-${field.id}`}
                                checked={field.required}
                                onChange={(e) => updateField(index, { required: e.target.checked })}
                                className="rounded"
                              />
                              <Label htmlFor={`req-${field.id}`} className="text-xs">Champ obligatoire</Label>
                            </div>

                            {/* Options for select, radio, checkbox */}
                            {['select', 'radio', 'checkbox'].includes(field.type) && (
                              <div>
                                <Label className="text-xs">Options (une par ligne)</Label>
                                <Textarea
                                  value={(field.options || []).join('\n')}
                                  onChange={(e) => updateField(index, { 
                                    options: e.target.value.split('\n').filter(o => o.trim()) 
                                  })}
                                  rows={3}
                                  placeholder="Option 1&#10;Option 2&#10;Option 3"
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button type="submit">
                    {editingForm ? "Mettre à jour" : "Créer le formulaire"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => {
                    setShowForm(false)
                    setEditingForm(null)
                    resetForm()
                  }}>
                    Annuler
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Forms list */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forms.map((form) => {
            const fieldCount = JSON.parse(form.fields).length
            return (
              <Card key={form.id} className="relative">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{form.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {fieldCount} champ(s) • {form._count?.submissions || form.submitCount} réponse(s)
                      </CardDescription>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      form.status === 'published' ? 'bg-green-100 text-green-700' :
                      form.status === 'closed' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {form.status === 'published' ? 'Publié' : form.status === 'closed' ? 'Fermé' : 'Brouillon'}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  {form.description && (
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">{form.description}</p>
                  )}
                  
                  <div className="text-xs text-gray-400 mb-3">
                    <p>URL : /formulaires/{form.slug}</p>
                    {form.googleSheetId && (
                      <p className="text-green-600 mt-1">✓ Google Sheets connecté</p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(form)}>
                      <Edit className="h-3 w-3 mr-1" /> Modifier
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => fetchSubmissions(form.id)}>
                      <Eye className="h-3 w-3 mr-1" /> Réponses
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => {
                      const url = `${frontendUrl}/formulaires/${form.slug}`
                      navigator.clipboard.writeText(url)
                      alert("Lien copié !")
                    }}>
                      <Copy className="h-3 w-3 mr-1" /> Lien
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <a href={`/formulaires/${form.slug}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3 mr-1" /> Voir
                      </a>
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(form.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {forms.length === 0 && !showForm && (
          <div className="text-center py-12 text-gray-500">
            <FileText className="mx-auto h-12 w-12 mb-3 opacity-30" />
            <p className="text-lg">Aucun formulaire créé</p>
            <p className="text-sm">Cliquez sur &quot;Nouveau formulaire&quot; pour commencer</p>
          </div>
        )}
      </main>
    </div>
  )
}
