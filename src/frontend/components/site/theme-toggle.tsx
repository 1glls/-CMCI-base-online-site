"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"

/** Bascule mode sombre / mode clair, memorisee dans le navigateur (next-themes). */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  // Le theme n'est connu qu'une fois la page montee : avant, on garde la place
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const light = mounted && resolvedTheme === "light"
  return (
    <button
      type="button"
      onClick={() => setTheme(light ? "dark" : "light")}
      aria-label={light ? "Passer en mode sombre" : "Passer en mode clair"}
      title={light ? "Mode sombre" : "Mode clair"}
      className={`grid h-9 w-9 place-items-center rounded-full border border-or/40 text-or-clair transition-colors hover:bg-or hover:text-nuit ${className}`}
    >
      {mounted ? (light ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />) : <span className="h-4 w-4" />}
    </button>
  )
}
