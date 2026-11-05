/**
 * Recuperation des publications des reseaux sociaux de l'eglise.
 *
 *   YouTube   : cle API + ID de chaine (n'expirent jamais). Playlist « uploads »
 *               de la chaine : 1 unite de quota par appel (contre 100 pour search).
 *   Facebook  : jeton de Page longue duree (API Graph).
 *   Instagram : compte professionnel relie a la Page Facebook (API Graph via
 *               graph.facebook.com ; l'ancienne API « Basic Display » est arretee).
 *   TikTok    : Display API v2. Le jeton d'acces dure 24 h : il est renouvele
 *               automatiquement grace au refresh token (valable 365 jours).
 *
 * Les identifiants sont saisis dans l'admin (table social_accounts). Les
 * anciennes variables du fichier .env servent encore de secours.
 * Les erreurs ne sont plus avalees : chaque reseau renvoie un message clair.
 */
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const sharp = require('sharp');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const PLATFORMS = ['youtube', 'facebook', 'instagram', 'tiktok'];
const GRAPH = 'https://graph.facebook.com/v21.0';
const TIKTOK = 'https://open.tiktokapis.com/v2';
const LIMIT = 10;
const THUMB_DIR = path.join(__dirname, '..', 'uploads', 'social');

/** Champs de chaque reseau : `secret` = jamais renvoye en entier au navigateur. */
const FIELDS = {
  youtube: [
    { key: 'apiKey', label: 'Clé API YouTube Data v3', secret: true, required: true, env: 'YOUTUBE_API_KEY' },
    { key: 'channelId', label: 'ID de la chaîne (commence par UC…)', required: true, env: 'YOUTUBE_CHANNEL_ID' },
  ],
  facebook: [
    { key: 'pageId', label: 'ID de la Page Facebook', required: true, env: 'FACEBOOK_PAGE_ID' },
    { key: 'accessToken', label: 'Jeton de Page (longue durée)', secret: true, required: true, env: 'FACEBOOK_ACCESS_TOKEN' },
  ],
  instagram: [
    { key: 'igUserId', label: 'ID du compte Instagram professionnel', required: true, env: 'INSTAGRAM_USER_ID' },
    { key: 'accessToken', label: 'Jeton de Page (laisser vide : celui de Facebook est utilisé)', secret: true, env: 'INSTAGRAM_ACCESS_TOKEN' },
  ],
  tiktok: [
    { key: 'clientKey', label: 'Client key de l\'app TikTok', required: true, env: 'TIKTOK_CLIENT_KEY' },
    { key: 'clientSecret', label: 'Client secret de l\'app TikTok', secret: true, required: true, env: 'TIKTOK_CLIENT_SECRET' },
    { key: 'refreshToken', label: 'Refresh token (rempli par « Connecter TikTok »)', secret: true, required: true, env: 'TIKTOK_REFRESH_TOKEN' },
    { key: 'accessToken', label: 'Jeton d\'accès (renouvelé automatiquement)', secret: true, env: 'TIKTOK_ACCESS_TOKEN' },
  ],
};

const NAMES = { youtube: 'YouTube', facebook: 'Facebook', instagram: 'Instagram', tiktok: 'TikTok' };

/** Erreur destinee a l'administrateur (message en francais). */
class SocialError extends Error {
  constructor(message, code = 'error') {
    super(message);
    this.code = code;
  }
}

/* ------------------------------ identifiants ------------------------------ */

// Valeurs d'exemple du .env d'origine (« your_youtube_api_key »…) = non configure
const isPlaceholder = (v) => !v || /^your[_-]/i.test(String(v)) || /^(xxx|changeme|todo)$/i.test(String(v));
const clean = (v) => (isPlaceholder(v) ? '' : String(v).trim());

function parseCredentials(raw) {
  try { return JSON.parse(raw || '{}') || {}; } catch { return {}; }
}

async function getAccount(platform) {
  return prisma.socialAccount.findUnique({ where: { platform } });
}

/** Identifiants effectifs : base de donnees d'abord, puis .env en secours. */
async function credentialsFor(platform) {
  const account = await getAccount(platform);
  const saved = parseCredentials(account?.credentials);
  const creds = {};
  const sources = {};
  for (const f of FIELDS[platform]) {
    const fromDb = clean(saved[f.key]);
    const fromEnv = clean(process.env[f.env]);
    creds[f.key] = fromDb || fromEnv;
    sources[f.key] = fromDb ? 'admin' : fromEnv ? 'env' : null;
  }
  // Instagram : meme jeton de Page que Facebook si aucun n'est saisi
  if (platform === 'instagram' && !creds.accessToken) {
    creds.accessToken = (await credentialsFor('facebook')).creds.accessToken;
    if (creds.accessToken) sources.accessToken = 'facebook';
  }
  return { account, creds, sources };
}

