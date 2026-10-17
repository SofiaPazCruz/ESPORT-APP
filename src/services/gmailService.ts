import { Participant, Tournament } from '../types/tournament';
import { UniversityBrandConfig } from '../data/universityBrand';
import { generateWelcomeEmailData, generatePlainTextEmail, generateHtmlEmail } from '../utils/emailTemplate';

function encodeBase64Url(str: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function encodeUtf8Header(text: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(text);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `=?UTF-8?B?${btoa(binary)}?=`;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  sentAt?: string;
  recipient?: string;
}

/**
 * Sends a real official welcome email to the participant using the Gmail API
 */
export async function sendWelcomeEmailViaGmail(
  participant: Participant,
  tournament: Tournament,
  brandConfig: UniversityBrandConfig,
  accessToken: string,
  senderName: string = 'ESPORTS FIT UAT',
  senderEmail: string = 'pasantiasdigitales@gmail.com'
): Promise<SendEmailResult> {
  try {
    if (!accessToken) {
      throw new Error('No se cuenta con token de acceso a Gmail. Conecta tu cuenta de Google.');
    }

    if (!participant.email || !participant.email.includes('@')) {
      throw new Error(`Dirección de correo inválida: ${participant.email}`);
    }

    const emailData = generateWelcomeEmailData(participant, tournament, brandConfig);
    const textBody = generatePlainTextEmail(emailData);
    const htmlBody = generateHtmlEmail(emailData);

    const boundary = `====_fit_uat_${Date.now()}_${Math.random().toString(36).slice(2)}====`;

    const fromHeader = `${encodeUtf8Header(senderName)} <${senderEmail}>`;

    const mimeMessage = [
      `MIME-Version: 1.0`,
      `To: ${participant.email}`,
      `From: ${fromHeader}`,
      `Reply-To: ${senderEmail}`,
      `Subject: ${encodeUtf8Header(emailData.subject)}`,
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      ``,
      `--${boundary}`,
      `Content-Type: text/plain; charset=UTF-8`,
      `Content-Transfer-Encoding: 8bit`,
      ``,
      textBody,
      ``,
      `--${boundary}`,
      `Content-Type: text/html; charset=UTF-8`,
      `Content-Transfer-Encoding: 8bit`,
      ``,
      htmlBody,
      ``,
      `--${boundary}--`,
    ].join('\r\n');

    const raw = encodeBase64Url(mimeMessage);

    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw }),
    });

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      const errorMsg = errorJson.error?.message || `Error HTTP ${response.status} de la API de Gmail`;
      throw new Error(errorMsg);
    }

    const data = await response.json();
    const sentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return {
      success: true,
      messageId: data.id,
      sentAt: sentTime,
      recipient: participant.email,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Failed to send email via Gmail API:', errorMsg);
    return {
      success: false,
      error: errorMsg,
      recipient: participant.email,
    };
  }
}
