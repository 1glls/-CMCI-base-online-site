// Banc d'essai visuel — définition des styles et de leurs choix structurels.

export type StyleKey = 'manuscrit' | 'editorial' | 'sombre' | 'vibrant' | 'minimal';
export type ThemeKey = 'light' | 'dark';
export type AccentKey = 'rubrique' | 'feu' | 'ambre' | 'corail' | 'emeraude' | 'violet' | 'or';

/** Couleurs d'accent vives (hors bleu), inspirées de sunmetalon / cmgi-nl. */
export const ACCENTS: { key: AccentKey; label: string; swatch: string }[] = [
  { key: 'rubrique', label: 'Rouge rubrique', swatch: '#8c1d18' },
  { key: 'feu', label: 'Feu', swatch: '#f24d1e' },
  { key: 'ambre', label: 'Ambre', swatch: '#f0920f' },
  { key: 'corail', label: 'Corail', swatch: '#fb5a5a' },
  { key: 'emeraude', label: 'Émeraude', swatch: '#0fae7a' },
  { key: 'violet', label: 'Violet royal', swatch: '#8b5cf6' },
  { key: 'or', label: 'Or classique', swatch: '#d4af37' },
];

export const STYLES: { key: StyleKey; label: string; hint: string }[] = [
  { key: 'manuscrit', label: 'Manuscrit sacré', hint: 'Parchemin, lettrines, filets dorés' },
  { key: 'editorial', label: 'Éditorial élevé', hint: 'Navy + or, serif, élégant' },
  { key: 'sombre', label: 'Sombre impact', hint: 'Fonds sombres, chiffres géants' },
  { key: 'vibrant', label: 'Vibrant missionnaire', hint: 'Dégradés, énergie, jeunesse' },
  { key: 'minimal', label: 'Minimal institutionnel', hint: 'Blanc, épuré, sobre' },
];

export interface StyleConfig {
  /** Traitement des grands chiffres de la bande objectifs. */
  numberStyle: 'elegant' | 'glow' | 'gradient' | 'plain' | 'illuminated';
  /** Style des cartes. */
  cardStyle: 'soft' | 'contrast' | 'rounded' | 'outline' | 'manuscript';
  /** Eyebrows/titres en capitales. */
  headingUpper: boolean;
  /** Filet or sous les titres de section. */
  accentUnderline: boolean;
  /** Ornements de manuscrit : fleurons, cadre enluminé, chiffres romains. */
  ornate: boolean;
  /** Thème d'ouverture recommandé pour ce style. */
  defaultTheme: ThemeKey;
  /** Accent adopté à la sélection du style (sinon l'accent courant est gardé). */
  defaultAccent?: AccentKey;
}

export const STYLE_CONFIG: Record<StyleKey, StyleConfig> = {
  manuscrit: { numberStyle: 'illuminated', cardStyle: 'manuscript', headingUpper: false, accentUnderline: false, ornate: true, defaultTheme: 'light', defaultAccent: 'rubrique' },
  editorial: { numberStyle: 'elegant', cardStyle: 'soft', headingUpper: false, accentUnderline: true, ornate: false, defaultTheme: 'light' },
  sombre: { numberStyle: 'glow', cardStyle: 'contrast', headingUpper: true, accentUnderline: false, ornate: false, defaultTheme: 'dark' },
  vibrant: { numberStyle: 'gradient', cardStyle: 'rounded', headingUpper: false, accentUnderline: false, ornate: false, defaultTheme: 'light' },
  minimal: { numberStyle: 'plain', cardStyle: 'outline', headingUpper: false, accentUnderline: false, ornate: false, defaultTheme: 'light' },
};
