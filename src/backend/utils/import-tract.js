/**
 * Importe un tract deja au format PDF, avec ses images d'apercu.
 *
 * A lancer depuis src/backend :
 *
 *   node utils/import-tract.js \
 *     --pdf=/chemin/tract.pdf \
 *     --previews=/chemin/p-1.jpg,/chemin/p-2.jpg \
 *     --slug=le-chemin-du-salut \
 *     --title="Le chemin du salut" \
 *     --lang=fr --label=Francais \
 *     --publish
 *
 * Sans --publish, la version est creee en brouillon non relu : elle
 * n'apparait pas sur le site tant qu'elle n'a pas ete validee dans l'admin.
 * C'est le comportement par defaut, volontairement.
 *
 * Les fichiers sont copies dans uploads/tracts/, pas deplaces : la source
 * reste intacte.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const UPLOADS = path.join(__dirname, '..', 'uploads', 'tracts');

const arg = (name, fallback = null) => {
  const found = process.argv.slice(2).find((a) => a.startsWith(`--${name}=`));
  return found ? found.split('=').slice(1).join('=') : fallback;
};
const flag = (name) => process.argv.slice(2).includes(`--${name}`);

/** Copie un fichier dans uploads/tracts/<sous-dossier>/ et renvoie son chemin web. */
function place(src, sub, prefix) {
  if (!fs.existsSync(src)) throw new Error(`Fichier introuvable : ${src}`);
  const dir = path.join(UPLOADS, sub);
  fs.mkdirSync(dir, { recursive: true });

  const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const name = `${prefix}-${unique}${path.extname(src).toLowerCase()}`;
  fs.copyFileSync(src, path.join(dir, name));
  return `/uploads/tracts/${sub}/${name}`;
}

async function main() {
  const pdf = arg('pdf');
  const slug = arg('slug');
  const title = arg('title');
  const lang = arg('lang', 'fr');
  const label = arg('label', 'Français');
  const description = arg('description', '');
  const dir = arg('dir', 'ltr');
  const previews = (arg('previews', '') || '').split(',').filter(Boolean);

  if (!pdf || !slug || !title) {
    console.error('Requis : --pdf, --slug, --title');
    process.exit(1);
  }

  // Le slug est la cible du QR-code : il ne doit jamais entrer en collision.
  const existing = await prisma.tract.findUnique({
    where: { slug }, include: { versions: true }
  });

  const tract = existing || await prisma.tract.create({
    data: { slug, title, description, status: 'published' }
  });
  console.log(existing ? `Tract existant : ${slug}` : `Tract cree : ${slug}`);

  if (existing?.versions.some((v) => v.language === lang)) {
    console.error(`La langue « ${lang} » existe deja pour ce tract.`);
    await prisma.$disconnect();
    process.exit(1);
  }

  const filePath = place(pdf, 'files', 'tract-file');
  const previewPaths = previews.map((p) => place(p, 'previews', 'tract-previews'));

  // La premiere page sert de couverture si le tract n'en a pas encore.
  if (!tract.cover && previews.length > 0) {
    const cover = place(previews[0], 'covers', 'tract-cover');
    await prisma.tract.update({ where: { id: tract.id }, data: { cover } });
    console.log(`  couverture : ${cover}`);
  }

  const version = await prisma.tractVersion.create({
    data: {
      tractId: tract.id,
      language: lang,
      label,
      title,
      dir,
      file: filePath,
      previews: previewPaths.length ? JSON.stringify(previewPaths) : null,
      // Publication conditionnee a une validation humaine, sauf --publish
      reviewed: flag('publish'),
      status: flag('publish') ? 'published' : 'draft'
    }
  });

  console.log(`  PDF        : ${filePath}`);
  console.log(`  apercus    : ${previewPaths.length}`);
  console.log(`  version    : ${version.language} (${version.label})`);
  console.log(`  visible    : ${version.reviewed && version.status === 'published' ? 'oui' : 'non — a valider dans l\'admin'}`);
  console.log(`\n  URL du QR  : https://www.cmcibelgique.org/t/${slug}?de=${lang}`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('Erreur :', e.message);
  await prisma.$disconnect();
  process.exit(1);
});
