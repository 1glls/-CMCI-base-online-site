/**
 * Logo CMCI selon le theme : version or/ivoire sur fond sombre, version
 * d'origine (detouree) sur fond clair. Les deux images sont rendues et le CSS
 * (.only-dark / .only-light, app/globals.css) n'en montre qu'une : aucun
 * scintillement au chargement.
 */
export function Logo({ className = "", alt = "" }: { className?: string; alt?: string }) {
  return (
    <>
      <img src="/cmci-logo-dark.png" alt={alt} className={`only-dark ${className}`} />
      <img src="/cmci-logo-light.png" alt={alt} className={`only-light ${className}`} />
    </>
  )
}
