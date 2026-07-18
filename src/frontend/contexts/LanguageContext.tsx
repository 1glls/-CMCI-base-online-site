"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import fr from '@/lib/translations/fr.json'

type Language = 'fr' | 'en' | 'nl'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('fr')
  // Le francais est importe statiquement : un objet vide au depart ferait
  // renvoyer la cle brute par t() lors du rendu serveur (ou aucun useEffect
  // ne s'execute), et l'utilisateur verrait « values.label » avant hydratation.
  const [translations, setTranslations] = useState<any>(fr)

  useEffect(() => {
    // Charger la langue depuis localStorage
    const savedLang = localStorage.getItem('language') as Language
    if (savedLang && ['fr', 'en', 'nl'].includes(savedLang)) {
      setLanguageState(savedLang)
    }
  }, [])

  useEffect(() => {
    // Le francais est deja charge : eviter un aller-retour inutile
    if (language === 'fr') {
      setTranslations(fr)
      return
    }
    import(`@/lib/translations/${language}.json`)
      .then(module => setTranslations(module.default))
      .catch(err => console.error('Erreur chargement traductions:', err))
  }, [language])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('language', lang)
  }

  const t = (key: string): string => {
    const keys = key.split('.')
    let value = translations
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k]
      } else {
        return key
      }
    }
    
    return typeof value === 'string' ? value : key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
