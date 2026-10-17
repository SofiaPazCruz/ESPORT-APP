import React, { useState, useEffect, useMemo } from 'react';
import { 
  Tournament, 
  Participant, 
  RegistrationFormData 
} from '../types/tournament';
import { UniversityBrandConfig, BRAND_ASSETS } from '../data/universityBrand';
import { 
  verifyTournamentCode, 
  getTournamentInviteCode 
} from '../utils/inviteCodes';
import { downloadGamerPass } from '../utils/passDownloader';
import { useGoogleAuth } from '../context/GoogleAuthContext';
import { 
  Gamepad2, 
  CheckCircle2, 
  AlertCircle, 
  Check, 
  Sparkles, 
  ArrowLeft, 
  Mail, 
  Calendar, 
  Trophy, 
  Printer, 
  UserPlus, 
  ChevronRight,
  ShieldCheck,
  Lock,
  Download
} from 'lucide-react';

interface PlayerRegistrationPortalProps {
  tournaments: Tournament[];
  participants: Participant[];
  brandConfig: UniversityBrandConfig;
  initialCode?: string;
  onAddParticipant: (data: RegistrationFormData) => {
    success: boolean;
    message: string;
    participant?: Participant;
    errorField?: 'gamertag' | 'email' | 'tournament';
  };
  onReturnToAdmin?: () => void;
}

const CAREERS = [
  'Ingeniería en Sistemas Computacionales (FIT)',
  'Ingeniería Industrial (FIT)',
  'Ingeniería Civil (FIT)',
  'Ingeniería en Telemática (FIT)',
  'Ingeniería Mecánica Eléctrica (FIT)',
  'Otra Facultad / Escuela UAT',
  'Comunidad Gamer Externa / Invitado'
];