function assertConfigured(platform, creds) {
  const missing = FIELDS[platform].filter((f) => f.required && !creds[f.key]).map((f) => f.label);
  if (platform === 'instagram' && !creds.accessToken) missing.push('jeton de Page (Facebook ou Instagram)');
  if (missing.length) {
    throw new SocialError(`Non configuré : il manque ${missing.join(', ')}.`, 'not_configured');
  }
}

async function saveAccount(platform, data) {
  return prisma.socialAccount.upsert({
    where: { platform },
    update: data,
    create: { platform, ...data },
  });
}

/* --------------------------- traduction des erreurs -------------------------- */

function explain(platform, error) {
  if (error instanceof SocialError) return error;
  const res = error.response;
  const data = res?.data;

  if (!res) {
    if (['ENOTFOUND', 'EAI_AGAIN', 'ECONNREFUSED', 'ETIMEDOUT', 'ECONNABORTED'].includes(error.code)) {
      return new SocialError(`${NAMES[platform]} injoignable depuis le serveur (réseau ou délai dépassé). Réessayez plus tard.`, 'network');
    }
    return new SocialError(`Erreur inattendue : ${error.message}`);
  }

  if (platform === 'youtube') {
    // Google donne deux niveaux de raison : errors[0].reason (ancien format) et
    // details[].reason (ErrorInfo, plus precis : API_KEY_HTTP_REFERRER_BLOCKED…).
    const err = data?.error || {};
    const reason = err.errors?.[0]?.reason || '';
    const info = (err.details || []).find((d) => d.reason)?.reason || '';
    const google = err.message ? ` (Google : « ${err.message} »)` : '';
    const all = `${reason} ${info} ${err.message || ''}`;

    if (/API_KEY_HTTP_REFERRER_BLOCKED|referer/i.test(all)) {
      return new SocialError(`Clé restreinte aux sites web (« Référents HTTP ») : le serveur du site ne peut pas l'utiliser. Google Cloud → Identifiants → votre clé → « Restrictions relatives aux applications » : choisissez « Aucune » ou « Adresses IP » (avec l'adresse IP du serveur), puis enregistrez.${google}`, 'config');
    }
    if (/API_KEY_IP_ADDRESS_BLOCKED|ip address/i.test(all)) {
      return new SocialError(`Clé restreinte à certaines adresses IP, et celle du serveur n'en fait pas partie. Ajoutez l'IP du serveur dans les restrictions de la clé (Google Cloud → Identifiants).${google}`, 'config');
    }
    if (/API_KEY_SERVICE_BLOCKED|are blocked/i.test(all)) {
      return new SocialError(`Les « Restrictions d'API » de cette clé n'autorisent pas YouTube Data API v3. Google Cloud → Identifiants → votre clé → Restrictions relatives aux API : ajoutez « YouTube Data API v3 » (ou choisissez « Ne pas restreindre la clé »).${google}`, 'config');
    }
    if (/API_KEY_INVALID|keyInvalid/i.test(all)) {
      return new SocialError(`Clé API YouTube invalide : vérifiez qu'elle est copiée en entier (elle commence par AIza…).${google}`, 'auth');
    }
    if (/quotaExceeded|dailyLimitExceeded|RATE_LIMIT/i.test(all)) {
      return new SocialError('Quota YouTube du jour atteint : la synchronisation reprendra demain.', 'quota');
    }
    if (/accessNotConfigured|SERVICE_DISABLED|has not been used|is disabled/i.test(all)) {
      return new SocialError(`« YouTube Data API v3 » n'est pas activée dans le projet Google Cloud de CETTE clé (vérifiez que la clé et l'activation sont dans le même projet). Si vous venez de l'activer, attendez 5 minutes puis réessayez.${google}`, 'auth');
    }
    return new SocialError(`YouTube a refusé la demande (code ${res.status}).${google}`);
  }

  if (platform === 'facebook' || platform === 'instagram') {
    const e = data?.error || {};
    if (e.code === 190) return new SocialError('Jeton expiré ou invalide : générez un nouveau jeton de Page longue durée et enregistrez-le.', 'auth');
    if (e.code === 10 || e.code === 200 || (e.code >= 200 && e.code < 300)) {
      return new SocialError(`Permission manquante pour lire ${platform === 'facebook' ? 'la Page' : 'le compte Instagram'} (pages_read_engagement${platform === 'instagram' ? ', instagram_basic' : ''}).`, 'auth');
    }
    if (e.code === 100) return new SocialError(`Identifiant introuvable : vérifiez l'ID ${platform === 'facebook' ? 'de la Page' : 'du compte Instagram professionnel'}.`, 'config');
    if ([4, 17, 32, 613].includes(e.code)) return new SocialError('Trop de demandes envoyées à Meta : réessayez dans une heure.', 'quota');
    return new SocialError(`${NAMES[platform]} a refusé la demande : ${e.message || res.status}`);
  }

  if (platform === 'tiktok') {
    const code = data?.error?.code || data?.error || '';
    if (/invalid_grant|refresh_token/.test(code)) return new SocialError('Connexion TikTok expirée : cliquez sur « Connecter TikTok » pour la renouveler.', 'auth');
    if (/invalid_client|client_key/.test(code)) return new SocialError('Client key ou client secret TikTok incorrect.', 'config');
    if (/scope_not_authorized/.test(code)) return new SocialError('Autorisation « video.list » manquante : reconnectez TikTok en acceptant toutes les permissions.', 'auth');
    if (/access_token_invalid/.test(code)) return new SocialError('Jeton TikTok invalide : reconnectez le compte.', 'auth');
    return new SocialError(`TikTok a refusé la demande : ${data?.error?.message || data?.error_description || code || res.status}`);
  }
  return new SocialError(error.message);
}

