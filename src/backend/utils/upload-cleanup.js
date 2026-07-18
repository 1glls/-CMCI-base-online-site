const fs = require('fs');
const path = require('path');

const UPLOADS_ROOT = path.join(__dirname, '..', 'uploads');

/**
 * Supprime du disque un fichier uploade reference en base.
 *
 * Ne fait rien si le chemin :
 *   - est vide
 *   - est une URL externe (http/https)
 *   - est un asset local du frontend (/images/...)
 *   - sortirait du dossier uploads/ (garde-fou anti-traversee)
 *
 * L'absence du fichier n'est pas une erreur : la suppression en base a deja
 * eu lieu et c'est elle qui fait foi.
 */
async function deleteUploadedFile(storedPath) {
  if (!storedPath || typeof storedPath !== 'string') return;
  if (!storedPath.startsWith('/uploads/')) return;

  const absolute = path.resolve(UPLOADS_ROOT, '.' + storedPath.slice('/uploads'.length));

  if (absolute !== UPLOADS_ROOT && !absolute.startsWith(UPLOADS_ROOT + path.sep)) {
    console.warn(`Chemin hors de uploads/ ignore: ${storedPath}`);
    return;
  }

  try {
    await fs.promises.unlink(absolute);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error(`Suppression de ${storedPath} impossible:`, error.message);
    }
  }
}

/**
 * Variante pour plusieurs chemins (ex. les apercus d'un tract).
 */
async function deleteUploadedFiles(storedPaths = []) {
  await Promise.all(storedPaths.map(deleteUploadedFile));
}

module.exports = { deleteUploadedFile, deleteUploadedFiles };
