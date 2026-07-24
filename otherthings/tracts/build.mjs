#!/usr/bin/env node
/**
 * Rend un tract dans toutes ses langues actives.
 *
 *   node otherthings/tracts/build.mjs recevoir-jesus
 *   node otherthings/tracts/build.mjs recevoir-jesus --lang=fr
 *   node otherthings/tracts/build.mjs recevoir-jesus --pdf
 *
 * Sans --pdf : produit uniquement le HTML, en Node pur, sans dependance.
 * Avec --pdf : rend le PDF et une image par page via Chrome headless
 * (puppeteer, installe a la demande). Ces images alimentent l'apercu du
 * site : la meme commande produit donc le document imprimable et son
 * apercu web, ce qui les empeche de diverger.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

/* -------------------------------------------------------------------------
   Rendu de gabarit minimal : {{cle}}, {{#liste}}...{{/liste}}, {{.}}
   Volontairement sans moteur externe — le gabarit reste lisible et le
   script n'a aucune dependance pour produire le HTML.
------------------------------------------------------------------------- */

function get(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function render(tpl, data) {
  // Sections : {{#chemin}} ... {{/chemin}}
  tpl = tpl.replace(/\{\{#([\w.]+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (_, path, block) => {
    const list = get(data, path);
    if (!Array.isArray(list)) return '';
    return list.map((item) => {
      let out = block;
      if (item && typeof item === 'object') {
        out = out.replace(/\{\{(\w+)\}\}/g, (__, k) => escapeHtml(item[k] ?? ''));
      }
      return out.replace(/\{\{\.\}\}/g, escapeHtml(item));
    }).join('');
  });

  // Variables simples. `qrSvg` est injecte tel quel (c'est du balisage).
  return tpl.replace(/\{\{([\w.]+)\}\}/g, (_, path) => {
    const v = get(data, path);
    if (v == null) {
      console.warn(`  [!] cle absente du contenu : ${path}`);
      return '';
    }
    return path === 'qrSvg' ? v : escapeHtml(v);
  });
}

/* -------------------------------------------------------------------------
   QR-code : encodeur minimal (version 4, correction M) suffisant pour une
   URL courte. Genere un SVG inline, sans dependance ni requete reseau.
------------------------------------------------------------------------- */

async function qrSvg(text) {
  // qrcode est disponible via npx sans etre une dependance du projet.
  try {
    const { toString } = await import('qrcode');
    return await toString(text, {
      type: 'svg', errorCorrectionLevel: 'M', margin: 1,
      color: { dark: '#0f5f5c', light: '#ffffff' }
    });
  } catch {
    console.warn('  [!] module `qrcode` absent : QR-code non genere.');
    console.warn('      Installez-le ponctuellement :  npm i -D qrcode');
    return '<!-- QR-code manquant -->';
  }
}

/* ------------------------------------------------------------------------- */

async function main() {
  const args = process.argv.slice(2);
  const slug = args.find((a) => !a.startsWith('--'));
  if (!slug) {
    console.error('Usage : node build.mjs <slug> [--lang=xx] [--pdf]');
    process.exit(1);
  }

  const root = join(HERE, slug);
  const meta = JSON.parse(readFileSync(join(root, 'meta.json'), 'utf8'));
  const tpl = readFileSync(join(root, 'template.html'), 'utf8');

  const only = args.find((a) => a.startsWith('--lang='))?.split('=')[1];
  const wantPdf = args.includes('--pdf');
  const langs = meta.languages.filter((l) => !only || l.code === only);

  if (langs.length === 0) {
    console.error(`Aucune langue active${only ? ` pour « ${only} »` : ''}.`);
    process.exit(1);
  }

  const dist = join(root, 'dist');
  mkdirSync(dist, { recursive: true });

  console.log(`Tract « ${slug} » — ${langs.length} langue(s)\n`);

  for (const lang of langs) {
    const file = join(root, 'content', `${lang.code}.json`);
    if (!existsSync(file)) {
      console.log(`  ${lang.code} : content/${lang.code}.json introuvable — ignore`);
      continue;
    }

    const data = JSON.parse(readFileSync(file, 'utf8'));
    data.qrSvg = await qrSvg(data.qr?.url || `${meta.baseUrl}?de=${lang.code}`);
    data.lang = lang.code;
    data.dir = lang.dir || 'ltr';

    const html = render(tpl, data);
    const out = join(dist, `${slug}-${lang.code}.html`);
    writeFileSync(out, html);

    const flag = lang.status === 'reviewed' ? '' : `  [${lang.status || 'draft'} — non relu]`;
    console.log(`  ${lang.code} : dist/${slug}-${lang.code}.html${flag}`);

    if (wantPdf) await renderPdf(out, dist, slug, lang.code);
  }

  const nonRelu = langs.filter((l) => l.status !== 'reviewed' && l.status !== 'source');
  if (nonRelu.length) {
    console.log(`\n[!] ${nonRelu.length} langue(s) non relue(s) par un locuteur natif :`);
    console.log('    ' + nonRelu.map((l) => l.code).join(', '));
    console.log('    Ne pas imprimer avant relecture.');
  }

  console.log(`\nTermine.${wantPdf ? '' : '  Ajoutez --pdf pour le PDF et les images d\'apercu.'}`);
}

/** Navigateur deja installe sur la machine, pour eviter d'en telecharger un second. */
function findChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const candidates = [
    '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  ];
  return candidates.find((p) => existsSync(p)) || null;
}

async function renderPdf(htmlPath, dist, slug, code) {
  let puppeteer;
  try {
    // puppeteer-core n'embarque pas de navigateur : il utilise celui du systeme.
    puppeteer = (await import('puppeteer-core')).default;
  } catch {
    try {
      puppeteer = (await import('puppeteer')).default;
    } catch {
      console.log('       [!] puppeteer absent : PDF non genere');
      console.log('           npm i -D puppeteer-core   (utilise le Chrome installe)');
      return;
    }
  }

  const executablePath = findChrome();
  if (!executablePath) {
    console.log('       [!] Aucun navigateur trouve. Definissez CHROME_PATH.');
    return;
  }

  const browser = await puppeteer.launch({
    executablePath,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  const page = await browser.newPage();
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });

  await page.pdf({
    path: join(dist, `${slug}-${code}.pdf`),
    format: 'A4', landscape: true, printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 }
  });

  // Une image par page, pour l'apercu du site
  mkdirSync(join(dist, 'preview'), { recursive: true });
  const pages = await page.$$('.page');
  for (let i = 0; i < pages.length; i++) {
    await pages[i].screenshot({
      path: join(dist, 'preview', `${slug}-${code}-${i + 1}.png`)
    });
  }
  await browser.close();
  console.log(`       PDF + ${pages.length} image(s) d'apercu`);
}

main().catch((e) => { console.error('Erreur :', e.message); process.exit(1); });
