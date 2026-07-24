const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const run = promisify(execFile);

/**
 * Genere des images d'apercu a partir d'un PDF, via pdftoppm (poppler-utils).
 *
 * JPEG plutot que PNG : les tracts sont des visuels en aplats et degrades,
 * ou le JPEG divise le poids par sept a qualite visuelle egale (2,5 Mo ->
 * ~330 Ko sur « Le chemin du salut »).
 *
 * Ne leve jamais : si poppler est absent ou le PDF illisible, renvoie un
 * tableau vide. L'absence d'apercu ne doit pas empecher l'enregistrement
 * d'un tract.
 */
async function generatePreviews(pdfAbsPath, outDir, options = {}) {
  const { maxPages = 4, dpi = 72, quality = 82, prefix = 'preview', webBase } = options;

  if (!fs.existsSync(pdfAbsPath)) {
    console.error(`Apercus : PDF introuvable (${pdfAbsPath})`);
    return [];
  }

  try {
    fs.mkdirSync(outDir, { recursive: true });

    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const stem = path.join(outDir, `${prefix}-${unique}`);

    await run('pdftoppm', [
      '-jpeg',
      '-jpegopt', `quality=${quality}`,
      '-r', String(dpi),
      '-f', '1',
      '-l', String(maxPages),
      pdfAbsPath,
      stem
    ], { timeout: 60000 });

    // pdftoppm suffixe les fichiers : <stem>-1.jpg, <stem>-2.jpg...
    const base = path.basename(stem);
    const produced = fs.readdirSync(outDir)
      .filter((f) => f.startsWith(base) && f.endsWith('.jpg'))
      .sort((a, b) => {
        const n = (s) => parseInt(s.match(/-(\d+)\.jpg$/)?.[1] ?? '0', 10);
        return n(a) - n(b);
      });

    if (produced.length === 0) {
      console.error('Apercus : pdftoppm n\'a produit aucune image');
      return [];
    }

    return produced.map((f) => `${webBase}/${f}`);
  } catch (error) {
    // ENOENT = poppler-utils absent de la machine
    const cause = error.code === 'ENOENT'
      ? 'pdftoppm introuvable (installer poppler-utils)'
      : error.message;
    console.error('Apercus non generes :', cause);
    return [];
  }
}

module.exports = { generatePreviews };
