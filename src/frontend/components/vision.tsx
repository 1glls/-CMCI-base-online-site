"use client"

import { useEffect, useRef, useState } from "react"
import { Globe, Users, HandHeart } from "lucide-react"
import { cn } from "@/lib/utils"

const visionCards = [
  {
    icon: Globe,
    title: "Evangeliser le monde",
    description:
      "Atteindre 10 milliards de personnes par l'evangile dans la puissance du Saint-Esprit, proclamant le message de salut a toutes les nations.",
  },
  {
    icon: Users,
    title: "Former des disciples",
    description:
      "1 milliard de disciples dans 250 nations organises en 25 millions d'eglises de maison d'ici 2065, suivant le modele de Jesus.",
  },
  {
    icon: HandHeart,
    title: "Prier pour le reveil",
    description:
      "Cooperer avec Dieu par le jeune et l'intercession pour le reveil mondial, preparant le retour glorieux de notre Seigneur.",
  },
]

export function Vision() {
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
      id="vision"
      ref={sectionRef}
      className="py-20 md:py-28 bg-secondary"
    >
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="text-accent font-semibold text-sm uppercase tracking-wider">
            Notre Vision
          </span>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-primary mt-3 mb-4">
            Transformer le monde par l'Evangile
          </h2>
          <div className="w-20 h-1 bg-accent mx-auto" />
        </div>

        {/* Vision Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {visionCards.map((card, index) => (
            <div
              key={card.title}
              className={cn(
                "bg-card rounded-xl p-8 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-2 group",
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              )}
              style={{
                transitionDelay: isVisible ? `${index * 150}ms` : "0ms",
              }}
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-accent/20 transition-colors">
                <card.icon className="w-8 h-8 text-primary group-hover:text-accent transition-colors" />
              </div>
              <h3 className="font-serif text-xl font-bold text-primary mb-4">
                {card.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {card.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