/* --------------------------------- outils -------------------------------- */

/** Premiere phrase (ou debut) d'un texte, pour servir de titre. */
function firstSentence(text, max = 110) {
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  if (!t) return null;
  const sentence = t.split(/(?<=[.!?…])\s/)[0];
  const s = sentence.length <= max ? sentence : `${sentence.slice(0, max).replace(/\s+\S*$/, '')}…`;
  return s;
}

/** Copie locale de la miniature (les liens Facebook / Instagram expirent). */
async function saveThumbnail(url, postId) {
  if (!url) return null;
  try {
    const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
    fs.mkdirSync(THUMB_DIR, { recursive: true });
    const name = `${postId.replace(/[^a-z0-9_-]/gi, '_')}.webp`;
    await sharp(Buffer.from(res.data)).resize({ width: 720, withoutEnlargement: true }).webp({ quality: 78 }).toFile(path.join(THUMB_DIR, name));
    return `/uploads/social/${name}`;
  } catch (e) {
    console.warn(`Miniature non copiee (${postId}) : ${e.message}`);
    return null;
  }
}

/* ------------------------------ chaque reseau ------------------------------ */

async function fetchYouTube({ apiKey, channelId }) {
  const base = 'https://www.googleapis.com/youtube/v3';
  const ch = await axios.get(`${base}/channels`, { params: { part: 'contentDetails,snippet', id: channelId, key: apiKey }, timeout: 15000 });
  const channel = ch.data.items?.[0];
  if (!channel) throw new SocialError('Chaîne introuvable : vérifiez l\'ID de la chaîne (il commence par « UC »).', 'config');
  const uploads = channel.contentDetails.relatedPlaylists.uploads;
  const list = await axios.get(`${base}/playlistItems`, {
    params: { part: 'snippet,contentDetails,status', playlistId: uploads, maxResults: LIMIT, key: apiKey },
    timeout: 15000,
  });
  const posts = (list.data.items || [])
    .filter((it) => it.status?.privacyStatus !== 'private' && it.snippet?.title !== 'Private video')
    .map((it) => {
      const id = it.contentDetails.videoId;
      const th = it.snippet.thumbnails || {};
      return {
        platform: 'youtube',
        postId: `youtube_${id}`,
        title: it.snippet.title,
        content: it.snippet.description || '',
        mediaUrl: `https://www.youtube.com/watch?v=${id}`,
        thumbnailUrl: (th.maxres || th.standard || th.high || th.medium || th.default || {}).url || null,
        author: channel.snippet.title,
        publishedAt: new Date(it.contentDetails.videoPublishedAt || it.snippet.publishedAt),
        isVideo: true,
      };
    });
  return { name: channel.snippet.title, posts };
}

