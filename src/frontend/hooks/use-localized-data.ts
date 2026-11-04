"use client"

import { useEffect, useRef, useState } from "react"
import { API_URL } from "@/lib/api"
import { useLanguage } from "@/contexts/LanguageContext"

/**
 * Donnees d'une section publique, rendues d'abord par le serveur (en
 * francais, lisibles par Google) puis rechargees seulement si le visiteur
 * change de langue. `path` doit accepter `?lang=` (ou `&lang=`).
 */
export function useLocalizedData<T>(path: string, initial: T): T {
  const { language } = useLanguage()
  const [data, setData] = useState<T>(initial)
  const servedLang = useRef<string>("fr")

  useEffect(() => {
    if (language === servedLang.current) return
    servedLang.current = language
    const sep = path.includes("?") ? "&" : "?"
    let cancelled = false
    fetch(`${API_URL}${path}${sep}lang=${language}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => { if (!cancelled && json) setData(json) })
      .catch(() => { /* on garde les donnees deja affichees */ })
    return () => { cancelled = true }
  }, [language, path])

  return data
}
