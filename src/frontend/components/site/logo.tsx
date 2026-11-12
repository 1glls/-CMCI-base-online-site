/**
 * Logo CMCI selon le theme : version or/ivoire sur fond sombre, version
 * d'origine (detouree) sur fond clair. Les deux images sont rendues et le CSS
 * (.only-dark / .only-light, app/globals.css) n'en montre qu'une : aucun
 * scintillement au chargement.
 * WebP quasi sans perte (40 Ko, identique a l'oeil) plutot que PNG (80 Ko) ; les PNG restent pour Open Graph et le JSON-LD.
 */
export function Logo({ className = "", alt = "" }: { className?: string; alt?: string }) {
  return (
    <>
      <img src="/cmci-logo-dark.webp" width={271} height={237} alt={alt} className={`only-dark ${className}`} />
      <img src="/cmci-logo-light.webp" width={271} height={237} alt={alt} className={`only-light ${className}`} />
    </>
  )
}
