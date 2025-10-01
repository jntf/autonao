import type { APIRoute } from 'astro';
import sgMail from '@sendgrid/mail';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  console.log('🚀 [API] Début de la requête subscribe');
  
  try {
    console.log('📝 [API] Récupération de la clé SendGrid...');
    // Récupérer la clé API depuis les variables d'environnement (Vercel runtime)
    const SENDGRID_API_KEY = import.meta.env.SENDGRID_API_KEY || process.env.SENDGRID_API_KEY;
    
    console.log('🔑 [API] Clé SendGrid présente:', !!SENDGRID_API_KEY);
    console.log('🔑 [API] Longueur clé:', SENDGRID_API_KEY?.length || 0);
    
    if (!SENDGRID_API_KEY) {
      console.error('❌ [API] SENDGRID_API_KEY is not defined');
      return new Response(JSON.stringify({
        success: false,
        message: 'Configuration serveur manquante'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log('✅ [API] Configuration SendGrid OK');
    sgMail.setApiKey(SENDGRID_API_KEY);
    
    console.log('📋 [API] Vérification Content-Type...');
    // Vérifier le content-type
    const contentType = request.headers.get('content-type');
    console.log('📋 [API] Content-Type:', contentType);
    
    if (!contentType || !contentType.includes('application/json')) {
      console.error('❌ [API] Content-Type invalide');
      return new Response(JSON.stringify({
        success: false,
        message: 'Content-Type doit être application/json'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('📥 [API] Lecture du body...');
    const text = await request.text();
    console.log('📥 [API] Body reçu:', text);

    let data;
    try {
      console.log('🔄 [API] Parsing JSON...');
      data = JSON.parse(text);
      console.log('✅ [API] JSON parsé avec succès');
    } catch (parseError) {
      console.error('❌ [API] Erreur de parsing JSON:', parseError);
      return new Response(JSON.stringify({
        success: false,
        message: 'JSON invalide'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('🔍 [API] Extraction des données...');
    const { firstName, lastName, company, email, phone } = data;
    console.log('👤 [API] Données reçues:', { firstName, lastName, company, email, phone: !!phone });

    console.log('✔️ [API] Validation des champs...');
    if (!firstName || !lastName || !company || !email) {
      console.error('❌ [API] Champs manquants');
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
      console.error('❌ [API] Email invalide');
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
    
    console.log('✅ [API] Validation OK');

    console.log('📧 [API] Préparation des emails...');
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

    console.log('✉️ [API] Envoi des emails via SendGrid...');
    console.log('📤 [API] Email utilisateur vers:', email);
    console.log('📤 [API] Email admin vers: julien@autonao.com');
    
    // Envoyer les emails
    try {
      await Promise.all([
        sgMail.send(userMsg),
        sgMail.send(adminMsg)
      ]);
      console.log('✅ [API] Emails envoyés avec succès');
    } catch (sendError: any) {
      console.error('❌ [API] Erreur SendGrid lors de l\'envoi:', sendError);
      console.error('❌ [API] SendGrid error code:', sendError?.code);
      console.error('❌ [API] SendGrid error response:', JSON.stringify(sendError?.response?.body));
      throw sendError; // Re-throw pour être capturé par le catch principal
    }

    console.log('🎉 [API] Inscription réussie');
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
    console.error('💥 [API] ==================== ERREUR GLOBALE ====================');
    console.error('💥 [API] Error name:', error?.name);
    console.error('💥 [API] Error message:', error?.message);
    console.error('💥 [API] Error code:', error?.code);
    console.error('💥 [API] Error stack:', error?.stack);
    
    // Gérer spécifiquement les erreurs SendGrid
    const errorCode = error?.code || error?.response?.status || error?.statusCode;
    const errorBody = error?.response?.body;
    const errorMessage = error?.message || errorBody?.errors?.[0]?.message || 'Unknown error';
    
    console.error('🔴 [API] SendGrid Response Body:', JSON.stringify(errorBody, null, 2));
    console.error('🔴 [API] SendGrid error code:', errorCode);
    console.error('🔴 [API] SendGrid error message:', errorMessage);
    console.error('🔴 [API] SendGrid errors array:', JSON.stringify(errorBody?.errors, null, 2));
    console.error('💥 [API] ========================================================');

    // Unauthorized = clé API invalide
    if (errorCode === 401) {
      console.error('❌ [API] UNAUTHORIZED - La clé API SendGrid est invalide ou manquante');
      console.error('❌ [API] Vérifiez la variable SENDGRID_API_KEY dans Vercel');
      
      return new Response(JSON.stringify({
        success: false,
        message: 'Erreur de configuration serveur',
        errorCode: 401,
        errorType: 'UNAUTHORIZED',
        details: 'La clé API SendGrid est invalide ou manquante',
        fullError: errorBody?.errors || errorMessage
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    if (errorCode === 403) {
      console.error('❌ [API] FORBIDDEN - Vérifiez les permissions SendGrid');
      
      return new Response(JSON.stringify({
        success: false,
        message: 'Configuration email en cours',
        errorCode: 403,
        errorType: 'FORBIDDEN',
        details: 'Permissions SendGrid manquantes',
        fullError: errorBody?.errors || errorMessage
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    return new Response(JSON.stringify({
      success: false,
      message: 'Une erreur est survenue',
      errorCode: errorCode || 'UNKNOWN',
      errorMessage: errorMessage,
      fullError: errorBody?.errors || error?.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};