import { Fragment, type ReactNode } from "react"

/**
 * Noms de Jesus (fr, en, nl), les formes longues d'abord pour que
 * « Jesus-Christ » soit pris en entier plutot que « Jesus » puis « Christ ».
 * Les lookarounds \p{L} empechent de toucher « chretien », « Christian »,
 * « christelijk »... (lettres collees au nom).
 */
const NAMES = [
  "Seigneur Jésus-Christ", "Seigneur Jésus", "Jésus-Christ", "Jésus Christ",
  "Lord Jesus Christ", "Lord Jesus", "Jesus Christ", "Jesus-Christ",
  "Heer Jezus Christus", "Heer Jezus", "Jezus Christus",
  "Jésus", "Jesus", "Jezus", "Christus", "Christ",
]
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
// Sans accent possible : « Jesus » saisi sans accent dans l'admin est reconnu
export const JESUS_PATTERN = new RegExp(
  `(?<!\\p{L})(${NAMES.map(escape).join("|").replace(/é/g, "[ée]")})(?!\\p{L})`,
  "gu"
)

/** Vrai si le mot (avec sa ponctuation) contient un nom de Jesus. */
export function hasJesusName(word: string): boolean {
  JESUS_PATTERN.lastIndex = 0
  return JESUS_PATTERN.test(word)
}

/** Decoupe un texte en morceaux, les noms de Jesus etant enveloppes en rouge vif. */
export function highlightJesus(text: string): ReactNode[] {
  if (!text) return []
  const parts = text.split(JESUS_PATTERN)
  // split avec groupe capturant : indices impairs = noms trouves
  return parts.map((p, i) =>
    i % 2 === 1 ? <span key={i} className="text-rouge">{p}</span> : <Fragment key={i}>{p}</Fragment>
  )
}

/** Texte (y compris saisi dans l'admin) avec le nom de Jesus en rouge vif. */
export function Rich({ text }: { text: string | null | undefined }): ReactNode {
  return <>{highlightJesus(text || "")}</>
}
