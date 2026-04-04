const nodemailer = require('nodemailer');

// Configuration du transporteur email
const createTransporter = () => {
  // Configuration pour différents fournisseurs d'email
  const emailConfig = {
    // Gmail
    gmail: {
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD // Utiliser un mot de passe d'application
      }
    },
    // SMTP générique
    smtp: {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    }
  };

  // Choisir la configuration automatiquement
  let provider = process.env.EMAIL_PROVIDER;
  
  // Détection automatique si EMAIL_PROVIDER n'est pas défini
  if (!provider) {
    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      // Si EMAIL_USER/PASSWORD sont définis, utiliser Gmail
      provider = 'gmail';
    } else if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      // Sinon, essayer SMTP
      provider = 'smtp';
    } else {
      throw new Error('Configuration email manquante. Veuillez configurer EMAIL_USER/EMAIL_PASSWORD ou SMTP_HOST/SMTP_USER dans .env');
    }
  }
  
  return nodemailer.createTransport(emailConfig[provider]);
};

// Envoyer un email simple
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'CMCI Belgique'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '') // Fallback texte sans HTML
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email envoyé:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Erreur envoi email:', error);
    return { success: false, error: error.message };
  }
};

// Template HTML pour les événements
const createEventEmailTemplate = (events, logoUrl, customMessage) => {
  const eventsHtml = events.map(event => `
    <div style="margin-bottom: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
      ${event.image ? `<img src="${event.image}" alt="${event.title}" style="width: 100%; max-height: 300px; object-fit: cover; border-radius: 8px; margin-bottom: 15px;">` : ''}
      <h2 style="color: #1a365d; margin: 0 0 10px 0;">${event.title}</h2>
      <p style="color: #10b981; font-weight: bold; margin: 5px 0;">
        📅 ${event.date} à ${event.time}
      </p>
      <p style="color: #666; margin: 5px 0;">
        📍 ${event.location}
      </p>
      <p style="color: #333; margin: 15px 0;">
        ${event.description}
      </p>
    </div>
  `).join('');
  
  const defaultMessage = 'Bonjour,<br><br>Découvrez nos prochains événements et rejoignez-nous pour vivre des moments de communion fraternelle et de croissance spirituelle.';
  const messageHtml = customMessage || defaultMessage;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Événements CMCI Belgique</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background: white;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1a365d 0%, #10b981 100%); padding: 40px 20px; text-align: center;">
          ${logoUrl ? `<img src="${logoUrl}" alt="CMCI Logo" style="width: 100px; height: auto; margin-bottom: 20px;">` : ''}
          <h1 style="color: white; margin: 0; font-size: 28px;">CMCI Belgique</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Prochains Événements</p>
        </div>

        <!-- Content -->
        <div style="padding: 40px 20px;">
          <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
            ${messageHtml}
          </p>

          ${eventsHtml}

          <div style="margin-top: 40px; padding-top: 30px; border-top: 2px solid #e5e7eb; text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}#evenements" 
               style="display: inline-block; background: #10b981; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Voir tous les événements
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #f8f9fa; padding: 30px 20px; text-align: center; color: #666; font-size: 14px;">
          <p style="margin: 0 0 10px 0;">Communauté Missionnaire Chrétienne Internationale</p>
          <p style="margin: 0 0 15px 0;">Belgique</p>
          <p style="margin: 0; font-size: 12px;">
            Vous recevez cet email car vous êtes inscrit à notre newsletter.<br>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}#contact" style="color: #10b981; text-decoration: none;">Se désabonner</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Envoyer une newsletter sur les événements
const sendEventNewsletter = async (subscribers, events, customMessage = null) => {
  try {
    // Utiliser le logo depuis le backend (accessible publiquement via /uploads)
    const logoUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/cmci-logo.png`;
    
    // Enrichir les événements avec les URLs complètes des images
    const enrichedEvents = events.map(event => ({
      ...event,
      image: event.image ? `${process.env.BACKEND_URL || 'http://localhost:5000'}${event.image}` : null
    }));

    const html = createEventEmailTemplate(enrichedEvents, logoUrl, customMessage);
    const subject = `📅 Prochains événements CMCI Belgique`;

    const results = [];
    
    // Envoyer par lots pour éviter de surcharger le serveur email
    const batchSize = 10;
    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize);
      
      const batchPromises = batch.map(subscriber => 
        sendEmail({
          to: subscriber.email,
          subject,
          html
        })
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Pause de 1 seconde entre les lots
      if (i + batchSize < subscribers.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return {
      success: true,
      sent: successCount,
      failed: failureCount,
      total: subscribers.length
    };
  } catch (error) {
    console.error('Erreur envoi newsletter:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Envoyer un email de bienvenue
const sendWelcomeEmail = async (email) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1a365d; margin: 0;">Bienvenue à la CMCI Belgique !</h1>
        </div>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          Merci de vous être inscrit à notre newsletter !<br><br>
          Vous recevrez désormais toutes nos actualités, événements et messages inspirants directement dans votre boîte mail.
        </p>
        <div style="margin-top: 30px; text-align: center;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" 
             style="display: inline-block; background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Visiter notre site
          </a>
        </div>
        <p style="color: #666; font-size: 14px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          À bientôt,<br>
          L'équipe CMCI Belgique
        </p>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject: '🎉 Bienvenue à la CMCI Belgique !',
    html
  });
};

module.exports = {
  sendEmail,
  sendEventNewsletter,
  sendWelcomeEmail,
  createEventEmailTemplate
};
