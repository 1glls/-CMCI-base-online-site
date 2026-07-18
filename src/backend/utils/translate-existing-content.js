/**
 * Traduit le contenu deja present en base vers les langues demandees.
 *
 * A lancer depuis src/backend :
 *   node utils/translate-existing-content.js            # estimation seule
 *   node utils/translate-existing-content.js --run      # traduit reellement
 *   node utils/translate-existing-content.js --run --lang=nl
 *
 * Sans --run, le script se contente de compter les caracteres a envoyer :
 * utile pour verifier l'impact sur le quota avant de consommer quoi que ce
 * soit. Les traductions deja relues par un humain ne sont jamais ecrasees.
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { translateRecord, TRANSLATABLE } = require('../services/translation.service');

const prisma = new PrismaClient();

const LOADERS = {
  Event: () => prisma.event.findMany(),
  Ministry: () => prisma.ministry.findMany(),
  Assembly: () => prisma.assembly.findMany(),
  Testimonial: () => prisma.testimonial.findMany(),
  HeroSlide: () => prisma.heroSlide.findMany()
};

async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--run');
  const langArg = args.find((a) => a.startsWith('--lang='));
  const languages = langArg ? [langArg.split('=')[1]] : ['en', 'nl'];

  console.log(dryRun ? '=== ESTIMATION (aucun appel API) ===' : '=== TRADUCTION ===');
  console.log('Langues cibles :', languages.join(', '));
  console.log();

  let totalChars = 0;
  let totalRecords = 0;
  const failures = [];

  for (const [model, load] of Object.entries(LOADERS)) {
    const records = await load();
    if (records.length === 0) {
      console.log(`${model.padEnd(12)} aucun enregistrement`);
      continue;
    }

    const fields = TRANSLATABLE[model];
    const chars = records.reduce(
      (n, r) => n + fields.reduce((m, f) => m + String(r[f] ?? '').length, 0),
      0
    );
    // Chaque langue consomme le texte source une fois de plus.
    const cost = chars * languages.length;
    totalChars += cost;
    totalRecords += records.length;

    console.log(`${model.padEnd(12)} ${String(records.length).padStart(3)} enregistrement(s) · ${cost} caracteres`);

    if (dryRun) continue;

    for (const record of records) {
      for (const lang of languages) {
        try {
          const res = await translateRecord(model, record.id, record, lang);
          const label = record.title || record.name || record.quote?.slice(0, 30) || record.id;
          console.log(`   ${lang}  ${res.translated} champ(s)  ${String(label).slice(0, 45)}`);
        } catch (e) {
          failures.push(`${model}/${record.id}/${lang} : ${e.message}`);
          console.log(`   ${lang}  ECHEC  ${e.message}`);
        }
      }
    }
  }

  console.log();
  console.log(`Total : ${totalRecords} enregistrement(s), ~${totalChars} caracteres`);

  if (dryRun) {
    console.log('\nAucun appel API effectue. Relancez avec --run pour traduire.');
  } else if (failures.length) {
    console.log(`\n${failures.length} echec(s) :`);
    failures.forEach((f) => console.log('  - ' + f));
  } else {
    console.log('\nTermine sans erreur.');
  }

  const providers = await prisma.translationProvider.findMany();
  for (const p of providers) {
    console.log(`Compte « ${p.name} » : ${p.charactersUsed} / ${p.characterLimit} caracteres`);
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('Erreur :', e.message);
  await prisma.$disconnect();
  process.exit(1);
});
