/**
 * Script ponctuel : recompresse en WebP les images deja uploadees des
 * ministeres, de la galerie et des evenements (les nouveaux uploads le sont
 * automatiquement, cf. optimizeUploadedImage dans utils/image-processor.js).
 *
 * - Les originaux sont CONSERVES sur le disque : rien ne casse si un autre
 *   enregistrement (slide hero liee, sauvegarde...) pointe encore dessus.
 * - Seul le chemin en base est remplace par le .webp.
 *
 * Usage (depuis src/backend, apres une sauvegarde de la base) :
 *   node utils/migrate-upload-images.js --dry-run   # affiche ce qui serait fait
 *   node utils/migrate-upload-images.js             # convertit et met a jour la base
 */

const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');
const { optimizeUpload } = require('./image-processor');

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes('--dry-run');
const UPLOADS_ROOT = path.join(__dirname, '..', 'uploads');

// Modele Prisma, champ image, largeur max (un fond de section n'a pas besoin de plus)
const TARGETS = [
  { model: 'ministry', field: 'image', maxWidth: 1920 },
  { model: 'galleryImage', field: 'src', maxWidth: 1920 },
  { model: 'event', field: 'image', maxWidth: 1600 },
];

const kb = (n) => `${Math.round(n / 1024)} Ko`;

async function main() {
  console.log(`Recompression des images uploadees${DRY_RUN ? ' (simulation, rien n\'est modifie)' : ''}\n`);
  let converted = 0, skipped = 0, errors = 0, before = 0, after = 0;

  for (const { model, field, maxWidth } of TARGETS) {
    const rows = await prisma[model].findMany({ select: { id: true, [field]: true } });
    console.log(`— ${model} : ${rows.length} enregistrement(s)`);

    for (const row of rows) {
      const stored = row[field];
      if (!stored || !stored.startsWith('/uploads/') || !/\.(jpe?g|png)$/i.test(stored)) { skipped++; continue; }

      const absolute = path.resolve(UPLOADS_ROOT, '.' + stored.slice('/uploads'.length));
      if (!absolute.startsWith(UPLOADS_ROOT + path.sep) || !fs.existsSync(absolute)) {
        console.log(`  ⚠️  fichier absent : ${stored}`);
        skipped++;
        continue;
      }

      const size = fs.statSync(absolute).size;
      if (DRY_RUN) {
        console.log(`  → ${stored} (${kb(size)}) serait converti en .webp`);
        converted++;
        continue;
      }

      try {
        const output = await optimizeUpload(absolute, { maxWidth, keepOriginal: true });
        if (output === absolute) { skipped++; continue; }
        const newPath = stored.replace(/\.(jpe?g|png)$/i, '.webp');
        await prisma[model].update({ where: { id: row.id }, data: { [field]: newPath } });
        const newSize = fs.statSync(output).size;
        before += size; after += newSize; converted++;
        console.log(`  ✓ ${stored} : ${kb(size)} → ${kb(newSize)}`);
      } catch (error) {
        errors++;
        console.error(`  ✗ ${stored} : ${error.message}`);
      }
    }
  }

  console.log(`\n${converted} converti(s), ${skipped} ignore(s), ${errors} erreur(s)`);
  if (!DRY_RUN && converted) console.log(`Poids total : ${kb(before)} → ${kb(after)}`);
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
