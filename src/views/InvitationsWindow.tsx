import React, { useState } from 'react';
import { Tournament, Participant } from '../types/tournament';
import { UniversityBrandConfig } from '../data/universityBrand';
import { 
  getTournamentInviteCode, 
  buildGeneralPortalUrl 
} from '../utils/inviteCodes';
import { 
  Share2, 
  Link2, 
  Copy, 
  Check, 
  ExternalLink, 
  Gamepad2, 
  Calendar, 
  MessageSquare,
  Trophy,
  ArrowRight
} from 'lucide-react';

interface InvitationsWindowProps {
  tournaments: Tournament[];
  participants: Participant[];
  brandConfig: UniversityBrandConfig;
  onOpenStandalonePortal: (code?: string) => void;
  onGoToTournaments?: () => void;
}

export const InvitationsWindow: React.FC<InvitationsWindowProps> = ({
  tournaments,
  participants,
  brandConfig: _brandConfig,
  onOpenStandalonePortal,
  onGoToTournaments,
}) => {
  const [copiedCodeId, setCopiedCodeId] = useState<number | null>(null);
  const [copiedFormLink, setCopiedFormLink] = useState<boolean>(false);
  
  // Modal for sharing card
  const [shareModalTournament, setShareModalTournament] = useState<Tournament | null>(null);
  const [copiedShareText, setCopiedShareText] = useState<boolean>(false);

  const handleCopyCode = (tournament: Tournament) => {
    const code = getTournamentInviteCode(tournament);
    navigator.clipboard.writeText(code);
    setCopiedCodeId(tournament.id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const handleCopyFormLink = () => {
    const url = buildGeneralPortalUrl();
    navigator.clipboard.writeText(url);
    setCopiedFormLink(true);
    setTimeout(() => setCopiedFormLink(false), 2000);
  };

  const handleCopyShareMessage = (t: Tournament) => {
    const code = getTournamentInviteCode(t);
    const formUrl = buildGeneralPortalUrl();
    const msg = `🎮 *¡TORNEO OFICIAL ESPORTS FIT UAT!*
🏆 *${t.name}*
🕹️ *Juego:* ${t.gameName} (${t.format})
📅 *Fecha:* ${t.startDate}
🎁 *Premio:* ${t.prizePool}
🔑 *Tu Código de Invitación:* \`${code}\`

🔗 *Ingresa al formulario independiente e introduce tu código:*
${formUrl}

¡Tu código activará automáticamente el registro para ${t.gameName}!`;

    navigator.clipboard.writeText(msg);
    setCopiedShareText(true);
    setTimeout(() => setCopiedShareText(false), 2000);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12 font-sans">
      {/* 1. Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-orange-100/50 to-blue-100/40 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#f15a24]/10 text-[#f15a24] border border-[#f15a24]/20">
                <Share2 className="w-3.5 h-3.5" />
                Apartado Oficial de Invitaciones
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#002f6c] border border-blue-200">
                <Link2 className="w-3.5 h-3.5" />
                Formulario Universal
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#002f6c] font-heading tracking-tight">
              Invitaciones y Códigos por Torneo
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              El enlace al formulario de registro es universal para todos los estudiantes. Hazles llegar el enlace junto con el <strong>código único</strong> del torneo de su videojuego. Al ingresar su código en el formulario, el sistema <strong>detectará de inmediato el videojuego</strong> y formalizará su inscripción.
            </p>
          </div>

          {/* Quick Universal Form Access */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
            <button
              onClick={() => onOpenStandalonePortal()}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-[#002f6c] to-blue-900 hover:from-blue-900 hover:to-indigo-950 text-white font-bold text-xs shadow-md shadow-blue-950/15 transition-all cursor-pointer"
            >
              <ExternalLink className="w-4 h-4 text-blue-200" />
              <span>Abrir formulario independiente</span>
            </button>

            <button
              onClick={handleCopyFormLink}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer border border-slate-200"
            >
              {copiedFormLink ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">¡Enlace copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span>copiar enlace de formulario independiente</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Video Game Cards Grid (Each showing Tournament Info + Unique Code only) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 font-heading">
              Códigos Únicos por Videojuego ({tournaments.length} Torneos)
            </h2>
            <p className="text-xs text-slate-500">
              Entrega únicamente el código correspondiente a los estudiantes inscritos en cada disciplina
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            Facultad de Ingeniería Tampico • UAT
          </span>
        </div>

        {tournaments.length === 0 ? (
          <div className="py-16 px-6 rounded-3xl border border-dashed border-slate-200 bg-white text-center space-y-4 shadow-sm">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700">
              <Share2 className="w-7 h-7 text-purple-600" />
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <h3 className="text-lg font-bold font-heading text-slate-900">
                No hay torneos registrados para generar invitaciones
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                La plataforma está lista para su primer uso. Al crear torneos de videojuegos, el sistema generará automáticamente un código único de registro para cada competencia.
              </p>
            </div>
            {onGoToTournaments && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onGoToTournaments}
                  className="px-5 py-2.5 rounded-xl bg-[#002f6c] hover:bg-[#002454] text-white text-xs font-bold transition-all shadow-sm cursor-pointer inline-flex items-center gap-2"
                >
                  <span>Ir al Catálogo de Torneos</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {tournaments.map((tournament) => {
            const code = getTournamentInviteCode(tournament);
            const isCodeCopied = copiedCodeId === tournament.id;
            const enrolled = participants.filter(p => p.tournamentId === tournament.id).length;

            return (
              <div
                key={tournament.id}
                className="rounded-3xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-shadow p-6 flex flex-col justify-between gap-5 relative overflow-hidden"
              >
                {/* Top Game Details */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 rounded-2xl bg-orange-50 border border-orange-200 text-[#f15a24]">
                        <Gamepad2 className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#f15a24] block">
                          {tournament.gameName}
                        </span>
                        <h3 className="text-base font-extrabold text-[#002f6c] font-heading line-clamp-1" title={tournament.name}>
                          {tournament.name}
                        </h3>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                      {enrolled} / {tournament.maxSlots} Cupos
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {tournament.startDate}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span>{tournament.format}</span>
                    <span className="text-slate-300">•</span>
                    <span className="flex items-center gap-1 text-emerald-700 font-medium">
                      <Trophy className="w-3.5 h-3.5 text-emerald-600" />
                      {tournament.prizePool}
                    </span>
                  </div>
                </div>

                {/* Unique Code Highlight Box */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-orange-50/50 border border-orange-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Código Único del Torneo:
                    </span>
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
                      Detección Automática
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-2xl sm:text-3xl font-black font-mono tracking-wider text-[#002f6c]">
                      {code}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleCopyCode(tournament)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                      title="Copiar código al portapapeles"
                    >
                      {isCodeCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                          <span>Copiar Código</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Bottom Actions: Share Card for Coordinators */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <p className="text-[11px] text-slate-500">
                    Proporciona este código a los estudiantes que vayan a jugar {tournament.gameName}.
                  </p>

                  <button
                    type="button"
                    onClick={() => setShareModalTournament(tournament)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#f15a24] font-bold text-xs border border-orange-200 cursor-pointer transition-colors shrink-0"
                    title="Ficha con código y enlace lista para enviar por WhatsApp o Discord"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Ficha para compartir</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>

      {/* SHARE MODAL */}
      {shareModalTournament && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 border border-slate-200 shadow-2xl relative">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#f15a24] block">
                  Ficha de Invitación para Alumnos
                </span>
                <h3 className="text-lg font-bold text-[#002f6c] font-heading">
                  {shareModalTournament.name}
                </h3>
              </div>

              <button
                onClick={() => setShareModalTournament(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Share Preview Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 font-mono text-xs text-slate-700 whitespace-pre-wrap leading-relaxed select-all">
{`🎮 *¡TORNEO OFICIAL ESPORTS FIT UAT!*
🏆 *${shareModalTournament.name}*
🕹️ *Juego:* ${shareModalTournament.gameName}
📅 *Fecha:* ${shareModalTournament.startDate}
🔑 *Código de Registro:* ${getTournamentInviteCode(shareModalTournament)}

🔗 *Formulario Independiente:*
${buildGeneralPortalUrl()}`}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShareModalTournament(null)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
              >
                Cerrar
              </button>

              <button
                type="button"
                onClick={() => handleCopyShareMessage(shareModalTournament)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md cursor-pointer transition-colors"
              >
                {copiedShareText ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>¡Texto Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar mensaje para Alumnos</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
