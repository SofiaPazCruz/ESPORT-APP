import { Participant, Tournament } from '../types/tournament';
import { UniversityBrandConfig, BRAND_ASSETS } from '../data/universityBrand';

/**
 * Generates and triggers the immediate download of an official high-resolution
 * Gamer Pass credential (PNG image) using HTML5 Canvas.
 */
export function downloadGamerPass(
  participant: Participant,
  tournament?: Tournament | null,
  brandConfig?: UniversityBrandConfig | null
): boolean {
  try {
    const canvas = document.createElement('canvas');
    // High-resolution credential: 1200 x 700 px (crisp for retina displays and mobile sharing)
    const width = 1200;
    const height = 700;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return false;

    // 1. Base Background (Clean Institutional Slate White)
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, height);

    // 2. Outer Border & Shadow Simulation
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 4;
    ctx.strokeRect(16, 16, width - 32, height - 32);

    // 3. Top Institutional Header Banner (UAT Navy Blue)
    const headerGrad = ctx.createLinearGradient(0, 16, width, 140);
    headerGrad.addColorStop(0, '#002f6c');
    headerGrad.addColorStop(0.5, '#001e47');
    headerGrad.addColorStop(1, '#002f6c');
    ctx.fillStyle = headerGrad;
    ctx.fillRect(16, 16, width - 32, 130);

    // Orange Institutional Accent Stripe
    ctx.fillStyle = '#f15a24';
    ctx.fillRect(16, 146, width - 32, 8);

    // 4. Header Typography
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText('UNIVERSIDAD AUTÓNOMA DE TAMAULIPAS', 60, 68);

    ctx.font = '600 20px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('FACULTAD DE INGENIERÍA TAMPICO  •  ESPORTS FIT UAT', 60, 102);

    // Badge on top right: "PASE OFICIAL"
    ctx.fillStyle = '#10b981';
    roundRect(ctx, width - 360, 52, 300, 48, 12);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText('✓ PASE DE COMPETIDOR', width - 325, 83);

    // 5. Main Content Card Area
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, 48, 180, width - 96, 460, 20);
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 6. Left Column: Gamer Identity
    // Avatar Placeholder Circle/Box
    const avatarGrad = ctx.createLinearGradient(80, 215, 230, 365);
    avatarGrad.addColorStop(0, '#002f6c');
    avatarGrad.addColorStop(1, '#f15a24');
    ctx.fillStyle = avatarGrad;
    roundRect(ctx, 80, 215, 140, 140, 24);
    ctx.fill();

    // Initials in avatar box
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 52px "Plus Jakarta Sans", system-ui, sans-serif';
    const initials = participant.gamertag.slice(0, 2).toUpperCase();
    ctx.fillText(initials, 115, 305);

    // Gamertag
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 42px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText(participant.gamertag, 250, 260);

    // Faculty & Career
    ctx.fillStyle = '#f15a24';
    ctx.font = 'bold 20px "Plus Jakarta Sans", system-ui, sans-serif';
    const facText = participant.faculty || 'Facultad de Ingeniería Tampico';
    ctx.fillText(facText.length > 40 ? facText.slice(0, 38) + '...' : facText, 250, 298);

    // Student ID & Email
    ctx.fillStyle = '#64748b';
    ctx.font = '600 18px "Plus Jakarta Sans", system-ui, sans-serif';
    const matText = participant.studentId ? `Matrícula: ${participant.studentId}` : 'Estudiante Inscrito';
    ctx.fillText(`${matText}   •   ${participant.email}`, 250, 332);

    // Divider Line
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(80, 380);
    ctx.lineTo(width - 80, 380);
    ctx.stroke();

    // 7. Middle Grid: Tournament Meta
    // Column 1: Videojuego
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 14px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText('VIDEOJUEGO', 80, 420);
    ctx.fillStyle = '#002f6c';
    ctx.font = '800 24px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText(participant.gameName || tournament?.gameName || 'Torneo FIT', 80, 455);

    // Column 2: Torneo Oficial
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 14px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText('TORNEO OFICIAL', 380, 420);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 20px "Plus Jakarta Sans", system-ui, sans-serif';
    const tName = participant.tournamentName || tournament?.name || 'Copa ESPORTS FIT UAT';
    ctx.fillText(tName.length > 28 ? tName.slice(0, 26) + '...' : tName, 380, 455);

    // Column 3: Plataforma
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 14px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText('PLATAFORMA', 780, 420);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 20px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText(participant.platform || 'PC', 780, 455);

    // Column 4: Semilla / Seed
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 14px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText('SEMILLA EN LLAVE', 1000, 420);
    ctx.fillStyle = '#f15a24';
    ctx.font = '900 28px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText(`#${participant.seedNumber || 1}`, 1000, 455);

    // 8. Bottom Highlight Box: Official Check-In Code
    ctx.fillStyle = '#0f172a';
    roundRect(ctx, 80, 490, width - 160, 110, 16);
    ctx.fill();

    // Check-In Details inside box
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 15px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText('CÓDIGO DE CHECK-IN OFICIAL (PRESENTAR EN CABINA DE JUEGO):', 110, 526);

    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 36px monospace, sans-serif';
    ctx.fillText(participant.checkInCode, 110, 574);

    // Verified Stamp on Right inside box
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText('ESTADO: CONFIRMADO', width - 360, 540);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText(participant.registeredAt || 'Fecha confirmada', width - 360, 565);

    // 9. Institutional Motto at Bottom
    ctx.fillStyle = '#64748b';
    ctx.font = 'italic 15px "Plus Jakarta Sans", system-ui, sans-serif';
    const motto = brandConfig?.motto || 'Verdad, Belleza, Probidad';
    ctx.fillText(`"${motto}" — Campus Tampico • Centro Universitario Sur`, 60, 672);

    // Convert Canvas to Blob and Trigger Direct Browser Download
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      const safeGamer = participant.gamertag.replace(/[^a-zA-Z0-9_-]/g, '_');
      const safeGame = (participant.gameName || 'Torneo').replace(/[^a-zA-Z0-9_-]/g, '_');
      anchor.download = `Pase_Competidor_${safeGamer}_${safeGame}.png`;
      anchor.href = url;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    }, 'image/png');

    return true;
  } catch (err) {
    console.error('Error generating pass image:', err);
    return false;
  }
}

/**
 * Helper to draw rounded rectangle paths on 2D canvas context
 */
function roundRect(
  ctx: CanvasRenderingContext2D, 
  x: number, 
  y: number, 
  w: number, 
  h: number, 
  r: number
) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
