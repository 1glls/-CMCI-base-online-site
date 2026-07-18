require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { setupCronJobs } = require('./services/newsletter-cron.service');

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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'CMCI Backend is running' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  
  // Initialize newsletter cron jobs
  setupCronJobs();
  console.log('📧 Newsletter cron jobs initialized');
});
