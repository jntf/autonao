import type { APIRoute } from 'astro';
import sgMail from '@sendgrid/mail';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    // Récupérer la clé API depuis les variables d'environnement (Vercel runtime)
    const SENDGRID_API_KEY = import.meta.env.SENDGRID_API_KEY || process.env.SENDGRID_API_KEY;
    
    if (!SENDGRID_API_KEY) {
      console.error('SENDGRID_API_KEY is not defined');
      return new Response(JSON.stringify({
        success: false,
        message: 'Configuration serveur manquante'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    sgMail.setApiKey(SENDGRID_API_KEY);
    // Vérifier le content-type
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Content-Type doit être application/json'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const text = await request.text();
    console.log('Body reçu:', text);

    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.error('Erreur de parsing JSON:', parseError);
      return new Response(JSON.stringify({
        success: false,
        message: 'JSON invalide'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { firstName, lastName, company, email, phone } = data;

    if (!firstName || !lastName || !company || !email) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Tous les champs sont requis'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    if (!email.includes('@')) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Adresse email invalide'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Email de confirmation à l'utilisateur
    const userMsg = {
      to: email,
      from: 'julien@autonao.com', // Utiliser une adresse vérifiée
      subject: 'Inscription confirmée - Autonao.com',
      html: `
        <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: rgb(47, 53, 67); margin: 0;">Autonao.com</h1>
          </div>

          <h2 style="color: rgb(47, 53, 67);">Merci pour votre inscription !</h2>

          <p>Bonjour ${firstName} ${lastName},</p>

          <p>Nous avons bien reçu votre inscription à notre liste de diffusion depuis <strong>${company}</strong>. Vous serez parmi les premiers informés dès que notre plateforme sera disponible.</p>

          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: rgb(47, 53, 67); margin-top: 0;">Vos informations :</h3>
            <p style="margin: 5px 0;"><strong>Nom :</strong> ${firstName} ${lastName}</p>
            <p style="margin: 5px 0;"><strong>Entreprise :</strong> ${company}</p>
            <p style="margin: 5px 0;"><strong>Email :</strong> ${email}</p>
            ${phone ? `<p style="margin: 5px 0;"><strong>Téléphone :</strong> ${phone}</p>` : ''}
          </div>

          <p>En tant que professionnel, vous apprécierez certainement les fonctionnalités avancées que nous préparons spécialement pour les entreprises comme la vôtre.</p>

          <div style="background: rgb(47, 53, 67); color: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; font-weight: 600;">🚀 Lancement prévu très bientôt</p>
            <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Accès prioritaire pour les professionnels inscrits</p>
          </div>

          <p>À très bientôt,<br>L'équipe Autonao</p>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #666; text-align: center;">
            © 2025 Autonao.com - Tous droits réservés
          </p>
        </div>
      `
    };

    // Email de notification pour vous
    const adminMsg = {
      to: 'julien@autonao.com', // Remplacez par votre email
      from: 'julien@autonao.com',
      subject: 'Nouvelle inscription - Autonao.com',
      html: `
        <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: rgb(47, 53, 67);">🎯 Nouvelle inscription professionnelle</h2>

          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: rgb(47, 53, 67); margin-top: 0;">Informations du contact :</h3>
            <p style="margin: 8px 0;"><strong>Nom :</strong> ${firstName} ${lastName}</p>
            <p style="margin: 8px 0;"><strong>Entreprise :</strong> ${company}</p>
            <p style="margin: 8px 0;"><strong>Email :</strong> ${email}</p>
            ${phone ? `<p style="margin: 8px 0;"><strong>Téléphone :</strong> ${phone}</p>` : ''}
            <p style="margin: 8px 0;"><strong>Date d'inscription :</strong> ${new Date().toLocaleString('fr-FR')}</p>
          </div>

          <div style="background: rgb(47, 53, 67); color: white; padding: 15px; border-radius: 8px; text-align: center;">
            <p style="margin: 0; font-size: 14px;">💼 Lead professionnel qualifié prêt pour le suivi</p>
          </div>
        </div>
      `
    };

    // Envoyer les emails
    await Promise.all([
      sgMail.send(userMsg),
      sgMail.send(adminMsg)
    ]);

    return new Response(JSON.stringify({
      success: true,
      message: 'Inscription réussie ! Vérifiez votre email.'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error: any) {
    console.error('Erreur lors de l\'inscription:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));

    // Gérer spécifiquement les erreurs SendGrid
    const errorCode = error?.code || error?.response?.status || error?.statusCode;
    const errorMessage = error?.message || error?.response?.body?.errors?.[0]?.message || 'Unknown error';
    
    console.error('SendGrid error code:', errorCode);
    console.error('SendGrid error message:', errorMessage);

    if (errorCode === 403) {
      console.error('Erreur SendGrid 403 - Vérifiez:', {
        apiKey: 'Clé API valide?',
        fromEmail: 'Domaine vérifié dans SendGrid?',
        permissions: 'Permissions Mail Send activées?'
      });

      return new Response(JSON.stringify({
        success: false,
        message: 'Configuration email en cours. Veuillez réessayer plus tard.'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    return new Response(JSON.stringify({
      success: false,
      message: 'Une erreur est survenue. Veuillez réessayer.',
      debug: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};