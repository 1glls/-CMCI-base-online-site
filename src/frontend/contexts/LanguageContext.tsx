"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'

type Language = 'fr' | 'en' | 'nl'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('fr')
  const [translations, setTranslations] = useState<any>({})

  useEffect(() => {
    // Charger la langue depuis localStorage
    const savedLang = localStorage.getItem('language') as Language
    if (savedLang && ['fr', 'en', 'nl'].includes(savedLang)) {
      setLanguageState(savedLang)
    }
  }, [])

  useEffect(() => {
    // Charger les traductions
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
