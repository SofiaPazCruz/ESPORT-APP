import React from 'react';
import { useGoogleAuth } from '../context/GoogleAuthContext';
import { Mail, CheckCircle2, LogOut, Loader2, ArrowRightLeft, ShieldCheck } from 'lucide-react';

interface GoogleConnectButtonProps {
  compact?: boolean;
  onSuccess?: () => void;
}

export const GoogleConnectButton: React.FC<GoogleConnectButtonProps> = ({ compact = false, onSuccess }) => {
  const { 
    user, 
    isGmailConnected, 
    isOfficialEmailConnected,
    officialEmail,
    isLoggingIn, 
    loginWithGoogle, 
    logoutGoogle, 
    loginError 
  } = useGoogleAuth();

  const handleSignInOfficial = async () => {
    const token = await loginWithGoogle(officialEmail);
    if (token && onSuccess) {
      onSuccess();
    }
  };

  const handleSwitchAccount = async () => {
    await logoutGoogle();
    const token = await loginWithGoogle(officialEmail);
    if (token && onSuccess) {
      onSuccess();
    }
  };

  const handleSignInAny = async () => {
    const token = await loginWithGoogle('');
    if (token && onSuccess) {
      onSuccess();
    }
  };

  // Connected state
  if (isGmailConnected && user) {
    if (isOfficialEmailConnected) {
      return (
        <div className={`flex flex-col gap-2 rounded-2xl bg-emerald-50/95 border border-emerald-300 shadow-xs ${compact ? 'p-2.5' : 'p-3.5'}`}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName || officialEmail} 
                  className="w-7 h-7 rounded-full border border-emerald-300 object-cover shrink-0" 
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-emerald-950 truncate">
                    Cuenta Oficial
                  </span>
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-900 shrink-0">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-700" />
                    Gmail Activo
                  </span>
                </div>
                <p className="text-[11px] font-mono font-medium text-emerald-800 truncate" title={officialEmail}>
                  {officialEmail}
                </p>
              </div>
            </div>

            <button
              onClick={logoutGoogle}
              title="Desconectar cuenta"
              className="p-1.5 rounded-lg text-emerald-700 hover:text-red-600 hover:bg-emerald-100/60 transition-colors cursor-pointer shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[10px] text-emerald-800 leading-tight">
            ⚡ Los correos de bienvenida se envían de forma 100% real y automática desde <strong>{officialEmail}</strong>.
          </p>
        </div>
      );
    }

    // Connected with a different email than pasantiasdigitales@gmail.com
    return (
      <div className={`flex flex-col gap-2 rounded-2xl bg-amber-50/95 border border-amber-300 shadow-xs ${compact ? 'p-2.5' : 'p-3'}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {user.photoURL ? (
              <img 
                src={user.photoURL} 
                alt={user.displayName || user.email || 'Google User'} 
                className="w-6 h-6 rounded-full border border-amber-300 object-cover shrink-0" 
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                {user.email?.charAt(0).toUpperCase() || 'G'}
              </div>
            )}
            <div className="min-w-0">
              <span className="text-[11px] font-semibold text-amber-900 block truncate">
                Conectado como {user.email}
              </span>
              <span className="text-[10px] text-amber-700 block">
                Cuenta oficial requerida: <strong className="font-mono text-amber-900">{officialEmail}</strong>
              </span>
            </div>
          </div>

          <button
            onClick={logoutGoogle}
            title="Cerrar sesión"
            className="p-1 text-amber-700 hover:text-red-600 hover:bg-amber-100 rounded cursor-pointer shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          type="button"
          onClick={handleSwitchAccount}
          disabled={isLoggingIn}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold cursor-pointer transition-colors shadow-2xs"
        >
          <ArrowRightLeft className="w-3 h-3" />
          <span>Cambiar a {officialEmail}</span>
        </button>
      </div>
    );
  }

  // Not connected state
  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-2 text-[11px] text-blue-900 leading-snug">
        <div className="flex items-center gap-1.5 font-bold text-[#002f6c] mb-0.5">
          <Mail className="w-3.5 h-3.5 text-[#002f6c]" />
          <span>Remitente oficial de correos</span>
        </div>
        <p className="font-mono text-[10px] text-blue-800 font-semibold truncate">
          {officialEmail}
        </p>
      </div>

      <button
        type="button"
        onClick={handleSignInOfficial}
        disabled={isLoggingIn}
        className={`w-full relative flex items-center justify-center gap-2.5 px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-800 hover:text-slate-950 border border-slate-300 rounded-xl shadow-xs transition-all font-bold text-xs cursor-pointer active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed ${
          compact ? 'py-2 px-3 text-[11px]' : ''
        }`}
      >
        {isLoggingIn ? (
          <>
            <Loader2 className="w-4 h-4 text-[#002f6c] animate-spin" />
            <span>Conectando {officialEmail}...</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14-.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            </svg>
            <span className="truncate">Dar acceso a {officialEmail}</span>
          </>
        )}
      </button>

      <div className="flex items-center justify-between px-1">
        <button
          type="button"
          onClick={handleSignInAny}
          disabled={isLoggingIn}
          className="text-[10px] text-slate-500 hover:text-slate-800 underline underline-offset-2 cursor-pointer transition-colors"
        >
          Elegir otra cuenta de Google
        </button>
      </div>

      {loginError && (
        <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs space-y-1">
          <p className="font-bold flex items-center gap-1.5">
            <span>⚠️</span> {loginError.includes('popup-closed') ? 'Se cerró la ventana de Google antes de completar la autorización.' : loginError}
          </p>
        </div>
      )}

      {/* Guía de ayuda: Acceso Bloqueado */}
      <details className="mt-1 group rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-xs text-slate-700 open:bg-amber-50/70 open:border-amber-200 transition-colors">
        <summary className="font-bold text-slate-800 cursor-pointer select-none flex items-center justify-between text-[11px] list-none group-open:text-amber-900">
          <span className="flex items-center gap-1.5">
            <span className="text-amber-600 font-bold">ℹ️</span> ¿Te aparece "Acceso bloqueado" o "App no verificada"?
          </span>
          <span className="text-[10px] text-slate-400 group-open:text-amber-700">Ver solución ▾</span>
        </summary>
        <div className="mt-2.5 pt-2 border-t border-slate-200/80 space-y-2 text-[11px] leading-relaxed text-slate-600 group-open:text-slate-800">
          <p>
            <strong>¿Por qué ocurre?</strong> Google protege el envío de correos por Gmail y bloquea aplicaciones en desarrollo que están en <em>"Modo de prueba"</em> (Testing) si el correo no está registrado como <strong>Usuario de prueba</strong>.
          </p>

          <div className="rounded-lg bg-white p-2 border border-amber-200 space-y-1">
            <p className="font-bold text-amber-950 text-[11px]">👉 Opción 1 (Más rápida):</p>
            <p className="text-[10px]">
              Haz clic en <strong>"Elegir otra cuenta"</strong> e inicia con tu cuenta administradora de Google Cloud. En la pantalla de aviso, haz clic en <span className="font-semibold text-blue-700">"Configuración avanzada"</span> &gt; <span className="font-semibold text-blue-700">"Ir a la app (no seguro)"</span>.
            </p>
          </div>

          <div className="rounded-lg bg-white p-2 border border-slate-200 space-y-1">
            <p className="font-bold text-slate-900 text-[11px]">👉 Opción 2 (Para autorizar pasantiasdigitales@gmail.com):</p>
            <p className="text-[10px]">
              En Google Cloud Console (menú <em>Pantalla de consentimiento de OAuth</em>), ve a la sección <strong>"Usuarios de prueba"</strong> (Test Users), haz clic en <strong>"+ AGREGAR USUARIOS"</strong> e ingresa <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold text-blue-800">pasantiasdigitales@gmail.com</code>.
            </p>
          </div>
        </div>
      </details>
    </div>
  );
};
