"use client"

/**
 * Transmet à tous les composants du site les durées de défilement réglées
 * dans l'admin (lib/timings.ts). Monté une fois dans app/layout.tsx.
 *
 *   const ms = useTiming("timing_featured")   // millisecondes
 */
import { createContext, useContext } from "react"
import { DEFAULT_TIMINGS, type TimingKey } from "@/lib/timings"

const TimingContext = createContext<Record<TimingKey, number>>(DEFAULT_TIMINGS)

export function TimingProvider({ value, children }: { value: Record<TimingKey, number>; children: React.ReactNode }) {
  return <TimingContext.Provider value={value}>{children}</TimingContext.Provider>
}

export function useTiming(key: TimingKey): number {
  return useContext(TimingContext)[key] ?? DEFAULT_TIMINGS[key]
}
