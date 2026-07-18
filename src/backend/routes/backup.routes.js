const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, adminMiddleware } = require('../middleware/auth.middleware');

const prisma = new PrismaClient();

// Les sauvegardes vivent a cote de la base, hors du depot git (voir .gitignore).
const BACKUP_DIR = path.join(__dirname, '..', 'backups');
const RETENTION = 8; // ~2 mois d'historique au rythme hebdomadaire

// Nom genere par nous seuls : dev-AAAAMMJJ-HHMMSS.db
const BACKUP_NAME = /^dev-\d{8}-\d{6}\.db$/;

/**
 * Ces routes ne servent JAMAIS le contenu d'une sauvegarde.
 * Le fichier contient des donnees personnelles (abonnes newsletter,
 * soumissions de formulaires, hash des mots de passe admin) : le
 * recuperer passe par SSH et le script otherthings/scripts/backup-prod-db.sh.
 * Un jeton admin compromis ne doit pas suffire a exfiltrer la base.
 */

function ensureDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

function listBackups() {
  ensureDir();
  return fs.readdirSync(BACKUP_DIR)
    .filter((name) => BACKUP_NAME.test(name))
    .map((name) => {
      const stat = fs.statSync(path.join(BACKUP_DIR, name));
      return { name, size: stat.size, createdAt: stat.mtime.toISOString() };
    })
    .sort((a, b) => b.name.localeCompare(a.name));
}

/**
 * Supprime les sauvegardes au-dela de la retention.
 * Ne touche que des noms conformes a BACKUP_NAME, dans BACKUP_DIR.
 */
function rotate() {
  const obsolete = listBackups().slice(RETENTION);
  for (const backup of obsolete) {
    try {
      fs.unlinkSync(path.join(BACKUP_DIR, backup.name));
    } catch (error) {
      console.error(`Rotation: ${backup.name} non supprime -`, error.message);
    }
  }
  return obsolete.length;
}

// GET /api/backup — liste des sauvegardes (metadonnees seules)
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    res.json({ backups: listBackups(), retention: RETENTION });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/backup — cree un instantane coherent
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    ensureDir();

    const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 15);
    const name = `dev-${stamp.slice(0, 8)}-${stamp.slice(8, 14)}.db`;
    const target = path.join(BACKUP_DIR, name);

    if (fs.existsSync(target)) {
      return res.status(409).json({ error: 'Une sauvegarde vient d\'etre creee, reessayez dans une seconde.' });
    }

    // VACUUM INTO produit un fichier coherent meme si une ecriture a lieu
    // pendant l'operation, contrairement a une simple copie du fichier.
    await prisma.$executeRawUnsafe('VACUUM INTO ?', target);

    if (!fs.existsSync(target)) {
      return res.status(500).json({ error: 'La sauvegarde n\'a pas ete creee.' });
    }

    const { size } = fs.statSync(target);
    const removed = rotate();

    res.status(201).json({
      message: 'Sauvegarde creee',
      backup: { name, size, createdAt: new Date().toISOString() },
      rotated: removed
    });
  } catch (error) {
    console.error('Sauvegarde impossible:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/backup/:name — supprime une sauvegarde precise
router.delete('/:name', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name } = req.params;

    // Le nom vient du client : on n'accepte que notre propre format.
    // Cela ferme aussi toute traversee de chemin (../, chemins absolus).
    if (!BACKUP_NAME.test(name)) {
      return res.status(400).json({ error: 'Nom de sauvegarde invalide' });
    }

    const target = path.join(BACKUP_DIR, name);
    if (path.dirname(target) !== BACKUP_DIR) {
      return res.status(400).json({ error: 'Nom de sauvegarde invalide' });
    }
    if (!fs.existsSync(target)) {
      return res.status(404).json({ error: 'Sauvegarde introuvable' });
    }

    fs.unlinkSync(target);
    res.json({ message: 'Sauvegarde supprimee' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
