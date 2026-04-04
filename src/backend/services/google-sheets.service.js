/**
 * Service Google Sheets pour CMCI Belgique
 * 
 * Utilise l'API Google Sheets v4 avec un compte de service.
 * 
 * Configuration requise dans .env :
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL=xxx@xxx.iam.gserviceaccount.com
 *   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
 * 
 * Le Google Sheet doit être partagé avec le compte de service (en éditeur).
 */

const https = require('https');
const crypto = require('crypto');

/**
 * Crée un JWT signé pour l'authentification Google
 */
function createJWT() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

  if (!email || !privateKey || privateKey.length < 100) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };

  const encode = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const unsigned = `${encode(header)}.${encode(payload)}`;
  
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(unsigned);
  const signature = sign.sign(privateKey, 'base64url');
  
  return `${unsigned}.${signature}`;
}

/**
 * Obtient un access token Google via le JWT
 */
async function getAccessToken() {
  const jwt = createJWT();
  if (!jwt) return null;

  return new Promise((resolve, reject) => {
    const postData = `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`;
    
    const req = https.request({
      hostname: 'oauth2.googleapis.com',
      path: '/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.access_token || null);
        } catch {
          resolve(null);
        }
      });
    });

    req.on('error', () => resolve(null));
    req.write(postData);
    req.end();
  });
}

/**
 * Effectue une requête HTTPS vers l'API Google Sheets
 */
function sheetsRequest(method, path, accessToken, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'sheets.googleapis.com',
      path,
      method,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data: {} });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

/**
 * Initialise un Google Sheet avec les en-têtes des champs du formulaire
 * @param {string} spreadsheetId - ID du Google Sheet
 * @param {Array} fields - Champs du formulaire [{label, type, ...}]
 * @param {string} sheetName - Nom de la feuille (défaut: 'Réponses')
 */
async function initializeSheet(spreadsheetId, fields, sheetName = 'Réponses') {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    console.log('⚠️ Google Sheets: pas de credentials configurés, fonctionnalité désactivée');
    return false;
  }

  try {
    // Écrire les en-têtes : Horodatage + tous les labels des champs
    const headers = ['Horodatage', ...fields.map(f => f.label)];
    
    const result = await sheetsRequest(
      'PUT',
      `/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1?valueInputOption=RAW`,
      accessToken,
      {
        range: `${sheetName}!A1`,
        majorDimension: 'ROWS',
        values: [headers]
      }
    );

    if (result.status === 200) {
      console.log(`✅ Google Sheet initialisé avec ${headers.length} colonnes`);
      return true;
    } else {
      console.error('❌ Erreur initialisation Google Sheet:', result.data);
      return false;
    }
  } catch (error) {
    console.error('❌ Erreur Google Sheets:', error.message);
    return false;
  }
}

/**
 * Ajoute une soumission au Google Sheet
 * @param {string} spreadsheetId - ID du Google Sheet
 * @param {Array} fields - Définitions des champs du formulaire
 * @param {Object} submissionData - Données soumises {fieldId: value}
 * @param {string} sheetName - Nom de la feuille
 */
async function appendSubmission(spreadsheetId, fields, submissionData, sheetName = 'Réponses') {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    console.log('⚠️ Google Sheets: pas de credentials, soumission non envoyée au Sheet');
    return false;
  }

  try {
    // Construire la ligne : Horodatage + valeurs dans l'ordre des champs
    const timestamp = new Date().toLocaleString('fr-BE', { timeZone: 'Europe/Brussels' });
    const row = [timestamp];
    
    for (const field of fields) {
      const value = submissionData[field.id] || submissionData[field.label] || '';
      // Pour les checkboxes/multi-select, joindre les valeurs
      if (Array.isArray(value)) {
        row.push(value.join(', '));
      } else {
        row.push(String(value));
      }
    }

    const result = await sheetsRequest(
      'POST',
      `/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A:A:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
      accessToken,
      {
        range: `${sheetName}!A:A`,
        majorDimension: 'ROWS',
        values: [row]
      }
    );

    if (result.status === 200) {
      console.log('✅ Soumission ajoutée au Google Sheet');
      return true;
    } else {
      console.error('❌ Erreur append Google Sheet:', result.data);
      return false;
    }
  } catch (error) {
    console.error('❌ Erreur Google Sheets append:', error.message);
    return false;
  }
}

/**
 * Vérifie si la connexion Google Sheets est configurée
 */
function isGoogleSheetsConfigured() {
  return !!(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY);
}

module.exports = {
  initializeSheet,
  appendSubmission,
  isGoogleSheetsConfigured
};
