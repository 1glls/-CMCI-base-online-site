"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { API_URL } from "@/lib/api"
import { CheckCircle2, Send, ArrowRight, ChevronRight, Loader2, AlertCircle } from "lucide-react"

interface FormField {
  id: string
  label: string
  type: string
  required: boolean
  placeholder?: string
  options?: string[]
}

interface FormData {
  id: string
  title: string
  description: string | null
  slug: string
  fields: FormField[]
  status: string
}

export default function PublicFormPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [form, setForm] = useState<FormData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [values, setValues] = useState<Record<string, any>>({})

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const response = await fetch(`${API_URL}/api/forms/public/${slug}`)
        if (response.ok) {
          const data = await response.json()
          setForm(data)
          // Initialize values
          const initial: Record<string, any> = {}
          data.fields.forEach((f: FormField) => {
            initial[f.id] = f.type === 'checkbox' ? [] : ''
          })
          setValues(initial)
        } else {
          setError("Ce formulaire n'existe pas ou n'est plus disponible.")
        }
      } catch {
        setError("Impossible de charger le formulaire.")
      } finally {
        setLoading(false)
      }
    }
    if (slug) fetchForm()
  }, [slug])

  const updateValue = (fieldId: string, value: any) => {
    setValues(prev => ({ ...prev, [fieldId]: value }))
    // Clear field error on change
    if (fieldErrors[fieldId]) {
      setFieldErrors(prev => {
        const copy = { ...prev }
        delete copy[fieldId]
        return copy
      })
    }
  }

  const toggleCheckbox = (fieldId: string, option: string) => {
    setValues(prev => {
      const current = prev[fieldId] || []
      if (current.includes(option)) {
        return { ...prev, [fieldId]: current.filter((o: string) => o !== option) }
      } else {
        return { ...prev, [fieldId]: [...current, option] }
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form) return

    // Validate
    const errors: Record<string, string> = {}
    form.fields.forEach(field => {
      if (field.required) {
        const val = values[field.id]
        if (!val || val === '' || (Array.isArray(val) && val.length === 0)) {
          errors[field.id] = 'Ce champ est obligatoire'
        }
      }
      if (field.type === 'email' && values[field.id]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(values[field.id])) {
          errors[field.id] = 'Adresse email invalide'
        }
      }
    })

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`${API_URL}/api/forms/public/${slug}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: values })
      })

      if (response.ok) {
        setSubmitted(true)
      } else {
        const err = await response.json()
        setError(err.error || "Erreur lors de l'envoi")
      }
    } catch {
      setError("Erreur réseau. Réessayez.")
    } finally {
      setSubmitting(false)
    }
  }

  // ===== LOADING STATE =====
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-10 w-10 text-blue-500 mx-auto mb-3" />
          <p className="text-gray-500">Chargement du formulaire...</p>
        </div>
      </div>
    )
  }

  // ===== ERROR STATE =====
  if (error && !form) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Formulaire introuvable</h1>
          <p className="text-gray-500 mb-6">{error}</p>
          <Button onClick={() => router.push('/')} className="bg-blue-600 hover:bg-blue-700">
            <ArrowRight className="mr-2 h-4 w-4" /> Visiter notre site
          </Button>
        </div>
      </div>
    )
  }

  // ===== SUCCESS STATE (Thank you + Site preview) =====
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
        {/* Success Header */}
        <div className="pt-16 pb-12 px-4 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6 animate-bounce">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Merci pour votre réponse !
          </h1>
          <p className="text-lg text-gray-600 max-w-lg mx-auto">
            Votre inscription a été enregistrée avec succès.
            Découvrez qui nous sommes et ce que nous faisons.
          </p>
        </div>

        {/* Site Preview Cards */}
        <div className="max-w-5xl mx-auto px-4 pb-16">
          <h2 className="text-center text-xl font-semibold text-gray-700 mb-8">
            Explorez CMCI Belgique
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card: Accueil */}
            <a href="/#accueil" className="group">
              <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group-hover:border-blue-200">
                <div className="h-32 bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
                  <span className="text-white text-4xl">🏠</span>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
                    Accueil
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Découvrez notre communauté et sa mission
                  </p>
                  <div className="mt-3 flex items-center text-blue-600 text-sm font-medium">
                    Visiter <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </a>

            {/* Card: Notre Vision */}
            <a href="/#vision" className="group">
              <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group-hover:border-purple-200">
                <div className="h-32 bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center">
                  <span className="text-white text-4xl">✨</span>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-lg text-gray-900 group-hover:text-purple-600 transition-colors">
                    Notre Vision
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Notre appel et notre engagement pour Christ
                  </p>
                  <div className="mt-3 flex items-center text-purple-600 text-sm font-medium">
                    Découvrir <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </a>

            {/* Card: Événements */}
            <a href="/#evenements" className="group">
              <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group-hover:border-orange-200">
                <div className="h-32 bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                  <span className="text-white text-4xl">📅</span>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-lg text-gray-900 group-hover:text-orange-600 transition-colors">
                    Événements
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Nos prochaines activités et rencontres
                  </p>
                  <div className="mt-3 flex items-center text-orange-600 text-sm font-medium">
                    Voir l&apos;agenda <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </a>

            {/* Card: Assemblées */}
            <a href="/#assemblees" className="group">
              <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group-hover:border-teal-200">
                <div className="h-32 bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center">
                  <span className="text-white text-4xl">📍</span>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-lg text-gray-900 group-hover:text-teal-600 transition-colors">
                    Nos Assemblées
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Trouvez une assemblée proche de chez vous
                  </p>
                  <div className="mt-3 flex items-center text-teal-600 text-sm font-medium">
                    Localiser <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </a>

            {/* Card: Ministères */}
            <a href="/#ministeres" className="group">
              <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group-hover:border-indigo-200">
                <div className="h-32 bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center">
                  <span className="text-white text-4xl">⛪</span>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-lg text-gray-900 group-hover:text-indigo-600 transition-colors">
                    Ministères
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Les différents services et départements
                  </p>
                  <div className="mt-3 flex items-center text-indigo-600 text-sm font-medium">
                    Explorer <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </a>

            {/* Card: Contact */}
            <a href="/#contact" className="group">
              <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group-hover:border-green-200">
                <div className="h-32 bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                  <span className="text-white text-4xl">💬</span>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-lg text-gray-900 group-hover:text-green-600 transition-colors">
                    Contact
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Prenez contact avec nous
                  </p>
                  <div className="mt-3 flex items-center text-green-600 text-sm font-medium">
                    Nous écrire <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </a>
          </div>

          {/* Main CTA */}
          <div className="text-center mt-10">
            <Button
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-lg px-10 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all"
              onClick={() => router.push('/')}
            >
              Explorer notre site <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ===== FORM STATE =====
  if (!form) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white">
        <div className="max-w-3xl mx-auto px-4 py-12 md:py-16 text-center">
          <a href="/" className="inline-block mb-6 opacity-80 hover:opacity-100 transition-opacity">
            <span className="text-sm font-medium tracking-wider uppercase">CMCI Belgique</span>
          </a>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">{form.title}</h1>
          {form.description && (
            <p className="text-blue-100 text-lg max-w-xl mx-auto">{form.description}</p>
          )}
        </div>
        {/* Wave separator */}
        <svg viewBox="0 0 1440 60" className="w-full h-8 md:h-12" preserveAspectRatio="none">
          <path
            d="M0,60 L0,30 Q360,0 720,30 Q1080,60 1440,30 L1440,60 Z"
            className="fill-blue-50"
          />
        </svg>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 -mt-2 pb-16">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {form.fields.map((field, index) => (
            <div
              key={field.id}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <Label className="text-base font-medium text-gray-800 mb-2 block">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>

              {/* TEXT */}
              {field.type === 'text' && (
                <Input
                  value={values[field.id] || ''}
                  onChange={(e) => updateValue(field.id, e.target.value)}
                  placeholder={field.placeholder || ''}
                  className="mt-1 h-11 rounded-lg border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                />
              )}

              {/* EMAIL */}
              {field.type === 'email' && (
                <Input
                  type="email"
                  value={values[field.id] || ''}
                  onChange={(e) => updateValue(field.id, e.target.value)}
                  placeholder={field.placeholder || 'exemple@email.com'}
                  className="mt-1 h-11 rounded-lg border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                />
              )}

              {/* PHONE */}
              {field.type === 'phone' && (
                <Input
                  type="tel"
                  value={values[field.id] || ''}
                  onChange={(e) => updateValue(field.id, e.target.value)}
                  placeholder={field.placeholder || '+32 XXX XX XX XX'}
                  className="mt-1 h-11 rounded-lg border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                />
              )}

              {/* NUMBER */}
              {field.type === 'number' && (
                <Input
                  type="number"
                  value={values[field.id] || ''}
                  onChange={(e) => updateValue(field.id, e.target.value)}
                  placeholder={field.placeholder || ''}
                  className="mt-1 h-11 rounded-lg border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                />
              )}

              {/* DATE */}
              {field.type === 'date' && (
                <Input
                  type="date"
                  value={values[field.id] || ''}
                  onChange={(e) => updateValue(field.id, e.target.value)}
                  className="mt-1 h-11 rounded-lg border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                />
              )}

              {/* TEXTAREA */}
              {field.type === 'textarea' && (
                <Textarea
                  value={values[field.id] || ''}
                  onChange={(e) => updateValue(field.id, e.target.value)}
                  placeholder={field.placeholder || ''}
                  rows={4}
                  className="mt-1 rounded-lg border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                />
              )}

              {/* SELECT */}
              {field.type === 'select' && (
                <select
                  value={values[field.id] || ''}
                  onChange={(e) => updateValue(field.id, e.target.value)}
                  className="mt-1 w-full h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
                >
                  <option value="">Choisir...</option>
                  {field.options?.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              )}

              {/* RADIO */}
              {field.type === 'radio' && (
                <div className="mt-2 space-y-2">
                  {field.options?.map((opt) => (
                    <label key={opt} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors">
                      <input
                        type="radio"
                        name={field.id}
                        value={opt}
                        checked={values[field.id] === opt}
                        onChange={() => updateValue(field.id, opt)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">{opt}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* CHECKBOX */}
              {field.type === 'checkbox' && (
                <div className="mt-2 space-y-2">
                  {field.options?.map((opt) => (
                    <label key={opt} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={(values[field.id] || []).includes(opt)}
                        onChange={() => toggleCheckbox(field.id, opt)}
                        className="w-4 h-4 rounded text-blue-600"
                      />
                      <span className="text-sm text-gray-700">{opt}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* Field error */}
              {fieldErrors[field.id] && (
                <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {fieldErrors[field.id]}
                </p>
              )}
            </div>
          ))}

          {/* Submit */}
          <div className="pt-4">
            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-5 w-5" /> Envoi en cours...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-5 w-5" /> Envoyer ma réponse
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-400">
          <a href="/" className="hover:text-blue-600 transition-colors">CMCI Belgique</a>
          {' • '}
          <span>Vos données sont sécurisées</span>
        </div>
      </div>
    </div>
  )
}
