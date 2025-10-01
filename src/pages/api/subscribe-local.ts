import type { APIRoute } from 'astro';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

export const prerender = false;

const EMAILS_FILE = join(process.cwd(), 'emails.json');

interface EmailEntry {
  email: string;
  date: string;
  timestamp: number;
}

function getEmails(): EmailEntry[] {
  try {
    if (!existsSync(EMAILS_FILE)) {
      return [];
    }
    const content = readFileSync(EMAILS_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    return [];
  }
}

function saveEmail(email: string): void {
  const emails = getEmails();
  const newEntry: EmailEntry = {
    email,
    date: new Date().toLocaleString('fr-FR'),
    timestamp: Date.now()
  };

  // Éviter les doublons
  if (!emails.some(e => e.email === email)) {
    emails.push(newEntry);
    writeFileSync(EMAILS_FILE, JSON.stringify(emails, null, 2));
  }
}

export const POST: APIRoute = async ({ request }) => {
  try {
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
    let data;

    try {
      data = JSON.parse(text);
    } catch (parseError) {
      return new Response(JSON.stringify({
        success: false,
        message: 'JSON invalide'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { email } = data;

    if (!email || !email.includes('@')) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Adresse email invalide'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Sauvegarder l'email localement
    saveEmail(email);

    console.log(`📧 Nouvelle inscription: ${email}`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Inscription enregistrée ! Nous vous contacterons bientôt.'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Erreur:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Une erreur est survenue. Veuillez réessayer.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};