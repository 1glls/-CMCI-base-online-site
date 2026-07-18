"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/contexts/LanguageContext"
import { API_URL } from "@/lib/api"

interface HeroSlide {
  id: string
  title: string
  subtitle: string
  image: string | null
  imageMobile: string | null
  order: number
  eventId?: string | null
  buttonText?: string | null
  buttonUrl?: string | null
  linkedEvent?: {
    id: string
    title: string
    description: string
    image: string | null
    date: string
    time: string
    location: string
    registrationUrl?: string | null
    registrationButtonText?: string | null
  }
}

export function Hero() {
  const { t, language } = useLanguage()
  const [slides, setSlides] = useState<HeroSlide[]>([])
  const [currentSlide, setCurrentSlide] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSlidesAndEvents = async () => {
      try {
        // Charger les slides hero personnalisés
        const slidesResponse = await fetch(`${API_URL}/api/hero?lang=${language}`)
        const customSlides = await slidesResponse.json()

        console.log("✅ Hero slides chargées:", customSlides)
        
        // Les slides personnalisées peuvent maintenant contenir des événements liés
        // Pas besoin de combiner automatiquement - tout est géré via l'admin
        const allSlides = customSlides
        setSlides(allSlides)
      } catch (error) {
        console.error("Erreur lors du chargement des slides:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSlidesAndEvents()
  }, [language])

  useEffect(() => {
    if (slides.length === 0) return
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 8000)
    return () => clearInterval(interval)
  }, [slides.length])

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  if (loading || slides.length === 0) {
    return (
      <section id="accueil" className="relative h-screen min-h-[600px] overflow-hidden bg-primary">
        <div className="absolute inset-0 flex items-center justify-center text-white">
          <p>{t('ministries.loading')}</p>
        </div>
      </section>
    )
  }

  return (
    <section id="accueil" className="relative h-screen min-h-[600px] overflow-hidden bg-primary">
      {/* Slides */}
      {slides.map((slide, index) => {
        // Les images desktop/mobile sont toujours traitées côté backend
        // (que ce soit un upload direct ou une image d'événement lié)
        const desktopImageUrl = slide.image 
          ? (slide.image.startsWith('http') ? slide.image : `${API_URL}${slide.image}`)
          : '/images/hero-worship.jpg'
        
        const mobileImageUrl = slide.imageMobile
          ? `${API_URL}${slide.imageMobile}`
          : desktopImageUrl // Fallback vers desktop si pas de version mobile
        
        return (
          <div
            key={slide.id}
            className={cn(
              "absolute inset-0 transition-all duration-1000",
              index === currentSlide ? "opacity-100 z-10 visible" : "opacity-0 z-0 invisible"
            )}
          >
            <picture className="absolute inset-0 block w-full h-full">
              {/* Version mobile (portrait) pour écrans < 768px */}
              <source
                media="(max-width: 767px)"
                srcSet={mobileImageUrl}
              />
              {/* Version desktop (paysage) pour écrans >= 768px */}
              <source
                media="(min-width: 768px)"
                srcSet={desktopImageUrl}
              />
              <img
                src={desktopImageUrl}
                alt={slide.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </picture>
            {/* Overlay pour la lisibilité du texte */}
            <div className="absolute inset-0 bg-black/30" />
          </div>
        )
      })}

      {/* Content */}
      <div className="relative z-20 h-full flex flex-col items-center justify-center text-center text-white px-4">
        <div className="max-w-4xl mx-auto">
          {/* Titre et sous-titre dynamiques */}
          <div className="relative mb-16">
            {slides.map((slide, index) => (
              <div
                key={slide.id}
                className={cn(
                  "transition-all duration-700",
                  index === currentSlide
                    ? "opacity-100 translate-y-0 relative"
                    : "opacity-0 translate-y-8 absolute inset-0 pointer-events-none"
                )}
                style={{ display: index === currentSlide ? 'block' : 'none' }}
              >
                <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-balance animate-fade-in-up">
                  {slide.title}
                </h1>
                <p className="text-lg md:text-xl lg:text-2xl mb-8 opacity-90 animate-fade-in-up animation-delay-200">
                  {slide.subtitle}
                </p>
                {/* Bouton dynamique par slide */}
                {slide.buttonText && slide.buttonUrl && (
                  <div className="animate-fade-in-up animation-delay-300">
                    <Button
                      size="lg"
                      className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold text-base px-8"
                      onClick={() => window.open(slide.buttonUrl!, '_blank', 'noopener,noreferrer')}
                    >
                      <ExternalLink size={18} className="mr-2" />
                      {slide.buttonText}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Bible Verse */}
          <p className="italic text-base md:text-lg opacity-80 mb-10 max-w-2xl mx-auto animate-fade-in-up animation-delay-400">
            &laquo; Allez, faites de toutes les nations des disciples, les baptisant au nom du Pere, du Fils et du Saint-Esprit. &raquo;
            <span className="block mt-2 text-sm">- Matthieu 28:19-20</span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up animation-delay-600">
            <Button
              size="lg"
              className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold text-base px-8"
              onClick={() => {
                const element = document.getElementById('vision')
                element?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
            >
              {t('hero.discoverVision')}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-primary font-semibold text-base px-8 bg-transparent"
              onClick={() => {
                const element = document.getElementById('evenements')
                element?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
            >
              {t('hero.upcomingEvents')}
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-white/20 hover:bg-white/40 transition-colors text-white"
        aria-label={t("hero.prevSlide")}
      >
        <ChevronLeft size={24} />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-white/20 hover:bg-white/40 transition-colors text-white"
        aria-label={t("hero.nextSlide")}
      >
        <ChevronRight size={24} />
      </button>

      {/* Dots Navigation */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={cn(
              "w-3 h-3 rounded-full transition-all",
              index === currentSlide
                ? "bg-accent w-8"
                : "bg-white/50 hover:bg-white/80"
            )}
            aria-label={`${t("hero.goToSlide")} ${index + 1}`}
          />
        ))}
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 right-8 z-30 hidden md:block">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/80 rounded-full mt-2 animate-bounce" />
        </div>
      </div>
    </section>
  )
}
