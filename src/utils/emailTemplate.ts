import { Participant, Tournament } from '../types/tournament';
import { UniversityBrandConfig } from '../data/universityBrand';

export interface WelcomeEmailData {
  to: string;
  subject: string;
  greetingText: string;
  tournamentInfo: {
    name: string;
    game: string;
    dateTime: string;
    venue: string;
    format: string;
    prizePool: string;
  };
  playerInfo: {
    gamertag: string;
    studentId?: string;
    faculty?: string;
    checkInCode: string;
    seedNumber: number;
    platform: string;
  };
  rulesText: string;
  footerText: string;
}

export const generateWelcomeEmailData = (
  participant: Participant,
  tournament: Tournament,
  brandConfig: UniversityBrandConfig
): WelcomeEmailData => {
  return {
    to: participant.email,
    subject: `🎮 ¡Bienvenido al Torneo de ${tournament.gameName}! - Confirmación Oficial ESPORTS FIT UAT`,
    greetingText: `¡Hola, ${participant.gamertag}! Te damos la más cordial bienvenida a los torneos de ESPORTS de la Facultad de Ingeniería Tampico (Universidad Autónoma de Tamaulipas). Tu inscripción ha sido completada y confirmada con éxito en nuestro sistema universitario.`,
    tournamentInfo: {
      name: tournament.name,
      game: tournament.gameName,
      dateTime: tournament.startDate,
      venue: tournament.region,
      format: tournament.format,
      prizePool: tournament.prizePool,
    },
    playerInfo: {
      gamertag: participant.gamertag,
      studentId: participant.studentId,
      faculty: participant.faculty,
      checkInCode: participant.checkInCode,
      seedNumber: participant.seedNumber,
      platform: participant.platform,
    },
    rulesText: `Por favor conéctate o preséntate con 15 minutos de anticipación a la fecha y hora programada (${tournament.startDate}) portando tu Código de Check-in (${participant.checkInCode}) para validar tu pase de competencia.`,
    footerText: `${brandConfig.facultyName} • ${brandConfig.institutionName}\n"${brandConfig.motto}" • ${brandConfig.campusName}`,
  };
};

export const generatePlainTextEmail = (data: WelcomeEmailData): string => {
  return `=====================================================
FACULTAD DE INGENIERÍA TAMPICO • UNIVERSIDAD AUTÓNOMA DE TAMAULIPAS
ESPORTS FIT UAT - NOTIFICACIÓN OFICIAL DE REGISTRO
=====================================================

${data.greetingText}

-----------------------------------------------------
DETALLES DEL TORNEO AL QUE TE HAS INSCRITO:
-----------------------------------------------------
• Torneo: ${data.tournamentInfo.name}
• Videojuego: ${data.tournamentInfo.game}
• FECHA Y HORA: ${data.tournamentInfo.dateTime}
• Sede / Modalidad: ${data.tournamentInfo.venue}
• Formato de Juego: ${data.tournamentInfo.format}
• Premio / Reconocimiento: ${data.tournamentInfo.prizePool}

-----------------------------------------------------
DATOS DEL JUGADOR:
-----------------------------------------------------
• Gamertag: ${data.playerInfo.gamertag}
• Matrícula UAT: ${data.playerInfo.studentId || 'No registrada'}
• Carrera: ${data.playerInfo.faculty || 'Ingeniería FIT UAT'}
• Plataforma: ${data.playerInfo.platform}
• Semilla Inicial (Seed): #${data.playerInfo.seedNumber}
• CÓDIGO DE CHECK-IN: ${data.playerInfo.checkInCode}

-----------------------------------------------------
INDICACIONES DE ASISTENCIA:
-----------------------------------------------------
${data.rulesText}

¡Mucho éxito en tus partidas y que gane el mejor Castor!

-----------------------------------------------------
${data.footerText}
=====================================================`;
};

export const generateMailtoLink = (data: WelcomeEmailData): string => {
  const body = generatePlainTextEmail(data);
  return `mailto:${encodeURIComponent(data.to)}?subject=${encodeURIComponent(data.subject)}&body=${encodeURIComponent(body)}`;
};

