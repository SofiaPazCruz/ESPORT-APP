import React, { useState, useId } from 'react';
import { Tournament, Participant, RegistrationFormData } from '../types/tournament';
import { UniversityBrandConfig, UNIVERSITY_FACULTIES } from '../data/universityBrand';
import { GamerPassModal } from '../components/GamerPassModal';
import { getTournamentInviteCode } from '../utils/inviteCodes';
import confetti from 'canvas-confetti';
import { 
  CheckCircle2, 
  Gamepad2, 
  ShieldAlert, 
  ArrowRight, 
  UserPlus, 
  AlertCircle,
  School,
  IdCard,
  QrCode,
  Calendar,
  Sparkles,
  Trophy,
  Mail,
  Check,
  X,
  Send,
  Loader2
} from 'lucide-react';
import { useGoogleAuth } from '../context/GoogleAuthContext';
import { GoogleConnectButton } from '../components/GoogleConnectButton';

interface RegistrationWindowProps {
  tournaments: Tournament[];
  participants: Participant[];
  brandConfig: UniversityBrandConfig;
  selectedTournamentId?: number;
  onSelectTournamentId?: (id: number) => void;
  onAddParticipant: (data: RegistrationFormData) => { 
    success: boolean; 
    message: string; 
    participant?: Participant; 
    errorField?: 'gamertag' | 'email' | 'tournament' 
  };
  onGoToBrackets?: (tournamentId: number) => void;
  onGoToTournaments?: () => void;
  onMarkEmailSent?: (participantId: number) => void;
}

interface RegistrationSuccessInfo {
  participant: Participant;
  tournament: Tournament;
  emailSentAt: string;
  isRealEmailSent?: boolean;
  realEmailError?: string;
  realMessageId?: string;
}

