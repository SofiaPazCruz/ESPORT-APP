import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Participant, Tournament } from '../types/tournament';
import { UniversityBrandConfig, BRAND_ASSETS } from '../data/universityBrand';
import { Trophy, CheckCircle2, QrCode, Shield, Copy, Check, X, Hash, Gamepad2, School, GraduationCap, Printer, Download } from 'lucide-react';
import { downloadGamerPass } from '../utils/passDownloader';

interface GamerPassModalProps {
  participant: Participant;
  tournament?: Tournament;
  brandConfig: UniversityBrandConfig;
  onClose: () => void;
  onRegisterAnother: () => void;
}

export const GamerPassModal: React.FC<GamerPassModalProps> = ({
  participant,
  tournament,
  brandConfig,
  onClose,
  onRegisterAnother,
}) => {
  const [copiedCode, setCopiedCode] = React.useState(false);
  const [downloadSuccess, setDownloadSuccess] = React.useState(false);

  useEffect(() => {
    try {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#002f6c', '#f15a24', '#3b82f6', '#10b981']
      });
    } catch {
      // ignore
    }
  }, []);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(participant.checkInCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownloadPass = () => {
    const success = downloadGamerPass(participant, tournament, brandConfig);
    if (success) {
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const currentUatLogo = brandConfig.customLogoUatUrl || BRAND_ASSETS.uatEscudo;
  const currentFitLogo = brandConfig.customLogoFitUrl || BRAND_ASSETS.fitLogo;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in text-slate-900">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header with UAT & FIT Logos on White */}
        <div className="relative p-6 bg-slate-50 border-b border-slate-200">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5">
            {/* Logos Pair with white background */}
            <div className="flex items-center gap-2 p-1.5 bg-white rounded-xl border border-slate-200 shadow-2xs shrink-0">
              <img
                src={currentUatLogo}
                alt="Universidad Autónoma de Tamaulipas"
                className="h-8 w-auto max-w-[36px] object-contain"
              />
              <div className="w-[1px] h-6 bg-slate-200" />
              <img
                src={currentFitLogo}
                alt="Facultad de Ingeniería Tampico"
                className="h-5.5 w-auto max-w-[90px] object-contain"
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Inscripción Confirmada
                </span>
                <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-red-50 text-[#ed1c24] border border-red-200">
                  ESPORTS FIT
                </span>
              </div>
              <h3 className="text-xl font-bold font-heading text-[#002f6c] mt-1">
                Pase Oficial de Jugador
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Facultad de Ingeniería Tampico • UAT
              </p>
            </div>
          </div>
        </div>

        {/* Digital Pass Body on White */}
        <div className="p-6 space-y-5">
          
          {/* Main ID Ticket Surface */}
          <div className="relative rounded-xl border border-slate-200 bg-slate-50/70 p-5 shadow-xs overflow-hidden">
            {/* Top university stripe */}
            <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-[#002f6c] via-[#f15a24] to-[#002f6c]" />

            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <img
                  src={participant.avatarUrl}
                  alt={participant.gamertag}
                  className="w-14 h-14 rounded-xl border-2 border-slate-200 bg-white shadow-xs p-0.5 object-cover"
                />
                <div>
                  <div className="text-[11px] font-mono text-[#002f6c] uppercase tracking-wider flex items-center gap-1 font-bold">
                    <GraduationCap className="w-3.5 h-3.5 text-[#f15a24]" />
                    {participant.studentId ? `Matrícula: ${participant.studentId}` : 'Jugador FIT UAT'}
                  </div>
                  <h4 className="text-xl font-bold font-heading text-slate-900 tracking-tight">
                    {participant.gamertag}
                  </h4>
                  <p className="text-xs text-slate-500 font-mono truncate max-w-[210px]">
                    {participant.email}
                  </p>
                  {participant.faculty && (
                    <p className="text-[11px] text-[#f15a24] font-semibold font-mono mt-0.5 truncate max-w-[210px]">
                      {participant.faculty}
                    </p>
                  )}
                </div>
              </div>

              {/* Seed badge */}
              <div className="text-right shrink-0">
                <div className="text-[10px] uppercase font-mono text-slate-500">Seed en Llave</div>
                <div className="text-2xl font-bold font-heading text-[#002f6c] flex items-center justify-end gap-0.5">
                  <Hash className="w-4 h-4 text-slate-400" />
                  {participant.seedNumber}
                </div>
              </div>
            </div>

            {/* Tournament Details Grid */}
            <div className="mt-4 pt-3 border-t border-slate-200 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-500 block mb-0.5">Torneo</span>
                <span className="font-semibold text-slate-900 flex items-center gap-1.5 truncate">
                  <Gamepad2 className="w-3.5 h-3.5 text-[#f15a24] shrink-0" />
                  {participant.tournamentName}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-500 block mb-0.5">Plataforma</span>
                <span className="font-semibold text-slate-900 truncate block">
                  {participant.platform}
                </span>
              </div>
            </div>

            {/* Check-in Code Box with Copy */}
            <div className="mt-4 p-3 rounded-lg bg-white border border-slate-200 flex items-center justify-between gap-3 shadow-2xs">
              <div>
                <div className="text-[10px] uppercase font-mono text-slate-500 flex items-center gap-1">
                  <QrCode className="w-3.5 h-3.5 text-[#002f6c]" />
                  <span>Código de Check-In</span>
                </div>
                <div className="text-base font-mono font-bold text-[#002f6c] tracking-wider mt-0.5">
                  {participant.checkInCode}
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopyCode}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-mono font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>

            {/* Footer */}
            <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span className="flex items-center gap-1 font-semibold text-[#002f6c]">
                <School className="w-3 h-3 text-[#f15a24]" />
                "Verdad, Belleza, Probidad" • FIT UAT
              </span>
              <span>{participant.registeredAt}</span>
            </div>

          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={handleDownloadPass}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
              title="Descargar credencial oficial de competidor en formato imagen PNG"
            >
              {downloadSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>¡Pase Descargado!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Descargar Pase (PNG)</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer border border-slate-200"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Imprimir</span>
            </button>

            <button
              type="button"
              onClick={onRegisterAnother}
              className="w-full flex-1 py-2.5 px-4 rounded-xl bg-[#002f6c] hover:bg-[#002352] text-white font-bold font-mono text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <span>Inscribir Otro Jugador</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
