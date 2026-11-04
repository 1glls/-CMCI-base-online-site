/**
 * Adresses du site mere de la CMCI internationale (cmfinternational.org).
 * Un seul endroit a mettre a jour si leurs rubriques changent.
 */
const BASE = "https://cmfinternational.org"

export const CMFI = {
  home: BASE,
  vision: `${BASE}/about/vision`,
  history: `${BASE}/about/history`,
  goal: `${BASE}/about/goal`,
  mission: `${BASE}/about/mission`,
  ministry: `${BASE}/about/ministry`,
  fiveYearGoal: `${BASE}/about/five-year-goal`,
  books: `${BASE}/books`,
  contact: `${BASE}/contact`,
  founder: `${BASE}/founder`,
  /** Chapitres de la biographie du fondateur ; `key` = cle de traduction home2.founder.chapters.* */
  founderChapters: [
    { key: "introduction", href: `${BASE}/founder/ztf-introduction` },
    { key: "science", href: `${BASE}/founder/ztf-the-man-of-science` },
    { key: "god", href: `${BASE}/founder/ztf-the-man-of-god` },
    { key: "joyful", href: `${BASE}/founder/ztf-a-joyful-servant` },
    { key: "suffering", href: `${BASE}/founder/ztf-the-man-of-suffering` },
    { key: "prayer", href: `${BASE}/founder/ztf-the-man-of-prayer` },
    { key: "finances", href: `${BASE}/founder/the-man-of-finances` },
    { key: "fasting", href: `${BASE}/founder/the-man-of-fasting` },
    { key: "word", href: `${BASE}/founder/the-minister-of-the-word` },
  ],
} as const
