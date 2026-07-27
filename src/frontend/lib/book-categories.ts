/**
 * Regroupement éditorial des séries ztfbooks en thèmes généraux.
 *
 * ztfbooks n'expose aucune hiérarchie (54 séries à plat, une par langue).
 * Ce classement est le nôtre : il range chaque série (par son slug stable,
 * jamais par son libellé traduit) sous un thème général, pour transformer une
 * longue liste en un menu déroulant scannable (via <optgroup>).
 *
 * Une série inconnue (nouvelle chez ztfbooks) retombe sur « autres » jusqu'à
 * ce qu'on l'ajoute ici. Les libellés de thèmes sont traduits côté i18n
 * (clés books.groups.*), on ne stocke ici que des clés stables.
 */

export const GROUP_ORDER = [
  'priere', 'vie-chretienne', 'salut', 'leadership',
  'famille', 'jeunesse', 'ztf', 'langues', 'autres'
] as const;

export type GroupKey = typeof GROUP_ORDER[number];

const CATEGORY_GROUP: Record<string, GroupKey> = {
  'a-rhema-ministry': 'leadership',
  'a-voice-for-revival': 'salut',
  'aides-pratiques-dans-la-sanctification': 'vie-chretienne',
  'aides-pratiques-pour-les-vainqueurs': 'vie-chretienne',
  'de-ses-levres': 'ztf',
  'dieu-t-aime': 'salut',
  'dieu-l-argent-et-toi': 'famille',
  'dieu-le-sexe-et-toi': 'famille',
  'diriger-le-peuple-de-dieu': 'leadership',
  'discipling-children-for-christ': 'jeunesse',
  'evangelisation': 'salut',
  'evangelism': 'salut',
  'extended-excerpts': 'ztf',
  'faire-du-progres-spirituel': 'vie-chretienne',
  'from-his-lips': 'ztf',
  'from-his-spoken-ministry': 'leadership',
  'god-loves-you': 'salut',
  'god-money-and-you': 'famille',
  'god-sex-and-you': 'famille',
  'hors-serie': 'ztf',
  'l-evangile-que-je-preche': 'salut',
  'le-chemin-chretien': 'vie-chretienne',
  'le-renversement-des-principautes': 'priere',
  'leading-god-s-people': 'leadership',
  'les-femmes-de-la-gloire': 'famille',
  'les-uvres-complete-de-ztf': 'ztf',
  'making-spiritual-progress': 'vie-chretienne',
  'ministere-des-jeunes-et-etudiants': 'jeunesse',
  'off-series': 'ztf',
  'other-languages-books': 'langues',
  'other-languages-tracts': 'langues',
  'other-titles': 'autres',
  'overthrow-of-principalities': 'priere',
  'practical-helps-for-overcomers': 'vie-chretienne',
  'practical-helps-in-sanctification': 'vie-chretienne',
  'prayer-and-fasting-crusade': 'priere',
  'praying-with-power': 'priere',
  'prier-avec-puissance': 'priere',
  'special-series': 'vie-chretienne',
  'the-christian-way': 'vie-chretienne',
  'the-gospel-i-preach': 'salut',
  'tmbm-workbook': 'leadership',
  'un-ministere-par-revelation': 'leadership',
  'une-voix-pour-le-reveil': 'salut',
  'women-of-the-glory': 'famille',
  'ztf-books-finnish': 'langues',
  'ztf-books-german': 'langues',
  'ztf-books-india': 'langues',
  'ztf-books-italian': 'langues',
  'ztf-books-nordic': 'langues',
  'ztf-books-portuguese': 'langues',
  'ztf-books-spanish': 'langues',
  'ztf-complete-works': 'ztf',
  'ztf-music-academy': 'autres',
};

export function groupForSlug(slug: string): GroupKey {
  return CATEGORY_GROUP[slug] || 'autres';
}

/**
 * Langues affichées d'emblée dans le filtre ; le reste est replié.
 * On liste les codes réels renvoyés par la source (ztfbooks : « nl » = « dut »,
 * « pt » = « por »). Le néerlandais reste principal, langue nationale belge,
 * même avec peu de titres.
 */
export const PRIMARY_LANGS = ['fr', 'en', 'nl', 'dut', 'de', 'es', 'pt', 'por'];
