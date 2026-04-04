"use client"

import { useEffect } from "react"

/**
 * Composant qui gère le scroll vers les ancres (#section) après le chargement complet.
 * 
 * Problème résolu : quand un utilisateur arrive via un lien comme /#evenements,
 * le navigateur tente de scroller avant que les composants dynamiques soient chargés.
 * Les sections au-dessus (Hero, Vision, etc.) sont encore en mode "loading" avec
 * peu de hauteur, donc le scroll atterrit au mauvais endroit.
 * 
 * Solution : on attend que le contenu soit rendu, puis on re-scrolle vers l'ancre.
 */
export function HashScroll() {
  useEffect(() => {
    const hash = window.location.hash
    if (!hash) return

    const targetId = hash.slice(1) // Retirer le #

    // Fonction qui tente de scroller vers l'élément
    const scrollToTarget = () => {
      const element = document.getElementById(targetId)
      if (element) {
        // Offset pour le header fixe
        const headerHeight = 80
        const elementPosition = element.getBoundingClientRect().top + window.scrollY
        window.scrollTo({
          top: elementPosition - headerHeight,
          behavior: "smooth"
        })
        return true
      }
      return false
    }

    // Tentatives multiples pour laisser le temps aux données API de charger
    const delays = [500, 1500, 3000]
    const timeouts: NodeJS.Timeout[] = []

    delays.forEach((delay) => {
      timeouts.push(setTimeout(scrollToTarget, delay))
    })

    return () => {
      timeouts.forEach(clearTimeout)
    }
  }, [])

  return null
}
