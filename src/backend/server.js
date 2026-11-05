require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { setupScheduler } = require('./services/scheduler.service');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/events', require('./routes/events.routes'));
app.use('/api/hero', require('./routes/hero.routes'));
app.use('/api/testimonials', require('./routes/testimonials.routes'));
app.use('/api/gallery', require('./routes/gallery.routes'));
app.use('/api/social-media', require('./routes/social-media.routes'));
app.use('/api/settings', require('./routes/settings.routes'));
app.use('/api/newsletter', require('./routes/newsletter.routes'));
app.use('/api/assemblies', require('./routes/assemblies.routes'));
app.use('/api/ministries', require('./routes/ministries.routes'));
app.use('/api/forms', require('./routes/forms.routes'));
app.use('/api/backup', require('./routes/backup.routes'));
app.use('/api/translations', require('./routes/translations.routes'));
app.use('/api/books', require('./routes/books.routes'));
app.use('/api/tracts', require('./routes/tracts.routes'));
app.use('/api/categories', require('./routes/categories.routes'));
app.use('/api/countdowns', require('./routes/countdowns.routes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'CMCI Backend is running' });
});

// Error handler
app.use((err, req, res, next) => {
  // Fichier envoyé depuis l'admin plus lourd que la limite de multer
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'Fichier trop lourd : réduisez sa taille et réessayez.' });
  }
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  
  // Taches automatiques (reseaux, traductions, newsletter) selon les reglages de l'admin
  setupScheduler();
  console.log('⏱️  Planificateur des taches automatiques demarre (passage toutes les 5 min)');
});