async function fetchFacebook({ pageId, accessToken }) {
  const page = await axios.get(`${GRAPH}/${pageId}`, { params: { fields: 'name', access_token: accessToken }, timeout: 15000 });
  const res = await axios.get(`${GRAPH}/${pageId}/posts`, {
    params: { fields: 'id,message,created_time,full_picture,permalink_url,attachments{media_type}', limit: LIMIT, access_token: accessToken },
    timeout: 15000,
  });
  const posts = (res.data.data || [])
    .filter((p) => p.message || p.full_picture)
    .map((p) => ({
      platform: 'facebook',
      postId: `facebook_${p.id}`,
      title: firstSentence(p.message),
      content: p.message || '',
      mediaUrl: p.permalink_url,
      thumbnailUrl: p.full_picture || null,
      author: page.data.name,
      publishedAt: new Date(p.created_time),
      isVideo: /video/i.test(p.attachments?.data?.[0]?.media_type || ''),
    }));
  return { name: page.data.name, posts };
}

async function fetchInstagram({ igUserId, accessToken }) {
  const user = await axios.get(`${GRAPH}/${igUserId}`, { params: { fields: 'username', access_token: accessToken }, timeout: 15000 });
  const res = await axios.get(`${GRAPH}/${igUserId}/media`, {
    params: { fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp', limit: LIMIT, access_token: accessToken },
    timeout: 15000,
  });
  const name = `@${user.data.username}`;
  const posts = (res.data.data || []).map((p) => ({
    platform: 'instagram',
    postId: `instagram_${p.id}`,
    title: firstSentence(p.caption),
    content: p.caption || '',
    mediaUrl: p.permalink,
    thumbnailUrl: p.thumbnail_url || p.media_url || null,
    author: name,
    publishedAt: new Date(p.timestamp),
    isVideo: p.media_type === 'VIDEO',
  }));
  return { name, posts };
}

/** TikTok : renouvelle le jeton d'acces (24 h) avec le refresh token si besoin. */
async function tiktokAccessToken(creds, account) {
  const valid = creds.accessToken && account?.accessExpiresAt && account.accessExpiresAt.getTime() > Date.now() + 5 * 60 * 1000;
  if (valid) return creds.accessToken;
  const res = await axios.post(`${TIKTOK}/oauth/token/`, new URLSearchParams({
    client_key: creds.clientKey,
    client_secret: creds.clientSecret,
    grant_type: 'refresh_token',
    refresh_token: creds.refreshToken,
  }).toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 15000 });
  if (res.data.error) throw explain('tiktok', { response: { status: 400, data: { error: { code: res.data.error, message: res.data.error_description } } } });
  await storeTikTokTokens(res.data);
  return res.data.access_token;
}

/** Enregistre les jetons TikTok recus (connexion ou renouvellement). */
async function storeTikTokTokens(tokens) {
  const account = await getAccount('tiktok');
  const saved = parseCredentials(account?.credentials);
  saved.accessToken = tokens.access_token;
  if (tokens.refresh_token) saved.refreshToken = tokens.refresh_token;
  await saveAccount('tiktok', {
    credentials: JSON.stringify(saved),
    accessExpiresAt: new Date(Date.now() + (tokens.expires_in || 86400) * 1000),
  });
}

async function fetchTikTok(creds, account) {
  const token = await tiktokAccessToken(creds, account);
  const auth = { headers: { Authorization: `Bearer ${token}` }, timeout: 15000 };
  let name = 'TikTok';
  try {
    const u = await axios.get(`${TIKTOK}/user/info/`, { ...auth, params: { fields: 'display_name' } });
    name = u.data?.data?.user?.display_name || name;
  } catch { /* nom facultatif */ }
  const res = await axios.post(`${TIKTOK}/video/list/`, { max_count: LIMIT }, {
    ...auth,
    params: { fields: 'id,title,video_description,cover_image_url,share_url,create_time' },
    headers: { ...auth.headers, 'Content-Type': 'application/json' },
  });
  if (res.data?.error?.code && res.data.error.code !== 'ok') throw explain('tiktok', { response: { status: 400, data: res.data } });
  const posts = (res.data?.data?.videos || []).map((v) => ({
    platform: 'tiktok',
    postId: `tiktok_${v.id}`,
    title: v.title || firstSentence(v.video_description),
    content: v.video_description || v.title || '',
    mediaUrl: v.share_url,
    thumbnailUrl: v.cover_image_url || null,
    author: name,
    publishedAt: new Date(v.create_time * 1000),
    isVideo: true,
  }));
  return { name, posts };
}

