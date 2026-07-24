/**
 * Traduction assistee du contenu de la base.
 *
 * Plusieurs comptes fournisseurs peuvent coexister : le service prend le
 * premier compte actif non epuise, par ordre de priorite, et bascule sur le
 * suivant des que le quota est atteint.
 *
 * Regles importantes :
 *   - on ne traduit QUE du contenu public (titres, descriptions). Jamais de
 *     donnees d'abonnes ni de soumissions de formulaires : elles ne doivent
 *     pas transiter par un service tiers.
 *   - une traduction produite ici est marquee auto=true / reviewed=false.
 *     Elle est affichee (mieux qu'un repli en francais) mais signalee comme
 *     non relue dans l'admin.
 */

const https = require('https');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DEEPL_FREE_HOST = 'api-free.deepl.com';
const DEEPL_PRO_HOST = 'api.deepl.com';

function deeplHost(apiKey) {
  // Le suffixe :fx identifie une cle de l'offre gratuite.
  return apiKey.trim().endsWith(':fx') ? DEEPL_FREE_HOST : DEEPL_PRO_HOST;
}

function request(host, path, apiKey, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? new URLSearchParams(body).toString() : null;
    const req = https.request(
      {
        host,
        path,
        method: payload ? 'POST' : 'GET',
        headers: {
          Authorization: `DeepL-Auth-Key ${apiKey}`,
          ...(payload
            ? {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(payload)
              }
            : {})
        }
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          let parsed = null;
          try { parsed = data ? JSON.parse(data) : null; } catch { /* reponse non JSON */ }
          resolve({ status: res.statusCode, body: parsed, raw: data });
        });
      }
    );
    req.on('error', reject);
    req.setTimeout(20000, () => req.destroy(new Error('Delai depasse')));
    if (payload) req.write(payload);
    req.end();
  });
}

/** Compte utilisable : actif, non epuise, quota local restant. */
async function pickProvider() {
  const providers = await prisma.translationProvider.findMany({
    where: { active: true, exhausted: false },
    orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }]
  });
  return providers.find((p) => p.charactersUsed < p.characterLimit) || null;
}

/** Releve la consommation reelle cote fournisseur (fait autorite). */
async function refreshUsage(providerId) {
  const provider = await prisma.translationProvider.findUnique({ where: { id: providerId } });
  if (!provider) throw new Error('Compte introuvable');

  const res = await request(deeplHost(provider.apiKey), '/v2/usage', provider.apiKey);

  if (res.status === 403) {
    await prisma.translationProvider.update({
      where: { id: providerId },
      data: { active: false, lastError: 'Cle refusee (403)' }
    });
    throw new Error('Cle API refusee');
  }
  if (res.status !== 200 || !res.body) {
    throw new Error(`Releve impossible (HTTP ${res.status})`);
  }

  const remoteUsed = res.body.character_count ?? null;
  const remoteLimit = res.body.character_limit ?? null;

  return prisma.translationProvider.update({
    where: { id: providerId },
    data: {
      remoteUsed,
      remoteLimit,
      lastCheckedAt: new Date(),
      lastError: null,
      // Le releve distant fait autorite : on realigne le quota local dessus.
      ...(remoteLimit ? { characterLimit: remoteLimit } : {}),
      ...(remoteUsed !== null ? { charactersUsed: remoteUsed } : {}),
      ...(remoteUsed !== null && remoteLimit ? { exhausted: remoteUsed >= remoteLimit } : {})
    }
  });
}

/**
 * Traduit un lot de textes. Bascule de compte si le quota est atteint.
 * Renvoie { translations: string[], provider, characters }.
 */
