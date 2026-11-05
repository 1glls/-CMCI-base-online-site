const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Creation d'un compte admin.
 *   - Aucun admin en base (tout premier lancement) : ouvert, pour creer le premier compte.
 *   - Sinon : reserve a un admin deja connecte (jeton valide de role « admin »).
 * Sans cette garde, n'importe qui pouvait se creer un compte admin sur le site en ligne.
 * Sur le serveur, un compte peut aussi etre cree sans passer par l'API :
 * `node scripts/creer-admin.js` (voir CREER-ADMIN.txt).
 */
async function onlyFirstAdminOrAdmin(req, res, next) {
  try {
    const count = await prisma.admin.count();
    if (count === 0) return next();
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(403).json({ error: 'Création de compte réservée à un administrateur connecté.' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Création de compte réservée à un administrateur connecté.' });
    }
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

router.post('/register', onlyFirstAdminOrAdmin, async (req, res) => {
  try {
    const { email, password, name } = req.body || {};
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, mot de passe et nom sont obligatoires.' });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères.' });
    }

    // Vérifier si l'admin existe déjà
    const existingAdmin = await prisma.admin.findUnique({ where: { email } });
    if (existingAdmin) {
      return res.status(400).json({ error: 'Admin already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'admin
    const admin = await prisma.admin.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    res.status(201).json({ 
      message: 'Admin created successfully',
      admin: { id: admin.id, email: admin.email, name: admin.name }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Trouver l'admin
    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Vérifier le mot de passe
    const isValidPassword = await bcrypt.compare(password, admin.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Générer token
    const token = jwt.sign(
      { userId: admin.id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
