"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, MessageSquare, Image, Share2, Settings, LogOut, Home, MapPin, Mail, Church, ClipboardList, DatabaseBackup } from "lucide-react"
import { API_URL } from "@/lib/api"

export default function AdminDashboard() {
  const [admin, setAdmin] = useState<any>(null)
  const [stats, setStats] = useState({
    heroSlides: 0,
    events: 0,
    testimonials: 0,
    gallery: 0,
    pendingSocial: 0,
    assemblies: 0,
    newsletter: 0,
    ministries: 0,
    forms: 0,
  })
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("adminToken")
    if (!token) {
      router.push("/admin")
      return
    }

    const adminData = localStorage.getItem("adminData")
    if (adminData) {
      setAdmin(JSON.parse(adminData))
    }

    // Charger les statistiques
    fetchStats(token)
  }, [router])

  const fetchStats = async (token: string) => {
    try {
      const headers = {
        Authorization: `Bearer ${token}`,
      }

      const authFetch = async (url: string) => {
        const r = await fetch(url, { headers })
        if (r.status === 401) {
          localStorage.removeItem("adminToken")
          localStorage.removeItem("adminData")
          router.push("/admin")
          throw new Error("Session expirée")
        }
        return r.json()
      }

      const [heroSlides, events, testimonials, gallery, social, assemblies, newsletter, ministries, forms] = await Promise.all([
        authFetch(`${API_URL}/api/hero/all`),
        authFetch(`${API_URL}/api/events/all`),
        authFetch(`${API_URL}/api/testimonials/all`),
        authFetch(`${API_URL}/api/gallery/all`),
        authFetch(`${API_URL}/api/social-media/all?status=pending`),
        authFetch(`${API_URL}/api/assemblies/all`),
        authFetch(`${API_URL}/api/newsletter/stats`),
        authFetch(`${API_URL}/api/ministries/all`),
        authFetch(`${API_URL}/api/forms/all`).catch(() => []),
      ])

      setStats({
        heroSlides: Array.isArray(heroSlides) ? heroSlides.length : 0,
        events: Array.isArray(events) ? events.length : 0,
        testimonials: Array.isArray(testimonials) ? testimonials.length : 0,
        gallery: Array.isArray(gallery) ? gallery.length : 0,
        pendingSocial: Array.isArray(social) ? social.length : 0,
        assemblies: Array.isArray(assemblies) ? assemblies.length : 0,
        newsletter: newsletter?.active || 0,
        ministries: Array.isArray(ministries) ? ministries.length : 0,
        forms: Array.isArray(forms) ? forms.length : 0,
      })
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("adminToken")
    localStorage.removeItem("adminData")
    router.push("/admin")
  }

  if (!admin) return null

  const menuItems = [
    {
      title: "Section Hero",
      description: "Gérer les slides d'accueil",
      icon: Home,
      href: "/admin/hero",
      count: stats.heroSlides,
    },
    {
      title: "Événements",
      description: "Gérer les événements",
      icon: Calendar,
      href: "/admin/events",
      count: stats.events,
    },
    {
      title: "Témoignages",
      description: "Gérer les témoignages",
      icon: MessageSquare,
      href: "/admin/testimonials",
      count: stats.testimonials,
    },
    {
      title: "Galerie",
      description: "Gérer les images",
      icon: Image,
      href: "/admin/gallery",
      count: stats.gallery,
    },
    {
      title: "Assemblées",
      description: "Gérer les assemblées",
      icon: MapPin,
      href: "/admin/assemblies",
      count: stats.assemblies,
    },
    {
      title: "Ministères",
      description: "Gérer les ministères",
      icon: Church,
      href: "/admin/ministries",
      count: stats.ministries,
    },
    {
      title: "Newsletter",
      description: "Gérer les abonnés",
      icon: Mail,
      href: "/admin/newsletter",
      count: stats.newsletter,
    },
    {
      title: "Formulaires",
      description: "Créer et gérer les formulaires",
      icon: ClipboardList,
      href: "/admin/forms",
      count: stats.forms,
    },
    {
      title: "Réseaux Sociaux",
      description: "Valider les posts",
      icon: Share2,
      href: "/admin/social-media",
      count: stats.pendingSocial,
      badge: stats.pendingSocial > 0,
    },
    {
      title: "Paramètres",
      description: "Configuration",
      icon: Settings,
      href: "/admin/settings",
    },
    {
      title: "Sauvegardes",
      description: "Sauvegarder la base de données",
      icon: DatabaseBackup,
      href: "/admin/backup",
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin CMCI</h1>
            <p className="text-sm text-gray-500">Bienvenue, {admin.name}</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Déconnexion
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <item.icon className="h-8 w-8 text-blue-600" />
                    {item.count !== undefined && (
                      <div
                        className={`text-2xl font-bold ${
                          item.badge ? "text-red-600" : "text-gray-900"
                        }`}
                      >
                        {item.count}
                      </div>
                    )}
                  </div>
                  <CardTitle className="mt-2">{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