async function translateBatch(texts, targetLang, sourceLang = 'FR', options = {}) {
  const clean = texts.map((t) => (t ?? '').toString());
  const characters = clean.reduce((n, t) => n + t.length, 0);
  if (characters === 0) return { translations: clean, provider: null, characters: 0 };

  const tried = [];
  // Au plus 5 bascules : au-dela, le probleme n'est pas le quota.
  for (let attempt = 0; attempt < 5; attempt++) {
    const provider = await pickProvider();
    if (!provider) {
      throw new Error(
        tried.length
          ? `Quota epuise sur ${tried.length} compte(s). Ajoutez un compte dans l'admin.`
          : "Aucun compte de traduction actif. Ajoutez-en un dans l'admin."
      );
    }
    tried.push(provider.id);

    // DeepL attend un parametre `text` repete pour traduire un lot : le corps
    // est donc encode a la main plutot que via un objet cle/valeur.
    const params = new URLSearchParams({
      target_lang: targetLang.toUpperCase(),
      source_lang: sourceLang.toUpperCase()
    });
    // tag_handling=html : DeepL preserve balises, classes et attributs, et
    // ne traduit que le texte. C'est ce qui rend un tract HTML traduisible
    // la ou un PDF ne l'est pas.
    if (options.tagHandling) params.set('tag_handling', options.tagHandling);
    clean.forEach((t) => params.append('text', t));

    const manual = await requestRaw(
      deeplHost(provider.apiKey),
      '/v2/translate',
      provider.apiKey,
      params.toString()
    );

    if (manual.status === 456) {
      // 456 = quota depasse cote DeepL : on marque et on passe au suivant.
      await prisma.translationProvider.update({
        where: { id: provider.id },
        data: { exhausted: true, lastError: 'Quota depasse (456)' }
      });
      continue;
    }
    if (manual.status === 403) {
      await prisma.translationProvider.update({
        where: { id: provider.id },
        data: { active: false, lastError: 'Cle refusee (403)' }
      });
      continue;
    }
    if (manual.status !== 200 || !manual.body?.translations) {
      await prisma.translationProvider.update({
        where: { id: provider.id },
        data: { lastError: `HTTP ${manual.status}` }
      });
      throw new Error(`Traduction impossible (HTTP ${manual.status})`);
    }

    await prisma.translationProvider.update({
      where: { id: provider.id },
      data: { charactersUsed: { increment: characters }, lastError: null }
    });

    return {
      translations: manual.body.translations.map((t) => t.text),
      provider: { id: provider.id, name: provider.name },
      characters
    };
  }

  throw new Error('Tous les comptes de traduction ont echoue.');
}

