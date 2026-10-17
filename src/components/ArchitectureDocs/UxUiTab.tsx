import React from 'react';
import { UX_UI_ANALYSIS } from '../../data/uxUiGuidelines';
import { 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  HelpCircle, 
  Zap, 
  ShieldCheck, 
  Layers, 
  ArrowRight,
  Flame,
  Check,
  X
} from 'lucide-react';

export const UxUiTab: React.FC = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Intro Banner */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-semibold">
              Paso 4: UX/UI Estratégico & Análisis Arquitectónico
            </div>
            <h3 className="text-xl font-bold font-heading text-white">
              Diseño de Experiencia "Zero Friction" para Torneos de Videojuegos
            </h3>
          </div>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed">
          Para que el participante experimente un proceso <strong className="text-white">"fácil y rápido"</strong> según la Historia de Usuario, el diseño debe eliminar la barrera cognitiva inicial. La clave no es pedir menos información en total, sino <strong className="text-amber-400">pedirla en el momento adecuado</strong> mediante el principio de <em>Progressive Disclosure</em> (Divulgación Progresiva).
        </p>
      </div>

      {/* QUESTION 1: MINIMAL INDISPENSABLE FIELDS */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Clock className="w-5 h-5 text-indigo-400" />
          <h4 className="text-lg font-bold font-heading text-white">
            1. Campos Mínimos e Indispensables vs Fricción de Registro
          </h4>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Cada campo adicional en un formulario de torneos disminuye la tasa de conversión en un <strong>12% a 18%</strong>. En la comunidad gamer, obligar a ingresar nombre real, DNI o número telefónico en el primer clic genera desconfianza y abandono inmediato.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {UX_UI_ANALYSIS.indispensableFields.map((item, idx) => (
            <div key={idx} className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white font-mono">{item.field}</span>
                <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-semibold ${
                  item.priority.includes('#1') ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                  item.priority.includes('#2') || item.priority.includes('#3') ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                  'bg-slate-800 text-slate-400'
                }`}>
                  {item.priority}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{item.why}</p>
              <div className="pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-400">
                <span className="text-slate-500 block text-[10px] uppercase">Regla de Validación:</span>
                <span className="text-slate-300">{item.validationRule}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Progressive Disclosure Explanation */}
        <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-indigo-950/40 to-slate-900 border border-indigo-500/30 space-y-2">
          <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs uppercase font-mono tracking-wider">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>La Estrategia de Dos Fases (Progressive Disclosure)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300 pt-1">
            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
              <span className="text-emerald-400 font-bold font-mono block mb-1">
                Fase 1: Registro Inicial (Tiempo: ~18 segundos)
              </span>
              <p>
                Solo Gamertag + Correo + Torneo. El usuario asegura su lugar en la llave inmediatamente y recibe su código de confirmación.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
              <span className="text-indigo-400 font-bold font-mono block mb-1">
                Fase 2: Check-in Previo al Torneo (60 mins antes)
              </span>
              <p>
                El usuario ingresa su código único y confirma su Riot ID con #TAG o Discord para entrar al lobby de la partida.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* QUESTION 2: VISUAL FEEDBACK & MICROINTERACTIONS */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Flame className="w-5 h-5 text-rose-400" />
          <h4 className="text-lg font-bold font-heading text-white">
            2. Sugerencias de Feedback Visual, Estados de Carga y Errores
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {UX_UI_ANALYSIS.visualFeedbackGuidelines.map((group, idx) => (
            <div key={idx} className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 space-y-3">
              <h5 className="font-bold text-sm text-white font-mono flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                {group.phase}
              </h5>
              <ul className="space-y-2 text-xs text-slate-300">
                {group.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* COMPARATIVE ANALYSIS: YOUR PROPOSITION (React + Firebase + Formik) vs Solicitado (Angular + Express + SQL Server) */}
      <div className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-6 space-y-5">
        <div className="flex items-center gap-3 border-b border-purple-500/30 pb-3">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase text-purple-400 font-bold tracking-widest">
              Análisis de la Propuesta Final
            </span>
            <h4 className="text-lg font-bold font-heading text-white">
              React + Firebase + Formik vs Angular Signals + Express + SQL Server
            </h4>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          En tu prompt propusiste: <em className="text-purple-300 font-mono">"Propongo una arquitectura basada en React con autenticación Firebase y validación con Formik"</em>. Como Arquitecto de Software Senior, evaluamos ambas alternativas para que tu equipo tome la decisión más acertada según los objetivos de negocio:
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
          
          {/* Option A */}
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-950 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white font-mono">
                Opción A: Angular Signals + Node.js + SQL Server
              </span>
              <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[10px] font-mono">
                Stack Empresarial
              </span>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-bold text-emerald-400 uppercase font-mono block">Ventajas Clave:</span>
              <ul className="space-y-1.5 text-slate-300">
                <li className="flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Garantía Transaccional ACID:</strong> SQL Server asegura que jamás haya sobrecupo con bloqueos UPDLOCK nativos.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Independencia Tecnológica:</strong> Despliegue en cualquier servidor propio o contenedor Docker sin vendor lock-in.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Angular Signals:</strong> Reactividad de grano fino sin re-renderizados innecesarios del DOM.</span>
                </li>
              </ul>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <span className="text-[11px] font-bold text-amber-400 uppercase font-mono block">Desventaja:</span>
              <p className="text-slate-400 text-[11px]">
                Mayor tiempo de configuración inicial (servidor Express, pool de conexiones MSSQL, migraciones).
              </p>
            </div>
          </div>

          {/* Option B */}
          <div className="p-5 rounded-xl border border-purple-500/40 bg-slate-950 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white font-mono">
                Opción B: React + Firebase + Formik (Tu Propuesta)
              </span>
              <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-mono">
                Velocidad MVP
              </span>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-bold text-emerald-400 uppercase font-mono block">Ventajas Clave:</span>
              <ul className="space-y-1.5 text-slate-300">
                <li className="flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Time to Market Récord:</strong> Sin necesidad de backend tradicional; Firestore maneja persistencia directamente.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Tiempo Real Nativo:</strong> Los cupos se actualizan en pantalla en milisegundos mediante <code className="text-purple-300 font-mono">onSnapshot()</code>.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Social Auth en 1 Clic:</strong> Permite ingresar con Discord / Google / Twitch sin formulario manual.</span>
                </li>
              </ul>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <span className="text-[11px] font-bold text-amber-400 uppercase font-mono block">Consideración Técnica:</span>
              <p className="text-slate-400 text-[11px]">
                Para evitar sobrecupo en Firestore, es obligatorio usar <code className="text-indigo-300 font-mono">runTransaction()</code> para verificar cupos atómicamente antes de escribir.
              </p>
            </div>
          </div>

        </div>

        {/* Verdict */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3 text-xs text-slate-300">
          <div className="p-2 rounded-lg bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <strong className="text-white block font-mono text-sm">Veredicto del Arquitecto:</strong>
            <p className="mt-1 leading-relaxed">
              Si tu prioridad en este Sprint 1 es validar la idea de negocio rápidamente con usuarios reales o torneos de Discord comunitarios, <strong>React + Firebase</strong> es una excelente opción rápida. Sin embargo, para torneos con <strong>premios monetarios, miles de participantes concurrentes o auditoría legal estricta</strong>, la arquitectura <strong className="text-white">SQL Server + Node.js/C#</strong> es el estándar por su consistencia transaccional y bajo costo por transacción.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
