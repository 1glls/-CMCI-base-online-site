"use client"

import React from "react"

import { useState, useEffect, useRef } from "react"
import { Send, CheckCircle, Phone, Mail, MapPin, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { API_URL } from "@/lib/api"
import { Facebook, Instagram, Youtube } from "lucide-react"
import { FaTiktok, FaTelegram, FaWhatsapp } from "react-icons/fa"
import { useLanguage } from "@/contexts/LanguageContext"

interface ContactSettings {
  phone: string
  email: string
  address: string
  hours: string
}

interface SocialLinks {
  facebook: string
  instagram: string
  youtube: string
  tiktok: string
  telegram: string
  whatsapp: string
}

export function Newsletter() {
  const [email, setEmail] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { t } = useLanguage()
  const [contactInfo, setContactInfo] = useState<ContactSettings>({
    phone: "+32 2 123 45 67",
    email: "contact@cmci.be",
    address: "123 Avenue Louise, 1050 Bruxelles",
    hours: "Lundi - Samedi: 9h00 - 18h00"
  })
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({
    facebook: "#",
    instagram: "#",
    youtube: "#",
    tiktok: "#",
    telegram: "#",
    whatsapp: "#"
  })
  const sectionRef = useRef<HTMLElement>(null)

  // Helper function to ensure URLs have protocol
  const normalizeUrl = (url: string): string => {
    if (!url || url === "#") return "#";
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    return `https://${url}`;
  };

  // Charger les informations de contact
  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        const response = await fetch(`${API_URL}/api/settings`)
        if (response.ok) {
          const settings = await response.json()
          const settingsMap = settings.reduce((acc: any, s: any) => {
            acc[s.key] = s.value
            return acc
          }, {})
          
          setContactInfo({
            phone: settingsMap.contact_phone || contactInfo.phone,
            email: settingsMap.contact_email || contactInfo.email,
            address: settingsMap.contact_address || contactInfo.address,
            hours: settingsMap.contact_hours || contactInfo.hours
          })
          
          setSocialLinks({
            facebook: normalizeUrl(settingsMap.social_facebook || "#"),
            instagram: normalizeUrl(settingsMap.social_instagram || "#"),
            youtube: normalizeUrl(settingsMap.social_youtube || "#"),
            tiktok: normalizeUrl(settingsMap.social_tiktok || "#"),
            telegram: normalizeUrl(settingsMap.social_telegram || "#"),
            whatsapp: normalizeUrl(settingsMap.social_whatsapp || "#")
          })
        }
      } catch (error) {
        console.error("Erreur chargement contact info:", error)
      }
    }

    fetchContactInfo()
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsSubmitting(true)
    setError("")

    try {
      const response = await fetch(`${API_URL}/api/newsletter/subscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setIsSubmitted(true)
        setEmail("")
        setTimeout(() => setIsSubmitted(false), 5000)
      } else {
        setError(data.error || "Une erreur est survenue")
      }
    } catch (error) {
      console.error("Erreur lors de l'inscription:", error)
      setError("Erreur de connexion au serveur")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section
      id="contact"
      ref={sectionRef}
      className="py-20 md:py-28 bg-gradient-to-br from-light-blue to-primary relative overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Section Titre Centré */}
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mb-4">
              {t('contact.title')}
            </h2>
            <p className="text-white/80 text-lg max-w-2xl mx-auto">
              {t('contact.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 mb-16">
            {/* Contact Info */}
            <div
              className={cn(
                "transition-all duration-700",
                isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
              )}
            >
              <div className="space-y-4">
                <div className="flex items-start gap-4 text-white">
                  <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{t('contact.phone')}</h3>
                    <a href={`tel:${contactInfo.phone.replace(/\s/g, '')}`} className="text-white/80 hover:text-accent transition-colors">
                      {contactInfo.phone}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4 text-white">
                  <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{t('contact.email')}</h3>
                    <a href={`mailto:${contactInfo.email}`} className="text-white/80 hover:text-accent transition-colors">
                      {contactInfo.email}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4 text-white">
                  <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{t('contact.address')}</h3>
                    <p className="text-white/80">{contactInfo.address}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 text-white">
                  <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{t('contact.hours')}</h3>
                    <p className="text-white/80">{contactInfo.hours}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Newsletter */}
            <div
              className={cn(
                "transition-all duration-700",
                isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
              )}
            >
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mb-6">
                  <Send className="w-7 h-7 text-accent-foreground" />
                </div>

                <h3 className="font-serif text-2xl font-bold text-white mb-4">
                  {t('contact.newsletter.title')}
                </h3>
                <p className="text-white/80 mb-6">
                  {t('contact.newsletter.description')}
                </p>

                {isSubmitted ? (
                  <div className="bg-accent/20 rounded-xl p-6 flex items-center gap-3 text-white">
                    <CheckCircle className="w-6 h-6 text-accent flex-shrink-0" />
                    <span className="font-medium">
                      {t('contact.newsletter.success')}
                    </span>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                      type="email"
                      placeholder={t('contact.newsletter.placeholder')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isSubmitting}
                      className="bg-white/90 border-0 h-12 text-foreground placeholder:text-muted-foreground"
                    />
                    {error && (
                      <p className="text-red-300 text-sm">{error}</p>
                    )}
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-accent text-accent-foreground hover:bg-accent/90 h-12 font-semibold"
                    >
                      {isSubmitting ? t('contact.newsletter.subscribing') : t('contact.newsletter.subscribe')}
                    </Button>
                    <p className="text-white/50 text-xs">
                      {t('contact.newsletter.accept')}
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* Section Réseaux Sociaux */}
          <div
            className={cn(
              "text-center transition-all duration-700 delay-300",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            )}
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <h3 className="font-serif text-2xl font-bold text-white mb-4">
                {t('contact.social.title')}
              </h3>
              <p className="text-white/80 mb-8">
                {t('contact.social.subtitle')}
              </p>
              
              <div className="flex justify-center items-center gap-4 flex-wrap">
                <a 
                  href={socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-14 h-14 rounded-full bg-accent/20 hover:bg-accent flex items-center justify-center transition-all duration-300 hover:scale-110"
                  aria-label="Facebook"
                >
                  <Facebook className="w-6 h-6 text-white" />
                </a>
                
                <a 
                  href={socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-14 h-14 rounded-full bg-accent/20 hover:bg-accent flex items-center justify-center transition-all duration-300 hover:scale-110"
                  aria-label="Instagram"
                >
                  <Instagram className="w-6 h-6 text-white" />
                </a>
                
                <a 
                  href={socialLinks.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-14 h-14 rounded-full bg-accent/20 hover:bg-accent flex items-center justify-center transition-all duration-300 hover:scale-110"
                  aria-label="YouTube"
                >
                  <Youtube className="w-6 h-6 text-white" />
                </a>
                
                <a 
                  href={socialLinks.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-14 h-14 rounded-full bg-accent/20 hover:bg-accent flex items-center justify-center transition-all duration-300 hover:scale-110"
                  aria-label="TikTok"
                >
                  <FaTiktok className="w-6 h-6 text-white" />
                </a>
                
                <a 
                  href={socialLinks.telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-14 h-14 rounded-full bg-accent/20 hover:bg-accent flex items-center justify-center transition-all duration-300 hover:scale-110"
                  aria-label="Telegram"
                >
                  <FaTelegram className="w-6 h-6 text-white" />
                </a>
                
                <a 
                  href={socialLinks.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-14 h-14 rounded-full bg-accent/20 hover:bg-accent flex items-center justify-center transition-all duration-300 hover:scale-110"
                  aria-label="WhatsApp"
                >
                  <FaWhatsapp className="w-6 h-6 text-white" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
