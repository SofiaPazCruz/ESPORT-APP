import React, { useState } from 'react';
import { Participant, Tournament } from '../types/tournament';
import { UniversityBrandConfig, BRAND_ASSETS } from '../data/universityBrand';
import { 
  generateWelcomeEmailData, 
  generatePlainTextEmail, 
  generateMailtoLink 
} from '../utils/emailTemplate';
import { 
  Mail, 
  Send, 
  CheckCircle2, 
  Copy, 
  Calendar, 
  Clock, 
  Gamepad2, 
  MapPin, 
  X, 
  ExternalLink,
  School,
  Sparkles,
  Check
} from 'lucide-react';

import { useGoogleAuth } from '../context/GoogleAuthContext';
import { GoogleConnectButton } from './GoogleConnectButton';

interface WelcomeEmailModalProps {
  isOpen: boolean;
  participant: Participant | null;
  tournament?: Tournament;
  brandConfig: UniversityBrandConfig;
  onClose: () => void;
  onMarkEmailSent?: (participantId: number) => void;
}

export const WelcomeEmailModal: React.FC<WelcomeEmailModalProps> = ({
  isOpen,
  participant,
  tournament,
  brandConfig,
  onClose,
  onMarkEmailSent,
}) => {
  const { user, isGmailConnected, officialEmail, sendEmail } = useGoogleAuth();
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !participant) return null;

  // Fallback tournament if not provided
  const targetTournament: Tournament = tournament || {
    id: participant.tournamentId,
    name: participant.tournamentName,
    gameId: 'general',
    gameName: participant.gameName,
    format: 'Torneo Oficial FIT UAT',
    maxSlots: 32,
    currentSlots: 1,
    prizePool: 'Trofeo Castor FIT UAT',
    status: 'OPEN',
    region: 'Facultad de Ingeniería Tampico (UAT)',
    startDate: '2026-10-20 17:00',
    bannerColor: 'from-blue-50 to-slate-50',
    icon: 'Gamepad2',
  };

  const emailData = generateWelcomeEmailData(participant, targetTournament, brandConfig);
  const mailtoLink = generateMailtoLink(emailData);

  const handleSendRealEmail = async () => {
    setIsSending(true);
    setErrorMessage(null);
    try {
      if (isGmailConnected) {
        const result = await sendEmail(participant, targetTournament, brandConfig);
        if (result.success) {
          setIsSent(true);
          if (onMarkEmailSent) {
            onMarkEmailSent(participant.id);
          }
        } else {
          setErrorMessage(result.error || 'No se pudo enviar el correo');
        }
      } else {
        // Fallback simulation
        setTimeout(() => {
          setIsSent(true);
          if (onMarkEmailSent) {
            onMarkEmailSent(participant.id);
          }
        }, 600);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error inesperado al enviar el correo';
      setErrorMessage(msg);
    } finally {
      setIsSending(false);
    }
  };

  const handleCopy = () => {
    const text = generatePlainTextEmail(emailData);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentUatLogo = brandConfig.customLogoUatUrl || BRAND_ASSETS.uatEscudo;
  const currentFitLogo = brandConfig.customLogoFitUrl || BRAND_ASSETS.fitLogo;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in text-slate-900">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        
        {/* MODAL HEADER */}
        <div className="p-5 sm:p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#002f6c] text-white shadow-2xs">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-[#002f6c] border border-blue-200">
                  Despachador de Correo
                </span>
                <span className="text-xs text-slate-500 font-medium">FIT UAT ESPORTS</span>
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold font-heading text-[#002f6c] mt-0.5">
                Correo de Bienvenida al Torneo
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
            aria-label="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL CONTENT: EMAIL PREVIEW */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          
          {/* SUCCESS BANNER IF SENT */}
          {(isSent || participant.emailSent) && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3 animate-fade-in">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold text-xs sm:text-sm">¡Correo de bienvenida enviado exitosamente!</p>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  El participante ha sido notificado en su bandeja de entrada: <strong>{participant.email}</strong>
                </p>
              </div>
            </div>
          )}

          {/* EMAIL METADATA CARD (From / To / Subject / Logos) */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-bold uppercase text-[10px] w-12">De:</span>
                  <span className="font-bold text-[#002f6c] bg-white px-2 py-0.5 rounded-lg border border-slate-200 font-mono text-[11px] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    {user?.email || 'pasantiasdigitales@gmail.com'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-bold uppercase text-[10px] w-12">Para:</span>
                  <span className="font-bold text-slate-800 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                    {participant.gamertag} &lt;{participant.email}&gt;
                  </span>
                </div>
              </div>

              {/* Logos on right */}
              <div className="flex items-center gap-2 p-1 bg-white rounded-lg border border-slate-200 shrink-0 self-start sm:self-center">
                <img src={currentUatLogo} alt="UAT" className="h-4 w-auto max-w-[20px] object-contain" />
                <div className="w-[1px] h-3 bg-slate-200" />
                <img src={currentFitLogo} alt="FIT" className="h-3 w-auto max-w-[55px] object-contain" />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-0.5">
              <span className="text-slate-400 font-bold uppercase text-[10px] w-12">Asunto:</span>
              <span className="font-semibold text-[#002f6c] truncate">
                {emailData.subject}
              </span>
            </div>
          </div>

          {/* EMAIL BODY SURFACE */}
          <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 bg-white space-y-5 shadow-xs">
            
            {/* 1. WELCOME GREETING TEXT */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Texto de Bienvenida
              </span>
              <p className="text-sm text-slate-700 leading-relaxed font-medium bg-blue-50/50 p-3.5 rounded-xl border border-blue-100">
                {emailData.greetingText}
              </p>
            </div>

            {/* 2. TOURNAMENT INFO CARD (FECHA Y HORA DESTACADA) */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Información del Torneo
              </span>

              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-orange-50/60 via-white to-red-50/40 border border-orange-200 space-y-4">
                
                {/* Tournament title and game */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-orange-100 text-[#f15a24] border border-orange-200">
                      {targetTournament.gameName}
                    </span>
                    <h4 className="text-base font-extrabold font-heading text-slate-900 mt-1">
                      {targetTournament.name}
                    </h4>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Semilla</span>
                    <span className="text-xs font-bold text-[#ed1c24] bg-red-50 px-2 py-0.5 rounded-lg border border-red-200">
                      #{participant.seedNumber}
                    </span>
                  </div>
                </div>

                {/* HIGHLIGHTED DATE & TIME BLOCK */}
                <div className="p-3.5 rounded-xl bg-white border border-orange-200 shadow-2xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#f15a24] flex items-center justify-center shrink-0">
                      <Calendar className="w-5 h-5 text-[#f15a24]" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">
                        FECHA Y HORA PROGRAMADA
                      </span>
                      <span className="text-sm sm:text-base font-extrabold text-[#002f6c] font-heading block mt-0.5">
                        {targetTournament.startDate}
                      </span>
                    </div>
                  </div>

                  <div className="hidden sm:block text-right">
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      Hora Centro (México)
                    </span>
                  </div>
                </div>

                {/* Additional tournament specs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Sede</span>
                    <span className="font-semibold text-slate-800 truncate block mt-0.5">{targetTournament.region}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Formato</span>
                    <span className="font-semibold text-slate-800 truncate block mt-0.5">{targetTournament.format}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Código Check-in</span>
                    <span className="font-bold text-[#002f6c] truncate block mt-0.5">{participant.checkInCode}</span>
                  </div>
                </div>

              </div>
            </div>

            {/* 3. INSTRUCTIONS & REMINDER */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#002f6c]" />
                Instrucciones de Asistencia
              </span>
              <p className="text-[11px] leading-relaxed">
                {emailData.rulesText}
              </p>
            </div>

            {/* Institutional Signoff */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <School className="w-3.5 h-3.5 text-[#002f6c]" />
                Facultad de Ingeniería Tampico • UAT
              </span>
              <span className="italic">"Verdad, Belleza, Probidad"</span>
            </div>

          </div>

        </div>

        {/* MODAL FOOTER ACTIONS */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCopy}
              className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span>Copiar Correo</span>
                </>
              )}
            </button>

            <a
              href={mailtoLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-[#002f6c] text-xs font-bold border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              title="Abrir en tu aplicación de correo favorita"
            >
              <ExternalLink className="w-4 h-4 text-[#002f6c]" />
              <span>Abrir en Gmail / Mail</span>
            </a>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              Cerrar
            </button>

            {isGmailConnected ? (
              <button
                type="button"
                disabled={isSending || isSent || participant.emailSent}
                onClick={handleSendRealEmail}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-[#002f6c] hover:bg-[#002352] disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Enviando por Gmail...</span>
                  </>
                ) : isSent || participant.emailSent ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Enviado vía Gmail ✓</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Enviar vía Gmail</span>
                  </>
                )}
              </button>
            ) : (
              <div className="flex-1 sm:flex-none">
                <GoogleConnectButton compact onSuccess={handleSendRealEmail} />
              </div>
            )}
          </div>

        </div>

        {errorMessage && (
          <div className="px-5 py-2.5 bg-rose-50 border-t border-rose-200 text-xs text-rose-700 flex items-center justify-between">
            <span>⚠️ {errorMessage}</span>
            <button 
              onClick={() => setErrorMessage(null)} 
              className="text-rose-900 font-bold hover:underline ml-2"
            >
              Descartar
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
