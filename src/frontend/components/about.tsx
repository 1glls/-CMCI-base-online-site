"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Church, Quote } from "lucide-react"
import { cn } from "@/lib/utils"
import { API_URL } from "@/lib/api"
import { useLanguage } from "@/contexts/LanguageContext"

const FOUNDATION_YEAR = 2011 // Année de fondation de la CMCI Belgique

export function About() {
  const [isVisible, setIsVisible] = useState(false)
  const [assemblyCount, setAssemblyCount] = useState(3) // Valeur par défaut
  const sectionRef = useRef<HTMLElement>(null)
  const { t } = useLanguage()

  // Calculer les années de présence
  const yearsOfPresence = new Date().getFullYear() - FOUNDATION_YEAR

  // Charger le nombre d'assemblées
  useEffect(() => {
    const fetchAssemblyCount = async () => {
      try {
        const response = await fetch(`${API_URL}/api/assemblies`)
        if (response.ok) {
          const data = await response.json()
          setAssemblyCount(data.length)
        }
      } catch (error) {
        console.error("Erreur lors du chargement des assemblées:", error)
      }
    }

    fetchAssemblyCount()
  }, [])

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

  return (
    <section
      id="apropos"
      ref={sectionRef}
      className="py-20 md:py-28 bg-background"
    >
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center max-w-6xl mx-auto">
          {/* Left Content */}
          <div
            className={cn(
              "transition-all duration-700",
              isVisible
                ? "opacity-100 translate-x-0"
                : "opacity-0 -translate-x-8"
            )}
          >
            <span className="text-accent font-semibold text-sm uppercase tracking-wider">
              {t('about.label')}
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-primary mt-3 mb-6">
              {t('about.title')}
            </h2>

            <div className="space-y-4 text-muted-foreground leading-relaxed mb-8">
              <p>{t('about.paragraph1')}</p>
              <p>{t('about.paragraph2')}</p>
              <p>{t('about.paragraph3')}</p>
            </div>

            {/* Quote */}
            <div className="bg-primary/5 border-l-4 border-accent p-6 rounded-r-lg mb-8">
              <Quote className="w-8 h-8 text-accent mb-3" />
              <p className="italic text-primary font-medium">
                {t('about.quote')}
              </p>
              <span className="text-sm text-muted-foreground mt-2 block">
                - {t('about.quoteAuthor')}
              </span>
            </div>

            <Button
              asChild
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
            >
              <a href="/#valeurs">{t('about.learnMore')}</a>
            </Button>
          </div>

          {/* Right Visual */}
          <div
            className={cn(
              "relative transition-all duration-700 delay-300",
              isVisible
                ? "opacity-100 translate-x-0"
                : "opacity-0 translate-x-8"
            )}
          >
            <div className="relative">
              {/* Main Visual Card */}
              <div className="bg-primary rounded-2xl p-12 md:p-16 text-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-accent rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent rounded-full translate-y-1/2 -translate-x-1/2" />
                </div>
                <div className="relative z-10">
                  <Church className="w-24 h-24 mx-auto text-accent mb-6" />
                  <h3 className="font-serif text-2xl md:text-3xl font-bold text-white mb-4">
                    {t('about.cmciBelgium')}
                  </h3>
                  <p className="text-white/80 text-lg">
                    {t('about.cmciFullName')}
                  </p>
                </div>
              </div>

              {/* Floating Stats */}
              <div className="absolute -bottom-6 -left-6 bg-accent text-accent-foreground rounded-xl p-6 shadow-xl">
                <div className="text-3xl font-bold font-serif">+{yearsOfPresence}</div>
                <div className="text-sm">{t('about.yearsPresence')}</div>
              </div>

              <div className="absolute -top-4 -right-4 bg-white rounded-xl p-5 shadow-xl border">
                <div className="text-2xl font-bold font-serif text-primary">
                  {assemblyCount}
                </div>
                <div className="text-sm text-muted-foreground">{t('about.assemblies')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
