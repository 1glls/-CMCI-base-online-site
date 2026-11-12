const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');

/**
 * Récupère le buffer d'une image à partir de différentes sources :
 * - Buffer direct (fichier uploadé via multer)
 * - URL distante (http/https)
 * - Chemin local sur le serveur (ex: /uploads/events/event-xxx.jpg)
 * 
 * @param {Buffer|string} source - Buffer, URL ou chemin local
 * @returns {Promise<Buffer>} Le buffer de l'image
 */
async function getImageBuffer(source) {
  // Cas 1: C'est déjà un buffer (upload multer)
  if (Buffer.isBuffer(source)) {
    return source;
  }

  // Cas 2: C'est une URL distante (http ou https)
  if (typeof source === 'string' && source.startsWith('http')) {
    return downloadImage(source);
  }

  // Cas 3: C'est un chemin local (ex: /uploads/events/event-xxx.jpg ou chemin absolu)
  if (typeof source === 'string') {
    // D'abord vérifier si c'est un chemin absolu qui existe déjà
    if (path.isAbsolute(source) && fs.existsSync(source)) {
      return fs.readFileSync(source);
    }
    // Sinon, traiter comme un chemin relatif (ex: /uploads/hero/xxx.jpg)
    const relativePath = source.startsWith('/') ? source.slice(1) : source;
    const localPath = path.resolve(relativePath);
    if (fs.existsSync(localPath)) {
      return fs.readFileSync(localPath);
    }
    throw new Error(`Image locale introuvable: ${localPath}`);
  }

  throw new Error('Source image non supportée');
}

/**
 * Télécharge une image depuis une URL distante
 * @param {string} url - URL de l'image
 * @returns {Promise<Buffer>}
 */
