/**
 * Tracts au format HTML : un seul fichier portant le texte, les styles et
 * les images. Contrairement a un PDF, ce format reste traduisible : DeepL
 * sait traiter le HTML en preservant les balises et les classes.
 *
 * Trois roles ici :
 *   - assainir le fichier avant de le servir
 *   - en extraire le texte a traduire, sans gaspiller de quota
 *   - reassembler une version traduite
 */

/* --------------------------------------------------------------------------
   Assainissement
   -------------------------------------------------------------------------- */

/**
 * Retire ce qui peut s'executer. Le fichier est televerse par un
 * administrateur, mais il sera servi depuis le domaine du site : un script
 * qui s'y trouverait s'executerait avec les droits de la page.
 *
 * C'est une defense en profondeur : l'iframe qui affiche ce HTML est
 * sandboxee sans allow-scripts, ce qui bloque deja toute execution.
 */
function sanitizeHtml(html) {
  if (!html) return '';
  return String(html)
    // scripts, y compris ceux dont la balise fermante manque
    .replace(/<script\b[\s\S]*?(<\/script>|$)/gi, '')
    // <iframe>, <object>, <embed> : chargements externes arbitraires
    .replace(/<(iframe|object|embed|form)\b[\s\S]*?(<\/\1>|$)/gi, '')
    // gestionnaires d'evenements : onclick=, onload=, onerror=...
    .replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, '')
    .replace(/\son[a-z]+\s*=\s*'[^']*'/gi, '')
    .replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, '')
    // href="javascript:..." et consorts
    .replace(/(href|src|action)\s*=\s*(["'])\s*javascript:[^"']*\2/gi, '$1="#"');
}

/* --------------------------------------------------------------------------
   Traduction
   -------------------------------------------------------------------------- */

/**
 * Les images embarquees en data URI pesent l'essentiel du fichier : sur un
 * tract de 57 Ko, plus de 40 Ko de base64. Envoyees a DeepL elles seraient
 * facturees comme du texte, pour rien. On les met de cote, on traduit, on
 * les remet.
 */
function stashDataUris(html) {
  const stash = [];
  const out = html.replace(/(src|href)\s*=\s*(["'])(data:[^"']{200,})\2/gi,
    (_, attr, q, uri) => {
      stash.push(uri);
      return `${attr}=${q}__CMCI_ASSET_${stash.length - 1}__${q}`;
    });
  return { html: out, stash };
}

function restoreDataUris(html, stash) {
  return html.replace(/__CMCI_ASSET_(\d+)__/g, (m, i) => stash[Number(i)] ?? m);
}

/**
 * Isole ce qui doit etre traduit. Le CSS et le <head> sont laisses de cote :
 * ils ne contiennent pas de texte lisible et gonfleraient la facture.
 */
function splitDocument(html) {
  const bodyMatch = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  if (!bodyMatch) {
    // Fragment sans <body> : tout est traduisible
    return { before: '', body: html, after: '', hadBody: false };
  }
  const start = bodyMatch.index + bodyMatch[0].indexOf(bodyMatch[1]);
  return {
    before: html.slice(0, start),
    body: bodyMatch[1],
    after: html.slice(start + bodyMatch[1].length),
    hadBody: true
  };
}

/**
 * DeepL limite la taille d'une requete. On decoupe sur les balises de
 * premier niveau plutot qu'au milieu du texte, pour ne pas casser une phrase
 * ni un element.
 */
function chunkHtml(body, maxChars = 30000) {
  if (body.length <= maxChars) return [body];

  const parts = [];
  let current = '';
  // Decoupe aux frontieres d'elements de bloc
  const pieces = body.split(/(?=<(?:div|section|article|p|h[1-6]|table|ul|ol)\b)/i);

  for (const piece of pieces) {
    if (current.length + piece.length > maxChars && current) {
      parts.push(current);
      current = piece;
    } else {
      current += piece;
    }
  }
  if (current) parts.push(current);
  return parts;
}

/**
 * Traduit un document HTML complet vers une langue cible.
 *
 * `translateFn(texts, lang)` doit renvoyer un tableau de traductions ; c'est
 * translateBatch du service de traduction, appele avec tag_handling=html.
 */
async function translateDocument(html, targetLang, translateFn) {
  const clean = sanitizeHtml(html);
  const { html: masked, stash } = stashDataUris(clean);
  const { before, body, after } = splitDocument(masked);

  const chunks = chunkHtml(body);
  const translated = await translateFn(chunks, targetLang);

  const rebuilt = before + translated.join('') + after;
  return restoreDataUris(rebuilt, stash);
}

/** Nombre de caracteres reellement envoyes : utile avant de consommer du quota. */
function estimateCost(html) {
  const { html: masked } = stashDataUris(sanitizeHtml(html));
  const { body } = splitDocument(masked);
  return body.length;
}

module.exports = {
  sanitizeHtml,
  translateDocument,
  estimateCost,
  stashDataUris,
  restoreDataUris,
  splitDocument,
  chunkHtml
};