export const RegistrationWindow: React.FC<RegistrationWindowProps> = ({
  tournaments,
  participants,
  brandConfig,
  selectedTournamentId: initialTourneyId,
  onSelectTournamentId,
  onAddParticipant,
  onGoToBrackets,
  onGoToTournaments,
  onMarkEmailSent,
}) => {
  const { isGmailConnected, sendEmail, user } = useGoogleAuth();
  const [isSendingRealEmailNow, setIsSendingRealEmailNow] = useState<boolean>(false);
  const gamertagInputId = useId();
  const emailInputId = useId();
  const studentIdInputId = useId();
  const facultySelectId = useId();
  const platformSelectId = useId();
  const discordInputId = useId();

  const [selectedTournamentId, setSelectedTournamentId] = useState<number>(
    initialTourneyId || tournaments[0]?.id || 101
  );
  const [gamertag, setGamertag] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [studentId, setStudentId] = useState<string>('');
  const [faculty, setFaculty] = useState<string>(UNIVERSITY_FACULTIES[0]);
  const [platform, setPlatform] = useState<RegistrationFormData['platform']>('PC');
  const [discordTag, setDiscordTag] = useState<string>('');
  const [acceptRules, setAcceptRules] = useState<boolean>(true);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<{ field?: string; message: string } | null>(null);
  const [activeModalParticipant, setActiveModalParticipant] = useState<Participant | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState<RegistrationSuccessInfo | null>(null);

  const currentTournament = tournaments.find(t => t.id === selectedTournamentId) || tournaments[0];
  const isFull = currentTournament ? currentTournament.currentSlots >= currentTournament.maxSlots : false;
  const remainingSlots = currentTournament ? Math.max(0, currentTournament.maxSlots - currentTournament.currentSlots) : 0;

  // Real-time validations
  const isGamertagValid = gamertag.trim().length >= 3 && gamertag.trim().length <= 30 && /^[a-zA-Z0-9_.-]+$/.test(gamertag.trim());
  const isEmailValid = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim());

  // Proactive check for duplicates
  const gamertagDuplicateWarning = participants.some(
    p => p.tournamentId === selectedTournamentId && p.gamertag.toLowerCase() === gamertag.trim().toLowerCase()
  );
  const emailDuplicateWarning = participants.some(
    p => p.tournamentId === selectedTournamentId && p.email.toLowerCase() === email.trim().toLowerCase()
  );

  const canSubmit = isGamertagValid && isEmailValid && acceptRules && !isFull && !isSubmitting && !gamertagDuplicateWarning && !emailDuplicateWarning;

  const handleDispatchRealEmailForCurrentSuccess = async () => {
    if (!registrationSuccess) return;
    setIsSendingRealEmailNow(true);
    try {
      const emailRes = await sendEmail(
        registrationSuccess.participant, 
        registrationSuccess.tournament, 
        brandConfig
      );
      if (emailRes.success) {
        setRegistrationSuccess(prev => prev ? ({
          ...prev,
          isRealEmailSent: true,
          realEmailError: undefined,
          realMessageId: emailRes.messageId,
          emailSentAt: emailRes.sentAt || prev.emailSentAt,
        }) : null);
        if (onMarkEmailSent) onMarkEmailSent(registrationSuccess.participant.id);
      } else {
        setRegistrationSuccess(prev => prev ? ({
          ...prev,
          realEmailError: emailRes.error,
        }) : null);
      }
    } catch (err: unknown) {
      setRegistrationSuccess(prev => prev ? ({
        ...prev,
        realEmailError: err instanceof Error ? err.message : 'Error al enviar por Gmail',
      }) : null);
    } finally {
      setIsSendingRealEmailNow(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setFormError(null);
    setIsSubmitting(true);

    const result = onAddParticipant({
      tournamentId: selectedTournamentId,
      gamertag: gamertag.trim(),
      email: email.trim().toLowerCase(),
      studentId: studentId.trim() || undefined,
      faculty: faculty || undefined,
      platform,
      discordTag: discordTag.trim(),
      acceptRules
    });

    if (result.success && result.participant) {
      const newlyAdded = result.participant;
      const registeredTourney = tournaments.find(t => t.id === newlyAdded.tournamentId) || currentTournament;

      let isRealSent = false;
      let emailError: string | undefined = undefined;
      let messageId: string | undefined = undefined;

      // Si Gmail está conectado, despachar inmediatamente a la bandeja de entrada real
      if (isGmailConnected) {
        try {
          const emailRes = await sendEmail(newlyAdded, registeredTourney, brandConfig);
          if (emailRes.success) {
            isRealSent = true;
            messageId = emailRes.messageId;
            if (onMarkEmailSent) {
              onMarkEmailSent(newlyAdded.id);
            }
          } else {
            emailError = emailRes.error;
          }
        } catch (err: unknown) {
          emailError = err instanceof Error ? err.message : 'Error al enviar por Gmail';
        }
      } else {
        // Registro exitoso, correo preparado para despacho automático
        if (onMarkEmailSent) {
          onMarkEmailSent(newlyAdded.id);
        }
      }

      setIsSubmitting(false);

      // Guardar información visible de confirmación de registro
      setRegistrationSuccess({
        participant: newlyAdded,
        tournament: registeredTourney,
        emailSentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isRealEmailSent: isRealSent,
        realEmailError: emailError,
        realMessageId: messageId,
      });

      // Celebración con confeti
      try {
        confetti({
          particleCount: 65,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#002f6c', '#10b981', '#f15a24', '#059669']
        });
      } catch {
        // ignore
      }

      // Limpiar formulario para permitir registrar a otro estudiante
      setGamertag('');
      setEmail('');
      setStudentId('');
      setDiscordTag('');
      setFormError(null);
    } else {
      setIsSubmitting(false);
      setFormError({
        field: result.errorField,
        message: result.message
      });
    }
  };

  const handleSelectTournament = (id: number) => {
    setSelectedTournamentId(id);
    if (onSelectTournamentId) onSelectTournamentId(id);
    setFormError(null);
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-900">
      
      {/* WINDOW TITLE BANNER */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#002f6c]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#002f6c]">
              Registro Universitario
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-[#002f6c] mt-1 flex items-center gap-2.5">
            <UserPlus className="w-8 h-8 text-[#002f6c]" />
            <span>Inscripción de Jugadores</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 max-w-xl">
            Inscribe a tu jugador al torneo de videojuegos de la FIT UAT, valida tus datos y obtén tu pase digital oficial de competencia.
          </p>
        </div>

        {currentTournament && (
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs font-semibold text-[#002f6c] shrink-0 space-y-1">
            <div className="flex items-center justify-between gap-3">
              <span className="block text-[10px] text-slate-500 uppercase">Torneo Activo</span>
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#002f6c] text-white">
                {getTournamentInviteCode(currentTournament)}
              </span>
            </div>
            <span className="font-bold text-sm block">{currentTournament.gameName}</span>
            <span className="text-[11px] text-slate-600 block">{remainingSlots} cupos disponibles</span>
          </div>
        )}
      </div>

      {/* MENSAJE DE REGISTRO EXITOSO Y NOTIFICACIÓN DE CORREO AUTOMÁTICO */}
      {registrationSuccess && (
        <div className="bg-gradient-to-br from-emerald-50 via-white to-blue-50/50 rounded-3xl border-2 border-emerald-500/30 p-6 sm:p-7 shadow-lg shadow-emerald-900/5 space-y-5 animate-fade-in relative overflow-hidden">
          {/* Barra decorativa superior */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-[#002f6c] to-emerald-500" />
          
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wider border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Registro Exitoso
                  </span>
                  
                  {registrationSuccess.isRealEmailSent ? (
                    <span className="px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wider border border-emerald-300 flex items-center gap-1.5 shadow-2xs">
                      <Check className="w-3.5 h-3.5 text-emerald-600" /> Correo Enviado a Bandeja Real vía Gmail
                    </span>
                  ) : (
                    <span className="px-3 py-0.5 rounded-full bg-blue-100 text-[#002f6c] text-[10px] font-extrabold uppercase tracking-wider border border-blue-200 flex items-center gap-1.5 shadow-2xs">
                      <Mail className="w-3.5 h-3.5 text-[#002f6c]" /> Guardado en Padrón Oficial
                    </span>
                  )}
                </div>

                <h3 className="text-xl sm:text-2xl font-extrabold font-heading text-slate-900 mt-1">
                  ¡Alumno inscrito con éxito!
                </h3>
                
                <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed max-w-3xl">
                  El alumno <strong className="text-slate-900 font-bold">{registrationSuccess.participant.gamertag}</strong> quedó registrado en la base de datos oficial. 
                  {registrationSuccess.isRealEmailSent ? (
                    <span> Se despachó el correo de bienvenida oficial directamente a la bandeja de entrada de <strong className="text-emerald-700 font-bold">{registrationSuccess.participant.email}</strong> desde el correo oficial <strong className="font-mono text-emerald-800">({user?.email || 'pasantiasdigitales@gmail.com'})</strong>.</span>
                  ) : (
                    <span> Toda la información del torneo, fecha, hora y su código de acceso quedaron generados para <strong className="text-[#002f6c] underline decoration-[#002f6c]/30 font-bold">{registrationSuccess.participant.email}</strong>.</span>
                  )}
                </p>
              </div>
            </div>

            <button
              onClick={() => setRegistrationSuccess(null)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors self-start cursor-pointer border border-transparent hover:border-slate-200"
              title="Cerrar mensaje"
              aria-label="Cerrar notificación"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* TARJETAS RESUMEN DE LA INSCRIPCIÓN Y DEL CORREO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-1">
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1 flex items-center gap-1">
                <Gamepad2 className="w-3.5 h-3.5 text-[#002f6c]" /> Torneo & Videojuego
              </span>
              <p className="font-bold text-slate-900 truncate">{registrationSuccess.tournament.name}</p>
              <p className="text-[11px] text-[#ed1c24] font-semibold">{registrationSuccess.tournament.gameName}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" /> Fecha y Hora Oficial
              </span>
              <p className="font-bold text-slate-900">{registrationSuccess.tournament.startDate}</p>
              <p className="text-[11px] text-slate-500 truncate">{registrationSuccess.tournament.region}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-blue-600" /> Correo Notificado
              </span>
              <p className="font-bold text-slate-900 truncate">{registrationSuccess.participant.email}</p>
              <p className="text-[11px] font-bold flex items-center gap-1 mt-0.5">
                {registrationSuccess.isRealEmailSent ? (
                  <span className="text-emerald-600 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-600" /> Enviado vía Gmail ({registrationSuccess.emailSentAt})
                  </span>
                ) : (
                  <span className="text-blue-700 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-blue-600" /> Registrado ({registrationSuccess.emailSentAt})
                  </span>
                )}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1 flex items-center gap-1">
                <QrCode className="w-3.5 h-3.5 text-[#002f6c]" /> Código de Check-In
              </span>
              <p className="font-mono font-extrabold text-[#002f6c] text-sm tracking-wider">
                {registrationSuccess.participant.checkInCode}
              </p>
              <p className="text-[10px] text-slate-500">Seed #{registrationSuccess.participant.seedNumber} en Llave</p>
            </div>
          </div>

          {/* Si aún no se envió por Gmail real, ofrecer envío con 1 clic aquí mismo */}
          {!registrationSuccess.isRealEmailSent && (
            <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-start gap-2.5">
                <div className="p-2 rounded-xl bg-[#002f6c] text-white shrink-0 mt-0.5">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-[#002f6c] block">
                    {isGmailConnected 
                      ? 'Despacha el correo a su bandeja de entrada real' 
                      : 'Conecta Gmail para enviar a la bandeja de entrada real'}
                  </span>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    {isGmailConnected
                      ? `Tu cuenta de Gmail (${user?.email}) está conectada y lista.`
                      : 'Al conectar tu cuenta de Gmail, los correos de bienvenida saldrán automáticamente a la bandeja de entrada de cada alumno.'}
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                {isGmailConnected ? (
                  <button
                    type="button"
                    onClick={handleDispatchRealEmailForCurrentSuccess}
                    disabled={isSendingRealEmailNow}
                    className="px-4 py-2 rounded-xl bg-[#002f6c] hover:bg-[#002352] text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    {isSendingRealEmailNow ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Enviando...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Enviar a su bandeja ahora</span>
                      </>
                    )}
                  </button>
                ) : (
                  <GoogleConnectButton compact onSuccess={handleDispatchRealEmailForCurrentSuccess} />
                )}
              </div>
            </div>
          )}

          {registrationSuccess.realEmailError && (
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between">
              <span>⚠️ Nota de envío: {registrationSuccess.realEmailError}</span>
              <button 
                onClick={handleDispatchRealEmailForCurrentSuccess}
                className="text-[#002f6c] font-bold hover:underline ml-2 text-xs"
              >
                Reintentar
              </button>
            </div>
          )}

          {/* BARRA DE ACCIONES POST-REGISTRO */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-emerald-100/90 text-xs">
            <div className="flex items-center gap-2 text-slate-600 text-xs">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Plaza asegurada en la llave y participante registrado en el padrón universitario.</span>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setActiveModalParticipant(registrationSuccess.participant)}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold border border-slate-200 shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <IdCard className="w-4 h-4 text-[#002f6c]" />
                <span>Ver Pase de Jugador</span>
              </button>

              <button
                type="button"
                onClick={() => setRegistrationSuccess(null)}
                className="px-4 py-2 rounded-xl bg-[#002f6c] hover:bg-[#002454] text-white font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <UserPlus className="w-4 h-4 text-white" />
                <span>Inscribir a Otro Alumno</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {tournaments.length === 0 ? (
        <div className="py-16 px-6 rounded-3xl border border-dashed border-slate-200 bg-white text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#f15a24]">
            <Gamepad2 className="w-7 h-7 text-[#f15a24]" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-lg font-bold font-heading text-slate-900">
              No hay torneos registrados para inscripción
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              La plataforma está lista para su primer uso. Primero crea un torneo en el Catálogo de Torneos para habilitar el registro de estudiantes y la expedición de pases oficiales de jugador.
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
        /* REGISTRATION GRID */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* FORM ON LEFT (7 Cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold font-heading text-slate-900">
                Formulario de Inscripción
              </h2>
            <span className="text-xs text-slate-500">
              Campos marcados con <span className="text-rose-500 font-bold">*</span> son requeridos
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* 1. SELECT TOURNAMENT */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2">
                1. Torneo de Videojuegos <span className="text-rose-500">*</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {tournaments.map((t) => {
                  const isSelected = selectedTournamentId === t.id;
                  const isTourneyFull = t.currentSlots >= t.maxSlots;

                  return (
                    <button
                      key={t.id}
                      type="button"
                      disabled={isTourneyFull}
                      onClick={() => handleSelectTournament(t.id)}
                      className={`p-3 text-left rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#002f6c] bg-blue-50/60 ring-2 ring-[#002f6c]/20 shadow-xs'
                          : isTourneyFull
                          ? 'border-slate-200 bg-slate-100 opacity-60 cursor-not-allowed'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {t.gameName}
                        </span>
                        <span className={`text-[10px] font-bold ${
                          isTourneyFull ? 'text-rose-600' : 'text-[#002f6c]'
                        }`}>
                          {isTourneyFull ? 'LLENO' : `${t.currentSlots}/${t.maxSlots}`}
                        </span>
                      </div>
                      <p className="font-bold text-xs text-slate-900 truncate">{t.name}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. GAMERTAG + STUDENT ID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor={gamertagInputId} className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                  2. Gamertag / Apodo <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id={gamertagInputId}
                    type="text"
                    value={gamertag}
                    onChange={(e) => setGamertag(e.target.value)}
                    placeholder="Ej. Castor_Pro"
                    maxLength={30}
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 ${
                      gamertagDuplicateWarning
                        ? 'border-rose-400 focus:ring-rose-400'
                        : isGamertagValid
                        ? 'border-emerald-500 focus:ring-emerald-500'
                        : 'border-slate-300 focus:ring-[#002f6c]/20'
                    }`}
                  />
                  <div className="absolute right-3 top-2.5">
                    {gamertagDuplicateWarning && (
                      <span className="text-[11px] text-rose-600 font-bold">Ya registrado</span>
                    )}
                    {isGamertagValid && !gamertagDuplicateWarning && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor={studentIdInputId} className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                  Matrícula UAT <span className="text-slate-400 text-[10px] lowercase">(opcional)</span>
                </label>
                <input
                  id={studentIdInputId}
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="Ej. 2203049182"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#002f6c]/20"
                />
              </div>
            </div>

            {/* 3. EMAIL + FACULTY */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor={emailInputId} className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                  3. Correo Electrónico <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id={emailInputId}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jugador@alumnos.uat.edu.mx"
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 ${
                      emailDuplicateWarning
                        ? 'border-rose-400 focus:ring-rose-400'
                        : isEmailValid
                        ? 'border-emerald-500 focus:ring-emerald-500'
                        : 'border-slate-300 focus:ring-[#002f6c]/20'
                    }`}
                  />
                  <div className="absolute right-3 top-2.5">
                    {emailDuplicateWarning && (
                      <span className="text-[11px] text-rose-600 font-bold">Correo registrado</span>
                    )}
                    {isEmailValid && !emailDuplicateWarning && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor={facultySelectId} className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                  Carrera o Facultad
                </label>
                <select
                  id={facultySelectId}
                  value={faculty}
                  onChange={(e) => setFaculty(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#002f6c]/20 truncate"
                >
                  {UNIVERSITY_FACULTIES.map((fac) => (
                    <option key={fac} value={fac}>{fac}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 4. PLATFORM + DISCORD */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor={platformSelectId} className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                  Plataforma
                </label>
                <select
                  id={platformSelectId}
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as RegistrationFormData['platform'])}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#002f6c]/20"
                >
                  <option value="PC">PC (Steam / Riot / Epic)</option>
                  <option value="PlayStation 5">PlayStation 5</option>
                  <option value="Xbox Series X/S">Xbox Series X/S</option>
                  <option value="Nintendo Switch">Nintendo Switch</option>
                  <option value="Mobile">Móvil (Android / iOS)</option>
                </select>
              </div>

              <div>
                <label htmlFor={discordInputId} className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                  Discord <span className="text-slate-400 text-[10px] lowercase">(opcional)</span>
                </label>
                <input
                  id={discordInputId}
                  type="text"
                  value={discordTag}
                  onChange={(e) => setDiscordTag(e.target.value)}
                  placeholder="@usuario"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#002f6c]/20"
                />
              </div>
            </div>

            {/* 5. RULES */}
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={acceptRules}
                onChange={(e) => setAcceptRules(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-[#002f6c] focus:ring-[#002f6c]"
              />
              <span className="text-xs text-slate-600 leading-relaxed">
                Acepto el reglamento del torneo de videojuegos y confirmo mi asistencia a la hora de partida establecida por la Facultad de Ingeniería Tampico.
              </span>
            </label>

            {formError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError.message}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#002f6c] hover:bg-[#002454] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <span>Registrando...</span>
              ) : (
                <>
                  <Gamepad2 className="w-4 h-4" />
                  <span>Completar Inscripción & Generar Pase</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

        </div>

        {/* DETAILS CARD ON RIGHT (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          {currentTournament && (
            <div className="p-6 rounded-3xl border border-slate-200 bg-white shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#002f6c] uppercase tracking-wider flex items-center gap-1.5">
                  <Gamepad2 className="w-4 h-4 text-[#ed1c24]" />
                  Ficha del Torneo
                </span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Activo
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold font-heading text-slate-900 leading-tight">
                  {currentTournament.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1">{currentTournament.gameName} · {currentTournament.region}</p>
              </div>

              {/* Progress */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <div className="flex justify-between text-xs font-semibold text-slate-600">
                  <span>Lugares Ocupados</span>
                  <span className="text-[#002f6c]">{currentTournament.currentSlots} / {currentTournament.maxSlots}</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                  <div
                    className="h-full rounded-full bg-[#ed1c24] transition-all"
                    style={{ width: `${Math.max(4, (currentTournament.currentSlots / currentTournament.maxSlots) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Specs */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Formato</span>
                  <span className="font-semibold text-slate-800 truncate block mt-0.5">{currentTournament.format}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Premio</span>
                  <span className="font-semibold text-[#002f6c] truncate block mt-0.5">{currentTournament.prizePool}</span>
                </div>
              </div>

              {onGoToBrackets && (
                <div className="pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => onGoToBrackets(currentTournament.id)}
                    className="w-full py-2.5 px-4 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#f15a24] font-bold text-xs flex items-center justify-center gap-2 cursor-pointer border border-orange-200 transition-all"
                  >
                    <Trophy className="w-4 h-4 text-[#f15a24]" />
                    <span>Ver Brackets de este Torneo →</span>
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="p-5 rounded-3xl border border-slate-200 bg-white shadow-sm space-y-2 text-xs text-slate-500">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <School className="w-4 h-4 text-[#002f6c]" />
              <span>Facultad de Ingeniería Tampico • UAT</span>
            </h4>
            <p className="leading-relaxed">
              Todos los participantes inscritos quedan registrados con código único de verificación y pase digital oficial para el día de competencia.
            </p>
          </div>
        </div>
      </div>
      )}

      {activeModalParticipant && (
        <GamerPassModal
          participant={activeModalParticipant}
          tournament={tournaments.find(t => t.id === activeModalParticipant.tournamentId)}
          brandConfig={brandConfig}
          onClose={() => setActiveModalParticipant(null)}
          onRegisterAnother={() => setActiveModalParticipant(null)}
        />
      )}

    </div>
  );
};