export const generateHtmlEmail = (data: WelcomeEmailData): string => {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; line-height: 1.5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 32px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
          
          <!-- Institutional Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #002f6c 0%, #001a3d 100%); padding: 32px 28px; text-align: center; border-bottom: 4px solid #f5a800;">
              <div style="font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #f5a800; margin-bottom: 6px;">
                UNIVERSIDAD AUTÓNOMA DE TAMAULIPAS
              </div>
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                FACULTAD DE INGENIERÍA TAMPICO
              </h1>
              <div style="display: inline-block; margin-top: 10px; padding: 4px 14px; background-color: rgba(237, 28, 36, 0.9); border-radius: 20px; color: #ffffff; font-size: 12px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase;">
                🎮 ESPORTS FIT UAT • CONFIRMACIÓN OFICIAL
              </div>
            </td>
          </tr>

          <!-- Welcome Message & Greeting -->
          <tr>
            <td style="padding: 28px 28px 20px 28px;">
              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #334155;">
                <strong style="color: #002f6c; font-size: 18px;">¡Hola, ${data.playerInfo.gamertag}!</strong> 👋
              </p>
              <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #475569;">
                ${data.greetingText}
              </p>
            </td>
          </tr>

          <!-- Tournament Details Card -->
          <tr>
            <td style="padding: 0 28px 20px 28px;">
              <div style="background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; padding: 20px;">
                <div style="font-size: 12px; font-weight: 800; color: #002f6c; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; border-bottom: 2px solid #cbd5e1; padding-bottom: 6px;">
                  🏆 INFORMACIÓN DEL TORNEO
                </div>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="6">
                  <tr>
                    <td width="35%" style="font-size: 13px; font-weight: 700; color: #64748b;">Torneo:</td>
                    <td style="font-size: 14px; font-weight: 800; color: #0f172a;">${data.tournamentInfo.name}</td>
                  </tr>
                  <tr>
                    <td style="font-size: 13px; font-weight: 700; color: #64748b;">Videojuego:</td>
                    <td style="font-size: 14px; font-weight: 700; color: #002f6c;">${data.tournamentInfo.game}</td>
                  </tr>
                  <tr style="background-color: #fef3c7;">
                    <td style="font-size: 13px; font-weight: 800; color: #92400e; padding: 8px 6px; border-radius: 6px 0 0 6px;">📅 FECHA Y HORA:</td>
                    <td style="font-size: 15px; font-weight: 800; color: #b45309; padding: 8px 6px; border-radius: 0 6px 6px 0;">${data.tournamentInfo.dateTime}</td>
                  </tr>
                  <tr>
                    <td style="font-size: 13px; font-weight: 700; color: #64748b;">Sede / Modalidad:</td>
                    <td style="font-size: 13px; color: #334155;">${data.tournamentInfo.venue}</td>
                  </tr>
                  <tr>
                    <td style="font-size: 13px; font-weight: 700; color: #64748b;">Formato:</td>
                    <td style="font-size: 13px; color: #334155;">${data.tournamentInfo.format}</td>
                  </tr>
                  <tr>
                    <td style="font-size: 13px; font-weight: 700; color: #64748b;">Premios:</td>
                    <td style="font-size: 13px; font-weight: 700; color: #059669;">${data.tournamentInfo.prizePool}</td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Player Pass & Check-In Code -->
          <tr>
            <td style="padding: 0 28px 24px 28px;">
              <div style="background: linear-gradient(135deg, #002f6c 0%, #0f3d7d 100%); border-radius: 14px; padding: 20px; color: #ffffff; text-align: center;">
                <div style="font-size: 11px; text-transform: uppercase; font-weight: 800; letter-spacing: 1.5px; color: #f5a800;">
                  TU CÓDIGO OFICIAL DE CHECK-IN
                </div>
                <div style="font-family: 'Courier New', Courier, monospace; font-size: 30px; font-weight: 900; letter-spacing: 4px; color: #ffffff; margin: 10px 0; background-color: rgba(0, 0, 0, 0.25); padding: 8px 16px; border-radius: 8px; display: inline-block; border: 1px dashed rgba(255, 255, 255, 0.3);">
                  ${data.playerInfo.checkInCode}
                </div>
                <div style="font-size: 12px; color: #cbd5e1; margin-top: 4px;">
                  Gamertag: <strong style="color: #ffffff;">${data.playerInfo.gamertag}</strong> • Semilla #${data.playerInfo.seedNumber} • ${data.playerInfo.platform}
                </div>
                ${data.playerInfo.studentId ? `<div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">Matrícula UAT: ${data.playerInfo.studentId}</div>` : ''}
              </div>
            </td>
          </tr>

          <!-- Instructions / Rules Box -->
          <tr>
            <td style="padding: 0 28px 24px 28px;">
              <div style="border-left: 4px solid #ed1c24; background-color: #fff1f2; padding: 14px 16px; border-radius: 0 8px 8px 0;">
                <div style="font-size: 12px; font-weight: 800; color: #be123c; margin-bottom: 4px; text-transform: uppercase;">
                  ⚠️ Indicaciones para la Competencia
                </div>
                <div style="font-size: 13px; color: #881337; line-height: 1.5;">
                  ${data.rulesText}
                </div>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0f172a; padding: 24px 28px; text-align: center; color: #94a3b8; font-size: 12px; line-height: 1.6;">
              <div style="color: #ffffff; font-weight: 700; margin-bottom: 4px;">
                Facultad de Ingeniería Tampico • Universidad Autónoma de Tamaulipas
              </div>
              <div style="font-style: italic; color: #cbd5e1; margin-bottom: 8px;">
                "Verdad, Belleza, Probidad" • Campus Tampico Sur
              </div>
              <div style="font-size: 11px; color: #64748b; border-top: 1px solid #334155; padding-top: 10px; margin-top: 10px;">
                Este correo fue generado y enviado automáticamente por el sistema de torneos ESPORTS FIT UAT para confirmar tu registro.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