function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    const request = client.get(url, { 
      timeout: 15000,
      headers: {
        'User-Agent': 'CMCI-Belgique-ImageProcessor/1.0'
      }
    }, (response) => {
      // Suivre les redirections (301, 302, 307, 308)
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        console.log(`🔄 Redirection vers: ${response.headers.location}`);
        downloadImage(response.headers.location).then(resolve).catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Échec du téléchargement: HTTP ${response.statusCode}`));
        return;
      }

      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        const buffer = Buffer.concat(chunks);
        console.log(`📥 Image téléchargée: ${(buffer.length / 1024).toFixed(0)}KB`);
        resolve(buffer);
      });
      response.on('error', reject);
    });

    request.on('error', reject);
    request.on('timeout', () => {
      request.destroy();
      reject(new Error('Timeout du téléchargement de l\'image'));
    });
  });
}

/**
 * Traite une image hero et génère des versions optimisées
 * pour desktop (paysage 16:9) et mobile (portrait 4:5).
 * 
 * Technique "fond flou" : 
 * 1. Crée un fond flou (blurred) de l'image aux dimensions cibles
 * 2. Redimensionne l'image originale pour qu'elle TIENNE ENTIÈREMENT dans le cadre
 * 3. Superpose l'image complète centrée sur le fond flou
 * 
 * Résultat : l'image est 100% visible, pas de contenu coupé,
 * et l'écran est rempli de manière esthétique.
 * 
 * @param {Buffer|string} source - Buffer de l'image, URL distante, ou chemin local
 * @param {string} baseFilename - Nom de base du fichier (sans extension)
 * @param {string} uploadDir - Répertoire de destination
 * @returns {Promise<{desktop: string, mobile: string}>} Chemins relatifs des images générées
 */
async function processHeroImage(source, baseFilename, uploadDir = 'uploads/hero') {
  // Récupérer le buffer de l'image quelle que soit la source
  const imageBuffer = await getImageBuffer(source);

  // S'assurer que le répertoire existe
  const fullUploadDir = path.resolve(uploadDir);
  if (!fs.existsSync(fullUploadDir)) {
    fs.mkdirSync(fullUploadDir, { recursive: true });
  }

  const desktopFilename = `${baseFilename}-desktop.webp`;
  const mobileFilename = `${baseFilename}-mobile.webp`;

  const desktopPath = path.join(fullUploadDir, desktopFilename);
  const mobilePath = path.join(fullUploadDir, mobileFilename);

  // Obtenir les métadonnées de l'image originale
  const metadata = await sharp(imageBuffer).metadata();
  const originalWidth = metadata.width || 1920;
  const originalHeight = metadata.height || 1080;
  const originalRatio = originalWidth / originalHeight;

  console.log(`📐 Image originale: ${originalWidth}x${originalHeight} (ratio: ${originalRatio.toFixed(2)})`);

  // === Version Desktop (paysage 16:9 → 1920x1080) ===
  // Sur desktop, toujours utiliser cover pour remplir l'écran
  // (recadrage intelligent, standard pour les hero sections)
  await generateHeroVersion(imageBuffer, desktopPath, 1920, 1080, originalRatio, 'desktop');
  console.log(`🖥️  Version desktop générée: ${desktopFilename}`);

  // === Version Mobile (portrait 9:16 → 1080x1920) ===
  // Sur mobile, utiliser fond flou si l'image est paysage pour ne rien couper
  await generateHeroVersion(imageBuffer, mobilePath, 1080, 1920, originalRatio, 'mobile');
  console.log(`📱 Version mobile générée: ${mobileFilename}`);

  return {
    desktop: `/${uploadDir}/${desktopFilename}`,
    mobile: `/${uploadDir}/${mobileFilename}`
  };
}

/**
 * Génère une version hero optimisée.
 * 
 * Stratégie :
 * - Ratio compatible (±20%) → cover classique (peu de perte de contenu)
 * - Ratio très différent (ex: portrait sur paysage ou inversement) →
 *   technique fond flou + image complète visible à 100%.
 *   Sur desktop, le fond est moins flouté et moins assombri pour un rendu
 *   plus professionnel et intégré.
 * 
 * @param {Buffer} imageBuffer - Buffer de l'image source
 * @param {string} outputPath - Chemin du fichier de sortie
 * @param {number} targetWidth - Largeur cible
 * @param {number} targetHeight - Hauteur cible
 * @param {number} originalRatio - Ratio original de l'image
 * @param {string} variant - 'desktop' ou 'mobile'
 */
async function generateHeroVersion(imageBuffer, outputPath, targetWidth, targetHeight, originalRatio, variant = 'desktop') {
  const targetRatio = targetWidth / targetHeight;
  const ratioDiff = Math.abs(originalRatio - targetRatio) / targetRatio;

  // Ratio compatible (±20%) → cover classique, très peu de contenu perdu
  if (ratioDiff < 0.20) {
    await sharp(imageBuffer)
      .resize(targetWidth, targetHeight, {
        fit: 'cover',
        position: sharp.strategy.attention
      })
      .webp({ quality: 85 })
      .toFile(outputPath);
    console.log(`   ↳ ${variant}: cover classique (diff ratio ${(ratioDiff * 100).toFixed(0)}%)`);
    return;
  }

  // Ratio très différent → fond flou + image complète
  console.log(`   ↳ ${variant}: fond flou + image complète (diff ratio ${(ratioDiff * 100).toFixed(0)}%)`);

  // Paramètres adaptés selon variant
  const isDesktop = variant === 'desktop';
  const blurAmount = isDesktop ? 25 : 40;         // Moins flou sur desktop
  const bgBrightness = isDesktop ? 0.35 : 0.4;     // Légèrement plus sombre desktop pour le texte
  const bgQuality = isDesktop ? 70 : 60;
  const fgQuality = isDesktop ? 92 : 90;

  // 1. Créer le fond flou (cover + blur + assombrir)
  const blurredBg = await sharp(imageBuffer)
    .resize(targetWidth, targetHeight, {
      fit: 'cover',
      position: 'center'
    })
    .blur(blurAmount)
    .modulate({ brightness: bgBrightness })
    .webp({ quality: bgQuality })
    .toBuffer();

  // 2. Redimensionner l'image pour qu'elle tienne dans le cadre
  //    avec une marge de sécurité pour absorber le recadrage de object-cover
  const safeMargin = isDesktop ? 0.82 : 0.90; // 18% de marge desktop, 10% mobile
  const safeWidth = Math.round(targetWidth * safeMargin);
  const safeHeight = Math.round(targetHeight * safeMargin);

  const foreground = await sharp(imageBuffer)
    .resize(safeWidth, safeHeight, {
      fit: 'inside',
      withoutEnlargement: false
    })
    .webp({ quality: fgQuality })
    .toBuffer();

  // Obtenir les dimensions réelles du foreground pour centrer
  const fgMeta = await sharp(foreground).metadata();
  const fgWidth = fgMeta.width || targetWidth;
  const fgHeight = fgMeta.height || targetHeight;

  // Calculer le décalage pour centrer
  const offsetX = Math.round((targetWidth - fgWidth) / 2);
  const offsetY = Math.round((targetHeight - fgHeight) / 2);

  // 3. Superposer l'image complète centrée sur le fond flou
  await sharp(blurredBg)
    .composite([{
      input: foreground,
      left: offsetX,
      top: offsetY
    }])
    .webp({ quality: 85 })
    .toFile(outputPath);
}

/**
 * Supprime les fichiers images associés à un hero slide
 * @param {string} desktopPath - Chemin relatif de l'image desktop
 * @param {string} mobilePath - Chemin relatif de l'image mobile
 */
function deleteHeroImages(desktopPath, mobilePath) {
  const paths = [desktopPath, mobilePath].filter(Boolean);
  
  for (const imgPath of paths) {
    // Retirer le / initial pour obtenir le chemin relatif
    const fullPath = path.resolve(imgPath.startsWith('/') ? imgPath.slice(1) : imgPath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log(`🗑️  Image supprimée: ${fullPath}`);
    }
  }
}

/**
 * Recompresse une image uploadee en WebP (largeur max `maxWidth`, jamais
 * agrandie). Les photos brutes (PNG de 500 Ko, JPG d'appareil photo) pesaient
 * lourd sur la page d'accueil (PageSpeed « Ameliorer l'affichage des images »).
 * Les GIF (souvent animes) et les fichiers deja petits en WebP sont laisses tels quels.
 *
 * @param {string} filePath - chemin du fichier sur le disque
 * @param {{ maxWidth?: number, quality?: number, keepOriginal?: boolean }} options
 * @returns {Promise<string>} chemin du fichier final (.webp, ou l'original si inchange)
 */
async function optimizeUpload(filePath, { maxWidth = 1920, quality = 85, keepOriginal = false } = {}) {
  const ext = path.extname(filePath).toLowerCase();
  if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) return filePath;

  const input = await fs.promises.readFile(filePath);
  const meta = await sharp(input).metadata();
  if (ext === '.webp' && (meta.width || 0) <= maxWidth && input.length < 300 * 1024) return filePath;

  const output = ext === '.webp'
    ? filePath
    : filePath.slice(0, -ext.length) + '.webp';
  const data = await sharp(input)
    .rotate() // applique l'orientation EXIF des photos de telephone
    .resize({ width: maxWidth, withoutEnlargement: true })
    .webp({ quality })
    .toBuffer();

  // Si la conversion n'apporte rien (image deja tres optimisee), on garde l'original
  if (data.length >= input.length && ext !== '.png') return filePath;

  await fs.promises.writeFile(output, data);
  if (output !== filePath && !keepOriginal) await fs.promises.unlink(filePath).catch(() => {});
  return output;
}

/**
 * Middleware Express a placer juste apres `upload.single(...)` (multer, stockage
 * disque) : convertit le fichier recu et met a jour req.file (filename, path),
 * de sorte que la route enregistre directement le chemin .webp.
 * En cas d'echec de sharp, l'original est conserve (l'upload ne casse jamais).
 */
function optimizeUploadedImage(options) {
  return async (req, res, next) => {
    if (!req.file?.path) return next();
    try {
      const finalPath = await optimizeUpload(req.file.path, options);
      req.file.path = finalPath;
      req.file.filename = path.basename(finalPath);
    } catch (error) {
      console.error('Optimisation de l\'image impossible, original conserve :', error.message);
    }
    next();
  };
}

module.exports = {
  processHeroImage,
  deleteHeroImages,
  getImageBuffer,
  optimizeUpload,
  optimizeUploadedImage
};
