"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Quote } from "lucide-react"
import { cn } from "@/lib/utils"
import { API_URL, getImageUrl } from "@/lib/api"

interface Testimonial {
  id: string;
  name: string;
  role: string;
  image?: string;
  quote: string;
}

export function Testimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)


  // Fetch testimonials from backend
  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const response = await fetch(`${API_URL}/api/testimonials`);
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            setTestimonials(data);
          }
        }
      } catch (error) {
        console.error('Error fetching testimonials:', error);
        // Aucun contenu de repli : mieux vaut ne rien afficher qu'un faux temoignage
      } finally {
        setLoading(false);
      }
    };

    fetchTestimonials();
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

  const nextTestimonial = () => {
    if (testimonials.length === 0) return
    setCurrentIndex((prev) => (prev + 1) % testimonials.length)
  }

  const prevTestimonial = () => {
    if (testimonials.length === 0) return
    setCurrentIndex(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length
    )
  }

  return (
    <section
      ref={sectionRef}
      className="py-20 md:py-28 bg-primary relative overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5">
        <Quote className="absolute top-10 left-10 w-48 h-48 text-white" />
        <Quote className="absolute bottom-10 right-10 w-64 h-64 text-white rotate-180" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="text-accent font-semibold text-sm uppercase tracking-wider">
            Temoignages
          </span>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mt-3 mb-4">
            Ce que disent nos membres
          </h2>
          <div className="w-20 h-1 bg-accent mx-auto" />
        </div>

        {/* Etats vides : ni squelette trompeur, ni faux contenu */}
        {loading && (
          <p className="text-center text-white/70">Chargement des temoignages...</p>
        )}

        {!loading && testimonials.length === 0 && (
          <p className="text-center text-white/70">
            Aucun temoignage disponible pour le moment.
          </p>
        )}

        {/* Testimonial Slider */}
        {!loading && testimonials.length > 0 && (
        <div
          className={cn(
            "max-w-4xl mx-auto transition-all duration-700",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
        >
          <div className="relative">
            {testimonials.map((testimonial, index) => (
              <div
                key={testimonial.id}
                className={cn(
                  "transition-all duration-500 text-center",
                  index === currentIndex
                    ? "opacity-100 visible"
                    : "opacity-0 invisible absolute inset-0"
                )}
              >
                {/* Quote */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 md:p-10 mb-8">
                  <Quote className="w-10 h-10 text-accent mx-auto mb-6" />
                  <p className="text-white text-lg md:text-xl leading-relaxed italic">
                    &laquo; {testimonial.quote} &raquo;
                  </p>
                </div>

                {/* Person Info */}
                <div className="flex items-center justify-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-accent">
                    <Image
                      src={getImageUrl(testimonial.image)}
                      alt={testimonial.name}
                      width={64}
                      height={64}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <div className="text-left">
                    <h4 className="font-serif font-bold text-white text-lg">
                      {testimonial.name}
                    </h4>
                    <p className="text-white/70 text-sm">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}

            {/* Navigation */}
            <div className="flex justify-center items-center gap-6 mt-10">
              <button
                onClick={prevTestimonial}
                className="p-3 rounded-full border border-white/30 hover:bg-white/20 transition-colors text-white"
                aria-label="Temoignage precedent"
              >
                <ChevronLeft size={20} />
              </button>

              {/* Dots */}
              <div className="flex gap-3">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all",
                      index === currentIndex
                        ? "bg-accent w-6"
                        : "bg-white/40 hover:bg-white/60"
                    )}
                    aria-label={`Aller au temoignage ${index + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={nextTestimonial}
                className="p-3 rounded-full border border-white/30 hover:bg-white/20 transition-colors text-white"
                aria-label="Temoignage suivant"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
        )}
      </div>
    </section>
  )
}
