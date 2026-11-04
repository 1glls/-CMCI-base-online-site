import { ArrowUpRight } from "lucide-react"

/** Lien vers le site mere (cmfinternational.org) : nouvel onglet, filet or et fleche ↗. */
export function CmfiLink({ href, children, className = "" }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <a
      href={href} target="_blank" rel="noopener noreferrer"
      className={`group inline-flex items-center gap-1.5 border-b border-or/50 pb-0.5 font-caps text-[11px] uppercase tracking-[0.18em] text-or-clair transition-colors hover:border-or hover:text-ivoire ${className}`}
    >
      {children}
      <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
    </a>
  )
}
