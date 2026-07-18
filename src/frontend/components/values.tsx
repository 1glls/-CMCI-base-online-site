"use client"

import { useEffect, useRef, useState } from "react"
import { Heart, Compass, Cross, Globe2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/contexts/LanguageContext"


export function Values() {
  const { t } = useLanguage()

  // Defini a l'interieur du composant : hors du cycle de rendu, les libelles
  // ne reagiraient pas au changement de langue.
  const values = [
    { number: "01", key: "community", icon: Heart },
    { number: "02", key: "missionary", icon: Compass },
    { number: "03", key: "christian", icon: Cross },
    { number: "04", key: "international", icon: Globe2 },
  ]

  const [isVisible, setIsVisible] = useState(false)
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

  return (
    <section
      id="valeurs"
      ref={sectionRef}
      className="py-20 md:py-28 bg-gradient-to-br from-primary via-primary to-light-blue relative overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-white rounded-full translate-x-1/4 translate-y-1/4" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="text-accent font-semibold text-sm uppercase tracking-wider">
            {t('values.label')}
          </span>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mt-3 mb-4">
            {t('values.title')}
          </h2>
          <div className="w-20 h-1 bg-accent mx-auto" />
        </div>

        {/* Values Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {values.map((value, index) => (
            <div
              key={value.key}
              className={cn(
                "bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-500 group",
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              )}
              style={{
                transitionDelay: isVisible ? `${index * 150}ms` : "0ms",
              }}
            >
              <div className="flex items-start gap-6">
                {/* Number */}
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 rounded-full border-2 border-accent flex items-center justify-center text-accent font-serif font-bold text-lg group-hover:bg-accent group-hover:text-accent-foreground transition-all">
                    {value.number}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <value.icon className="w-6 h-6 text-accent" />
                    <h3 className="font-serif text-xl font-bold text-white">
                      {t(`values.${value.key}.title`)}
                    </h3>
                  </div>
                  <p className="text-white/80 leading-relaxed">
                    {t(`values.${value.key}.description`)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Quote */}
        <div className="text-center mt-16">
          <p className="text-white/60 italic text-lg max-w-2xl mx-auto">
            {t('values.closing')}
          </p>
        </div>
      </div>
    </section>
  )
}