export const PlayerRegistrationPortal: React.FC<PlayerRegistrationPortalProps> = ({
  tournaments,
  participants: _participants,
  brandConfig,
  initialCode = '',
  onAddParticipant,
  onReturnToAdmin
}) => {
  const { sendEmail } = useGoogleAuth();

  // Code input state
  const [codeInput, setCodeInput] = useState<string>(initialCode);

  // Form states
  const [gamertag, setGamertag] = useState('');
  const [email, setEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [faculty, setFaculty] = useState(CAREERS[0]);
  const [discordTag, setDiscordTag] = useState('');
  const [platform, setPlatform] = useState<RegistrationFormData['platform']>('PC');
  const [acceptRules, setAcceptRules] = useState(true);

  // Status and submission states
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredParticipant, setRegisteredParticipant] = useState<Participant | null>(null);
  const [emailDispatched, setEmailDispatched] = useState<boolean>(false);
  const [passDownloaded, setPassDownloaded] = useState<boolean>(false);

  // Live verification of code (automatic video game identification)
  const verification = useMemo(() => {
    return verifyTournamentCode(codeInput, tournaments);
  }, [codeInput, tournaments]);

  // Selected tournament from verified code
  const selectedTournament = verification.isValid ? verification.tournament : null;

  // Auto-fill code if initialCode changes
  useEffect(() => {
    if (initialCode) {
      setCodeInput(initialCode);
    }
  }, [initialCode]);

  const currentUatLogo = brandConfig.customLogoUatUrl || BRAND_ASSETS.uatEscudo;
  const currentFitLogo = brandConfig.customLogoFitUrl || BRAND_ASSETS.fitLogo;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedTournament) {
      setFormError('Por favor ingresa un código de torneo válido para habilitar tu inscripción.');
      return;
    }

    if (selectedTournament.status === 'COMPLETED') {
      setFormError('Este torneo ya ha finalizado. No es posible inscribirse.');
      return;
    }

    if (selectedTournament.currentSlots >= selectedTournament.maxSlots) {
      setFormError(`El torneo "${selectedTournament.name}" ya alcanzó el cupo máximo de participantes.`);
      return;
    }

    if (!gamertag.trim()) {
      setFormError('Por favor ingresa tu Gamertag o Nick de jugador.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setFormError('Por favor ingresa un correo electrónico válido para enviarte tu confirmación.');
      return;
    }

    if (!acceptRules) {
      setFormError('Debes aceptar el reglamento oficial del torneo para continuar.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = onAddParticipant({
        tournamentId: selectedTournament.id,
        gamertag: gamertag.trim(),
        email: email.trim(),
        studentId: studentId.trim() || undefined,
        faculty,
        discordTag: discordTag.trim(),
        platform,
        acceptRules: true
      });

      if (!result.success || !result.participant) {
        setFormError(result.message || 'Error al completar la inscripción.');
        setIsSubmitting(false);
        return;
      }

      const newParticipant = result.participant;
      setRegisteredParticipant(newParticipant);

      // Attempt automatic email dispatch
      try {
        const emailResult = await sendEmail(newParticipant, selectedTournament, brandConfig);
        setEmailDispatched(emailResult.success);
      } catch (err) {
        console.warn('Silent email fallback:', err);
        setEmailDispatched(false);
      }
    } catch (err) {
      console.error(err);
      setFormError('Ocurrió un error inesperado al procesar tu registro.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForAnother = () => {
    setRegisteredParticipant(null);
    setGamertag('');
    setEmail('');
    setStudentId('');
    setDiscordTag('');
    setFormError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col uat-grid selection:bg-[#f15a24] selection:text-white font-sans">
      
      {/* Standalone Header (Matches ArenaHub Institutional Theme) */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-30 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Institutional Logos */}
            <div className="flex items-center gap-2 p-1.5 bg-slate-50 rounded-xl border border-slate-200 shadow-2xs">
              <img 
                src={currentUatLogo} 
                alt="UAT" 
                className="h-7 w-auto max-w-[32px] object-contain" 
              />
              <div className="w-[1px] h-5 bg-slate-300" />
              <img 
                src={currentFitLogo} 
                alt="FIT UAT" 
                className="h-5 w-auto max-w-[80px] object-contain" 
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold text-[#002f6c] tracking-tight font-heading">
                  ESPORTS FIT UAT
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#f15a24]/10 text-[#f15a24] border border-[#f15a24]/20">
                  Portal Oficial de Inscripciones
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Facultad de Ingeniería Tampico • Universidad Autónoma de Tamaulipas
              </p>
            </div>
          </div>

          {onReturnToAdmin && (
            <button
              onClick={onReturnToAdmin}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-semibold transition-colors cursor-pointer"
              title="Volver al panel administrativo de ArenaHub"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Panel ArenaHub</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8">
        
        {/* SUCCESS CONFIRMATION STATE */}
        {registeredParticipant ? (
          <div className="space-y-6 animate-fade-in">
            {/* Success Alert Banner */}
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 shadow-xs flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-emerald-600 text-white shrink-0 shadow-xs">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-emerald-950 font-heading">
                  ¡Inscripción Exitosa en {selectedTournament?.name || 'el Torneo'}!
                </h2>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Tu registro ha sido procesado correctamente y aseguraste tu lugar en la llave oficial de la <strong>Facultad de Ingeniería Tampico (FIT UAT)</strong>.
                </p>
                {emailDispatched && (
                  <p className="text-xs text-emerald-700 font-medium flex items-center gap-1.5 pt-1">
                    <Mail className="w-3.5 h-3.5" />
                    <span>Se despachó el correo de confirmación oficial a <strong>{registeredParticipant.email}</strong>.</span>
                  </p>
                )}
              </div>
            </div>

            {/* Credencial Digital / Gamer Pass */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-md relative overflow-hidden space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-200">
                <div className="flex items-center gap-4">
                  <img 
                    src={registeredParticipant.avatarUrl} 
                    alt={registeredParticipant.gamertag}
                    className="w-16 h-16 rounded-2xl bg-slate-100 border-2 border-emerald-500 p-1 shadow-xs object-contain"
                  />
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                      Pase Oficial de Competidor
                    </span>
                    <h3 className="text-2xl font-extrabold text-[#002f6c] font-heading tracking-tight">
                      {registeredParticipant.gamertag}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {registeredParticipant.faculty || 'Facultad de Ingeniería Tampico'}
                    </p>
                  </div>
                </div>

                <div className="text-center sm:text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                    Código de Check-In Oficial
                  </span>
                  <div className="font-mono text-base font-bold px-3.5 py-1.5 rounded-xl bg-slate-900 text-white tracking-wider inline-block shadow-xs">
                    {registeredParticipant.checkInCode}
                  </div>
                  <span className="block text-[11px] text-slate-500 mt-1">
                    Semilla asignada: <strong className="text-slate-800">#{registeredParticipant.seedNumber}</strong>
                  </span>
                </div>
              </div>

              {/* Tournament Meta */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2 text-xs text-slate-600 border-b border-slate-200 pb-6">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Torneo</span>
                  <strong className="text-slate-900 font-semibold">{registeredParticipant.tournamentName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Videojuego</span>
                  <strong className="text-[#f15a24] font-semibold">{registeredParticipant.gameName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Plataforma</span>
                  <strong className="text-slate-900 font-semibold">{registeredParticipant.platform}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Fecha de Registro</span>
                  <strong className="text-slate-900 font-semibold">{registeredParticipant.registeredAt}</strong>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      if (registeredParticipant) {
                        const success = downloadGamerPass(registeredParticipant, selectedTournament, brandConfig);
                        if (success) {
                          setPassDownloaded(true);
                          setTimeout(() => setPassDownloaded(false), 3000);
                        }
                      }
                    }}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-colors"
                    title="Descargar credencial oficial en imagen PNG a tu dispositivo"
                  >
                    {passDownloaded ? (
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
                    onClick={() => window.print()}
                    className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 cursor-pointer transition-colors"
                    title="Imprimir credencial"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Imprimir</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleResetForAnother}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#f15a24] hover:bg-[#d94817] text-white text-xs font-bold shadow-md shadow-orange-600/20 cursor-pointer transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Inscribir a otro participante</span>
                </button>
              </div>
            </div>
          </div>
        ) : tournaments.length === 0 ? (
          <div className="p-8 sm:p-12 rounded-3xl bg-white border border-slate-200 text-center space-y-4 shadow-xs">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#f15a24]">
              <Gamepad2 className="w-7 h-7" />
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <h3 className="text-lg font-bold font-heading text-slate-900">
                No hay torneos habilitados en este momento
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Aún no se han habilitado torneos de videojuegos para registro. Por favor contacta al comité organizador de la Facultad de Ingeniería Tampico para conocer las próximas convocatorias.
              </p>
            </div>
          </div>
        ) : (
          /* REGISTRATION FORM STATE */
          <div className="space-y-6">

            {/* Welcome Banner */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs relative overflow-hidden space-y-2">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-100/50 to-blue-100/40 rounded-full blur-2xl pointer-events-none -mr-16 -mt-16" />

              <div className="relative z-10 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#f15a24] uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  <span>Formulario Oficial de Inscripción</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#002f6c] font-heading tracking-tight">
                  Registro de Jugadores a Torneos
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Ingresa el código único del torneo de videojuego que te fue proporcionado. El sistema verificará de forma automática el videojuego y activará tu registro oficial para la <strong>Facultad de Ingeniería Tampico (FIT UAT)</strong>.
                </p>
              </div>
            </div>

            {/* PASO 1: VERIFICADOR AUTOMÁTICO DE CÓDIGO */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <Gamepad2 className="w-4 h-4 text-[#f15a24]" />
                  <span>1. Código de Invitación del Torneo</span>
                </label>
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  Verificación Automática
                </span>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={codeInput}
                  onChange={(e) => {
                    setCodeInput(e.target.value);
                    setFormError(null);
                  }}
                  placeholder="Escribe aquí tu código de invitación..."
                  className="w-full uppercase font-mono tracking-wider font-bold text-base sm:text-lg bg-slate-50 text-slate-900 placeholder:text-slate-400 px-4 py-3.5 pr-12 rounded-2xl border-2 border-slate-300 focus:border-[#f15a24] focus:bg-white focus:outline-hidden transition-all shadow-inner"
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {verification.isValid ? (
                    <div className="p-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-300" title="Código verificado">
                      <Check className="w-5 h-5 stroke-[3]" />
                    </div>
                  ) : codeInput.trim() ? (
                    <div className="p-1 rounded-full bg-amber-100 text-amber-700 border border-amber-300" title="Código no reconocido">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                  ) : (
                    <Lock className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {/* LIVE VERIFICATION STATUS CARD (SHOWS ONLY THE RECOGNIZED TOURNAMENT, NO OTHER CODES) */}
              {verification.isValid && selectedTournament ? (
                <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/80 border-2 border-emerald-400 shadow-2xs animate-fade-in space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-2xs">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Código Verificado
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-800">
                        {getTournamentInviteCode(selectedTournament)}
                      </span>
                    </div>

                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white text-emerald-900 border border-emerald-200 shadow-2xs">
                      {selectedTournament.currentSlots} / {selectedTournament.maxSlots} Cupos Ocupados
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-emerald-200">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-700 block">
                        Videojuego Detectado:
                      </span>
                      <h3 className="text-base font-extrabold text-[#002f6c] font-heading">
                        {selectedTournament.gameName} — {selectedTournament.name}
                      </h3>
                      <p className="text-xs text-slate-600">
                        Modalidad: <strong>{selectedTournament.format}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-emerald-200">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{selectedTournament.startDate}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : codeInput.trim() ? (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>
                    El código <strong>"{codeInput}"</strong> no coincide con ningún torneo activo. Por favor revisa que lo hayas escrito correctamente según te fue proporcionado.
                  </span>
                </div>
              ) : (
                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Introduce el código de torneo proporcionado por el organizador para habilitar el formulario.</span>
                </p>
              )}
            </div>

            {/* PASO 2: FORMULARIO DE DATOS DEL JUGADOR */}
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-6">
              <div className="border-b border-slate-200 pb-4">
                <h2 className="text-lg font-bold text-[#002f6c] font-heading flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-[#f15a24]" />
                  <span>2. Datos del Estudiante / Jugador</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Completa tu registro para asegurar tu lugar en la llave oficial y recibir tu credencial de competidor.
                </p>
              </div>

              {formError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-300 text-red-700 text-xs flex items-center gap-2.5 animate-shake">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Gamertag */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Gamertag / Nickname en el juego *
                  </label>
                  <input
                    type="text"
                    required
                    value={gamertag}
                    onChange={(e) => setGamertag(e.target.value)}
                    placeholder="Ej. CastorPro_UAT"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 focus:bg-white text-slate-900 focus:border-[#f15a24] focus:outline-hidden text-sm"
                  />
                  <span className="text-[10px] text-slate-400 block">
                    Nombre visible en la llave de eliminación
                  </span>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alumno@uat.edu.mx o personal"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 focus:bg-white text-slate-900 focus:border-[#f15a24] focus:outline-hidden text-sm"
                  />
                  <span className="text-[10px] text-emerald-700 block font-medium">
                    ⚡ Aquí se enviará automáticamente tu confirmación oficial de registro.
                  </span>
                </div>

                {/* Matrícula */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Matrícula UAT (Opcional)
                  </label>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="Ej. a22030145"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 focus:bg-white text-slate-900 focus:border-[#f15a24] focus:outline-hidden text-sm"
                  />
                </div>

                {/* Carrera / Facultad */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Carrera / Facultad *
                  </label>
                  <select
                    value={faculty}
                    onChange={(e) => setFaculty(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 focus:bg-white text-slate-900 focus:border-[#f15a24] focus:outline-hidden text-sm"
                  >
                    {CAREERS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Discord */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Usuario de Discord (Opcional)
                  </label>
                  <input
                    type="text"
                    value={discordTag}
                    onChange={(e) => setDiscordTag(e.target.value)}
                    placeholder="Ej. usuario#1234 o @usuario"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 focus:bg-white text-slate-900 focus:border-[#f15a24] focus:outline-hidden text-sm"
                  />
                </div>

                {/* Plataforma */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Plataforma Principal *
                  </label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value as RegistrationFormData['platform'])}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 focus:bg-white text-slate-900 focus:border-[#f15a24] focus:outline-hidden text-sm"
                  >
                    <option value="PC">PC (Windows / Steam / Riot)</option>
                    <option value="PlayStation 5">PlayStation 5 / PS4</option>
                    <option value="Xbox Series X/S">Xbox Series X/S / One</option>
                    <option value="Nintendo Switch">Nintendo Switch</option>
                    <option value="Mobile">Móvil (iOS / Android)</option>
                  </select>
                </div>
              </div>

              {/* Accept Rules */}
              <div className="pt-2">
                <label className="flex items-start gap-3 text-xs text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptRules}
                    onChange={(e) => setAcceptRules(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-[#f15a24] focus:ring-[#f15a24]"
                  />
                  <span>
                    Acepto el reglamento general de torneos y el código de conducta de la <strong>Facultad de Ingeniería Tampico (FIT UAT)</strong>. Me comprometo a jugar con deportividad y respeto.
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-500">
                  {selectedTournament ? (
                    <span>Registrando en: <strong className="text-[#002f6c]">{selectedTournament.name}</strong></span>
                  ) : (
                    <span className="text-amber-700">⚠️ Ingresa un código arriba para habilitar el registro</span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !selectedTournament}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#f15a24] to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-extrabold text-sm shadow-md shadow-orange-600/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Procesando inscripción...</span>
                    </>
                  ) : (
                    <>
                      <span>Completar Inscripción Oficial</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        )}

      </main>

      {/* Institutional Standalone Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-xs text-slate-500 mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <strong className="text-slate-800">ESPORTS FIT UAT</strong> • Facultad de Ingeniería Tampico • Universidad Autónoma de Tamaulipas
            <p className="text-[11px] text-slate-500 mt-0.5">"{brandConfig.motto}"</p>
          </div>
          <div className="text-[11px] text-slate-400">
            Campus Tampico • Centro Universitario Sur
          </div>
        </div>
      </footer>
    </div>
  );
};
