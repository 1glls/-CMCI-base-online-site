"use client"

import { useEffect, useRef, useState } from "react"
import { Calendar, MapPin, Clock, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/contexts/LanguageContext"
import { API_URL, getImageUrl } from "@/lib/api"

interface Event {
  id: string
  title: string
  date: string
  time: string
  location: string
  description: string
  image: string | null
  status: string
  registrationUrl: string | null
  registrationButtonText: string | null
  exploreButtonText: string | null
  exploreUrl: string | null
}

export function Events() {
  const { t } = useLanguage()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)
  const [slidesPerView, setSlidesPerView] = useState(3)

  // Charger les événements depuis l'API
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        console.log("🔍 Fetching events from:", `${API_URL}/api/events`)
        const response = await fetch(`${API_URL}/api/events`)
        console.log("📡 Response status:", response.status)
        if (response.ok) {
          const data = await response.json()
          console.log("✅ Events loaded:", data.length, "events")
          setEvents(data)
        } else {
          console.error("❌ Failed to fetch events:", response.statusText)
        }
      } catch (error) {
        console.error("❌ Erreur lors du chargement des événements:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSlidesPerView(1)
      } else if (window.innerWidth < 1024) {
        setSlidesPerView(2)
      } else {
        setSlidesPerView(3)
      }
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          console.log("👁️ Section visible, affichage des événements")
          setIsVisible(true)
        }
      },
      { threshold: 0.1 } // Réduit le seuil pour déclencher plus tôt
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    // Force l'affichage après un délai si l'observer ne se déclenche pas
    const fallbackTimer = setTimeout(() => {
      setIsVisible(true)
    }, 1000)

    return () => {
      observer.disconnect()
      clearTimeout(fallbackTimer)
    }
  }, [])

  const maxIndex = Math.max(0, events.length - slidesPerView)

  const nextSlide = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, maxIndex))
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0))
  }

  // Debug: afficher les valeurs
  useEffect(() => {
    if (events.length > 0) {
      console.log("📊 Debug:", {
        eventsCount: events.length,
        slidesPerView,
        currentIndex,
        maxIndex,
        isVisible
      })
    }
  }, [events.length, slidesPerView, currentIndex, isVisible])

  if (loading) {
    return (
      <section id="evenements" className="py-20 md:py-28 bg-secondary">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">{t('events.loading')}</p>
        </div>
      </section>
    )
  }

  if (events.length === 0) {
    return (
      <section id="evenements" className="py-20 md:py-28 bg-secondary">
        <div className="container mx-auto px-4 text-center">
          <div>
            <span className="text-accent font-semibold text-sm uppercase tracking-wider">
              {t('events.label')}
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-primary mt-3 mb-2">
              {t('events.title')}
            </h2>
            <div className="w-20 h-1 bg-accent mx-auto mb-6" />
            <p className="text-muted-foreground">{t('events.noEvents')}</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section
      id="evenements"
      ref={sectionRef}
      className="py-20 md:py-28 bg-secondary"
    >
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div>
            <span className="text-accent font-semibold text-sm uppercase tracking-wider">
              {t('events.label')}
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-primary mt-3 mb-2">
              {t('events.title')}
            </h2>
            <div className="w-20 h-1 bg-accent" />
          </div>

          {/* Navigation Arrows */}
          <div className="flex gap-3">
            <button
              onClick={prevSlide}
              disabled={currentIndex === 0}
              className="p-3 rounded-full border border-primary/20 hover:bg-primary hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label={t("events.prevEvent")}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={nextSlide}
              disabled={currentIndex >= maxIndex}
              className="p-3 rounded-full border border-primary/20 hover:bg-primary hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label={t("events.nextEvent")}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Events Carousel */}
        <div className="overflow-hidden">
          <div
            className="flex gap-6 transition-transform duration-500 ease-out"
            style={{
              transform: `translateX(-${currentIndex * ((100 / slidesPerView))}%)`,
            }}
          >
            {events.map((event, index) => (
              <div
                key={event.id}
                className={cn(
                  "flex-shrink-0 transition-all duration-700",
                  slidesPerView === 1
                    ? "w-full"
                    : slidesPerView === 2
                      ? "w-[calc(50%-12px)]"
                      : "w-[calc(33.333%-16px)]",
                  isVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-8"
                )}
                style={{
                  transitionDelay: isVisible ? `${index * 150}ms` : "0ms",
                }}
              >
                <div className="bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group h-full flex flex-col">
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={getImageUrl(event.image, '/images/event-conference.jpg')}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Date Badge */}
                    <div className="absolute top-4 left-4 bg-accent text-accent-foreground px-4 py-2 rounded-lg font-bold text-sm">
                      {event.date}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="font-serif text-xl font-bold text-primary mb-3 group-hover:text-accent transition-colors">
                      {event.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4 leading-relaxed flex-1">
                      {event.description}
                    </p>

                    {/* Meta Info */}
                    <div className="space-y-2 mb-5">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock size={16} className="text-accent" />
                        <span>{event.time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin size={16} className="text-accent" />
                        <span>{event.location}</span>
                      </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex flex-col gap-2">
                      {event.registrationUrl && (
                        <Button 
                          className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                          onClick={() => window.open(event.registrationUrl!, '_blank', 'noopener,noreferrer')}
                        >
                          <ExternalLink size={16} className="mr-2" />
                          {event.registrationButtonText || t("events.register")}
                        </Button>
                      )}
                      <Button 
                        className={cn(
                          "w-full",
                          event.registrationUrl 
                            ? "bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30"
                            : "bg-primary text-primary-foreground hover:bg-primary/90"
                        )}
                        variant={event.registrationUrl ? "outline" : "default"}
                        onClick={() => {
                          if (event.exploreUrl) {
                            window.open(event.exploreUrl, '_blank', 'noopener,noreferrer')
                          } else {
                            const accueil = document.getElementById('accueil')
                            accueil?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                          }
                        }}
                      >
                        {event.exploreButtonText || "Explorer"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: maxIndex + 1 }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                index === currentIndex
                  ? "bg-accent w-6"
                  : "bg-primary/30 hover:bg-primary/50"
              )}
              aria-label={`Aller au groupe ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
