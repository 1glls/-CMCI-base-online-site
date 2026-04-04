"use client"

import { useEffect, useRef, useState } from "react"
import { MapPin, Clock, Phone, Mail } from "lucide-react"
import { cn } from "@/lib/utils"
import { API_URL } from "@/lib/api"
import dynamic from "next/dynamic"

// Import dynamique de la carte pour éviter les erreurs SSR
const AssemblyMap = dynamic(() => import("./assembly-map"), { ssr: false })

interface Assembly {
  id: string
  city: string
  address: string
  latitude: number | null
  longitude: number | null
  schedule: string
  phone: string
  email: string
  status: string
}

export function Assemblies() {
  const [isVisible, setIsVisible] = useState(false)
  const [assemblies, setAssemblies] = useState<Assembly[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAssembly, setSelectedAssembly] = useState<Assembly | null>(null)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.2 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  // Charger les assemblées depuis l'API
  useEffect(() => {
    const fetchAssemblies = async () => {
      try {
        const response = await fetch(`${API_URL}/api/assemblies`)
        if (response.ok) {
          const data = await response.json()
          setAssemblies(data)
        }
      } catch (error) {
        console.error("Erreur lors du chargement des assemblées:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAssemblies()
  }, [])

  return (
    <section
      id="assemblees"
      ref={sectionRef}
      className="py-20 md:py-28 bg-background"
    >
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="text-accent font-semibold text-sm uppercase tracking-wider">
            Nous Trouver
          </span>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-primary mt-3 mb-4">
            Nos Assemblees en Belgique
          </h2>
          <div className="w-20 h-1 bg-accent mx-auto mb-6" />
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Rejoignez-nous dans l'une de nos assemblees pour vivre la communion
            fraternelle et grandir ensemble dans la foi.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Map */}
          <div className="space-y-4">
            <div
              className={cn(
                "rounded-2xl overflow-hidden shadow-lg h-[400px] lg:h-[500px] transition-all duration-700",
                isVisible
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 -translate-x-8"
              )}
            >
              <AssemblyMap 
                assemblies={assemblies}
                selectedAssembly={selectedAssembly}
                onSelectAssembly={setSelectedAssembly}
              />
            </div>
            {selectedAssembly && (
              <button
                onClick={() => setSelectedAssembly(null)}
                className={cn(
                  "w-full bg-accent text-accent-foreground hover:bg-accent/90 py-3 px-6 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2",
                  isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
                )}
              >
                <MapPin size={20} />
                Voir toutes nos assemblées
              </button>
            )}
          </div>

          {/* Assembly Cards */}
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-accent/30 scrollbar-track-transparent hover:scrollbar-thumb-accent/50">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Chargement des assemblées...</p>
              </div>
            ) : assemblies.length === 0 ? (
              <div className="text-center py-8">
                <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Aucune assemblée disponible pour le moment</p>
              </div>
            ) : (
              assemblies.map((assembly, index) => (
                <div
                  key={assembly.id}
                  onClick={() => setSelectedAssembly(assembly)}
                  className={cn(
                    "bg-card border rounded-xl p-6 hover:shadow-lg transition-all duration-500 hover:border-accent/50 group cursor-pointer",
                    isVisible
                      ? "opacity-100 translate-x-0"
                      : "opacity-0 translate-x-8",
                    selectedAssembly?.id === assembly.id && "border-accent border-2 shadow-lg"
                  )}
                  style={{
                    transitionDelay: isVisible ? `${index * 150}ms` : "0ms",
                  }}
                >
                  <div className="flex items-start gap-4">
                    {/* Location Icon */}
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                      <MapPin className="w-6 h-6 text-primary group-hover:text-accent transition-colors" />
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <h3 className="font-serif text-xl font-bold text-primary mb-2 group-hover:text-accent transition-colors">
                        CMCI {assembly.city}
                      </h3>
                      <p className="text-muted-foreground text-sm mb-3">
                        {assembly.address}
                      </p>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Clock size={14} className="text-accent" />
                          <span className="text-muted-foreground">
                            {assembly.schedule}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone size={14} className="text-accent" />
                          <a
                            href={`tel:${assembly.phone}`}
                            className="text-muted-foreground hover:text-primary transition-colors"
                          >
                            {assembly.phone}
                          </a>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Mail size={14} className="text-accent" />
                          <a
                            href={`mailto:${assembly.email}`}
                            className="text-muted-foreground hover:text-primary transition-colors"
                          >
                            {assembly.email}
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