/** Variante acceptant un corps deja encode (necessaire pour les cles repetees). */
function requestRaw(host, path, apiKey, payload) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        host,
        path,
        method: 'POST',
        headers: {
          Authorization: `DeepL-Auth-Key ${apiKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(payload)
        }
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          let parsed = null;
          try { parsed = data ? JSON.parse(data) : null; } catch { /* non JSON */ }
          resolve({ status: res.statusCode, body: parsed, raw: data });
        });
      }
    );
    req.on('error', reject);
    req.setTimeout(20000, () => req.destroy(new Error('Delai depasse')));
    req.write(payload);
    req.end();
  });
}

/** Champs traduisibles par modele. Tout le reste est ignore. */
const TRANSLATABLE = {
  // Les libelles de boutons sont saisis en admin : ils doivent suivre la
  // langue comme le reste, sinon un « Je viens » francais subsiste au milieu
  // d'une page neerlandaise.
  Event: ['title', 'description', 'location', 'registrationButtonText', 'exploreButtonText'],
  Ministry: ['title', 'description'],
  Assembly: ['name', 'description', 'schedule'],
  Testimonial: ['quote', 'role'],
  HeroSlide: ['title', 'subtitle', 'buttonText'],
  Category: ['name'],
  // Titre et description de catalogue. `author` n'est pas traduit : c'est un
  // nom de personne.
  Book: ['title', 'description'],
  Tract: ['title', 'description']
};

/**
 * Traduit un enregistrement vers une langue et enregistre le resultat.
 * N'ecrase jamais une traduction relue par un humain (reviewed=true).
 */
async function translateRecord(model, recordId, source, targetLang, onlyFields = null) {
  const all = TRANSLATABLE[model];
  if (!all) throw new Error(`Modele non traduisible : ${model}`);
  const fields = onlyFields ? all.filter((f) => onlyFields.includes(f)) : all;
  if (fields.length === 0) return { translated: 0, skipped: 0 };

  const existing = await prisma.contentTranslation.findMany({
    where: { model, recordId, language: targetLang }
  });
  const reviewed = new Set(existing.filter((e) => e.reviewed).map((e) => e.field));

  const todo = fields.filter((f) => source[f] && !reviewed.has(f));
  if (todo.length === 0) return { translated: 0, skipped: fields.length };

  const { translations } = await translateBatch(todo.map((f) => source[f]), targetLang);

  for (let i = 0; i < todo.length; i++) {
    await prisma.contentTranslation.upsert({
      where: {
        model_recordId_language_field: {
          model, recordId, language: targetLang, field: todo[i]
        }
      },
      create: {
        model, recordId, language: targetLang, field: todo[i],
        value: translations[i], auto: true, reviewed: false
      },
      update: { value: translations[i], auto: true, reviewed: false }
    });
  }

  return { translated: todo.length, skipped: fields.length - todo.length };
}

/**
 * Applique les traductions disponibles a une liste d'enregistrements.
 * Repli sur le francais quand la traduction manque : un contenu non traduit
 * reste visible plutot que de disparaitre.
 */
async function applyTranslations(model, records, language) {
  if (!language || language === 'fr' || records.length === 0) return records;

  const rows = await prisma.contentTranslation.findMany({
    where: { model, language, recordId: { in: records.map((r) => r.id) } }
  });
  if (rows.length === 0) return records;

  const byRecord = new Map();
  for (const row of rows) {
    if (!byRecord.has(row.recordId)) byRecord.set(row.recordId, {});
    byRecord.get(row.recordId)[row.field] = row.value;
  }

  return records.map((r) => ({ ...r, ...(byRecord.get(r.id) || {}) }));
}


/** Langues cibles du site. Le francais est la langue source. */
const TARGET_LANGUAGES = ['en', 'nl'];

/**
 * Traduit un enregistrement en arriere-plan, sans bloquer la reponse HTTP
 * ni la faire echouer : une panne de DeepL ne doit pas empecher un
 * administrateur d'enregistrer son contenu.
 *
 * `changedFields` limite le travail aux champs reellement modifies. A la
 * creation, passer null pour tout traduire.
 */
function autoTranslate(model, record, changedFields = null) {
  if (!TRANSLATABLE[model] || !record?.id) return;

  // Rien de traduisible n'a bouge : on ne consomme pas de quota et on
  // n'ecrase pas d'eventuelles corrections humaines.
  if (changedFields && changedFields.length === 0) return;

  setImmediate(async () => {
    for (const lang of TARGET_LANGUAGES) {
      try {
        await translateRecord(model, record.id, record, lang, changedFields);
      } catch (e) {
        console.error(`Traduction auto ${model}/${record.id}/${lang} :`, e.message);
      }
    }
  });
}

/**
 * Champs traduisibles dont le texte francais a change entre deux versions.
 */
function changedTranslatableFields(model, before, after) {
  const fields = TRANSLATABLE[model] || [];
  return fields.filter((f) => {
    const a = before?.[f] ?? null;
    const b = after?.[f] ?? null;
    return b && a !== b;
  });
}

/**
 * Traduit un document HTML complet en preservant sa mise en forme.
 * Le CSS et les images embarquees ne sont pas envoyes : voir utils/html-tract.
 */
async function translateHtmlDocument(html, targetLang) {
  const { translateDocument } = require('../utils/html-tract');
  return translateDocument(html, targetLang, async (chunks, lang) => {
    const { translations } = await translateBatch(chunks, lang, 'FR', { tagHandling: 'html' });
    return translations;
  });
}

module.exports = {
  translateHtmlDocument,
  autoTranslate,
  changedTranslatableFields,
  TARGET_LANGUAGES,
  translateBatch,
  translateRecord,
  applyTranslations,
  refreshUsage,
  pickProvider,
  TRANSLATABLE
};
