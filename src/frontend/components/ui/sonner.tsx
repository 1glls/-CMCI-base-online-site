'use client'

import { useTheme } from 'next-themes'
import { Toaster as Sonner, ToasterProps } from 'sonner'
import { useIsMobile } from '@/components/ui/use-mobile'

/**
 * Zone d'affichage des notifications (succès, échec, alerte, info).
 * Couleurs Nuit & or : variables CSS ci-dessous + règles `.admin-nuit [data-sonner-toast]`
 * dans app/globals.css. En bas à droite sur ordinateur, en haut au centre sur mobile.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const { resolvedTheme } = useTheme()
  const isMobile = useIsMobile()

  return (
    <Sonner
      theme={(resolvedTheme === 'light' ? 'light' : 'dark') as ToasterProps['theme']}
      position={isMobile ? 'top-center' : 'bottom-right'}
      visibleToasts={3}
      closeButton
      className="toaster group"
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