async function fetchPlatform(platform) {
  const { account, creds } = await credentialsFor(platform);
  assertConfigured(platform, creds);
  try {
    if (platform === 'youtube') return await fetchYouTube(creds);
    if (platform === 'facebook') return await fetchFacebook(creds);
    if (platform === 'instagram') return await fetchInstagram(creds);
    if (platform === 'tiktok') return await fetchTikTok(creds, account);
  } catch (e) {
    throw explain(platform, e);
  }
  throw new SocialError(`Réseau inconnu : ${platform}`);
}

/* ---------------------------- tester / synchroniser --------------------------- */

/** Teste la connexion sans rien enregistrer comme publication. */
async function testPlatform(platform) {
  try {
    const { name, posts } = await fetchPlatform(platform);
    await saveAccount(platform, { accountName: name, lastError: null });
    return { ok: true, platform, name, count: posts.length };
  } catch (e) {
    const err = explain(platform, e);
    if (err.code !== 'not_configured') await saveAccount(platform, { lastError: err.message });
    return { ok: false, platform, error: err.message, code: err.code };
  }
}

/** Recupere les nouvelles publications d'un reseau et les enregistre. */
async function syncPlatform(platform) {
  const account = await getAccount(platform);
  if (account && !account.enabled) return { platform, ok: true, skipped: true, total: 0, nouveaux: 0 };
  try {
    const { name, posts } = await fetchPlatform(platform);
    let nouveaux = 0;
    for (const post of posts) {
      const existing = await prisma.socialMediaPost.findUnique({ where: { postId: post.postId } });
      if (existing) {
        // Complete les anciens posts (avant l'ajout du titre / de la miniature locale)
        if (!existing.title || !existing.localThumbnail) {
          await prisma.socialMediaPost.update({
            where: { id: existing.id },
            data: {
              title: existing.title || post.title,
              isVideo: post.isVideo,
              localThumbnail: existing.localThumbnail || (await saveThumbnail(post.thumbnailUrl, post.postId)),
            },
          });
        }
        continue;
      }
      await prisma.socialMediaPost.create({
        data: {
          ...post,
          localThumbnail: await saveThumbnail(post.thumbnailUrl, post.postId),
          status: account?.autoApprove ? 'approved' : 'pending',
        },
      });
      nouveaux++;
    }
    await saveAccount(platform, { accountName: name, lastSyncAt: new Date(), lastCount: nouveaux, lastError: null });
    return { platform, ok: true, name, total: posts.length, nouveaux };
  } catch (e) {
    const err = explain(platform, e);
    if (err.code !== 'not_configured') await saveAccount(platform, { lastSyncAt: new Date(), lastError: err.message });
    return { platform, ok: false, error: err.message, code: err.code, total: 0, nouveaux: 0 };
  }
}

async function syncAll() {
  const results = [];
  for (const p of PLATFORMS) results.push(await syncPlatform(p));
  return results;
}

/* ------------------------------ connexion TikTok ----------------------------- */

const TIKTOK_SCOPES = 'user.info.basic,video.list';

async function tiktokAuthorizeUrl(redirectUri, state) {
  const { creds } = await credentialsFor('tiktok');
  if (!creds.clientKey || !creds.clientSecret) {
    throw new SocialError('Enregistrez d\'abord la client key et le client secret de l\'app TikTok.', 'not_configured');
  }
  const params = new URLSearchParams({
    client_key: creds.clientKey,
    scope: TIKTOK_SCOPES,
    response_type: 'code',
    redirect_uri: redirectUri,
    state,
  });
  return `https://www.tiktok.com/v2/auth/authorize/?${params}`;
}

async function tiktokExchangeCode(code, redirectUri) {
  const { creds } = await credentialsFor('tiktok');
  try {
    const res = await axios.post(`${TIKTOK}/oauth/token/`, new URLSearchParams({
      client_key: creds.clientKey,
      client_secret: creds.clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }).toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 15000 });
    if (res.data.error) throw { response: { status: 400, data: { error: { code: res.data.error, message: res.data.error_description } } } };
    await storeTikTokTokens(res.data);
    await saveAccount('tiktok', { lastError: null });
  } catch (e) {
    throw explain('tiktok', e);
  }
}

module.exports = {
  PLATFORMS,
  FIELDS,
  NAMES,
  SocialError,
  explain, // exporte pour les tests
  credentialsFor,
  parseCredentials,
  getAccount,
  saveAccount,
  testPlatform,
  syncPlatform,
  syncAll,
  tiktokAuthorizeUrl,
  tiktokExchangeCode,
};
