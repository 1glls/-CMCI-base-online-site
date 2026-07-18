"use client"

import React from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Globe } from 'lucide-react'

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage()

  const languages = [
    { code: 'fr', label: 'FR', name: 'Français' },
    { code: 'en', label: 'EN', name: 'English' },
    { code: 'nl', label: 'NL', name: 'Nederlands' }
  ]

  return (
    <div className="relative group">
      <button
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent/10 transition-colors"
        aria-label="Select language"
      >
        <Globe className="w-4 h-4" />
        <span className="text-sm font-medium uppercase">{language}</span>
      </button>
      
      {/* text-gray-900 explicite : sans lui, les entrees heritent du blanc de
          l'en-tete (pose sur le hero sombre) et deviennent invisibles sur ce
          fond blanc. Seule la langue active restait lisible, grace a son fond. */}
      <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setLanguage(lang.code as 'fr' | 'en' | 'nl')}
            className={`
              w-full px-4 py-2 text-left text-sm transition-colors
              text-gray-900 dark:text-gray-100
              hover:bg-accent/10
              first:rounded-t-lg last:rounded-b-lg
              ${language === lang.code ? 'bg-accent/20 font-semibold' : ''}
            `}
          >
            <span className="font-medium">{lang.label}</span> - {lang.name}
          </button>
        ))}
      </div>
    </div>
  )
}
