import React, { useState } from 'react';
import { ANGULAR_CODE } from '../../data/architectureCode';
import { CodeBlock } from '../CodeBlock';
import { Radio, Zap, Sparkles, Code2, Layout, CheckCircle2 } from 'lucide-react';

export const AngularTab: React.FC = () => {
  const [activeFile, setActiveFile] = useState<'component' | 'template'>('component');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Intro Header */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-400">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-rose-400 font-semibold">
              Paso 3: Frontend en Angular 17/18+ con Signals
            </div>
            <h3 className="text-xl font-bold font-heading text-white">
              Componente Standalone Reactivo y Tailwind CSS Gaming Theme
            </h3>
          </div>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed">
          En lugar de utilizar formularios complejos tradicionales o depender de ciclos de Change Detection Zone.js pesados, esta solución aprovecha la potencia de <strong className="text-white">Angular Signals</strong> (<code className="text-rose-300 font-mono">signal()</code>, <code className="text-rose-300 font-mono">computed()</code>) junto con el nuevo <strong className="text-white">Control Flow</strong> (<code className="text-indigo-300 font-mono">@if</code>, <code className="text-indigo-300 font-mono">@for</code>).
        </p>

        {/* Benefits of Signals */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-rose-400 font-mono font-bold text-xs flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>computed() Instantáneo</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Valida el Gamertag, correo y cupos disponibles de forma reactiva sin re-renderizar todo el árbol de componentes.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-indigo-400 font-mono font-bold text-xs flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tailwind Esports Theme</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Diseño oscuro con acentos neón, microinteracciones en inputs, chips interactivos y pase gamer digital para feedback instantáneo.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-emerald-400 font-mono font-bold text-xs flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Zero-Boilerplate Standalone</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Sin módulos auxiliares (NgModules). Inyección directa con <code className="text-emerald-300 font-mono">inject(HttpClient)</code>.
            </p>
          </div>
        </div>
      </div>

      {/* Code Switcher */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveFile('component')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeFile === 'component'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>participant-registration.component.ts (Lógica TypeScript & Signals)</span>
          </button>

          <button
            onClick={() => setActiveFile('template')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeFile === 'template'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Layout className="w-4 h-4" />
            <span>participant-registration.component.html (Plantilla con Tailwind)</span>
          </button>
        </div>

        {activeFile === 'component' ? (
          <CodeBlock
            code={ANGULAR_CODE.componentTs}
            language="typescript"
            filename="src/app/components/participant-registration/participant-registration.component.ts"
            description="Componente Standalone en Angular 17/18+ con Signals (signal, computed), inyección de HttpClient y gestión de estados de error/éxito."
          />
        ) : (
          <CodeBlock
            code={ANGULAR_CODE.componentHtml}
            language="html"
            filename="src/app/components/participant-registration/participant-registration.component.html"
            description="Plantilla moderna utilizando el nuevo Control Flow (@if / @for) de Angular y clases de Tailwind CSS para temática esports y gaming."
          />
        )}
      </div>

      {/* Signals Architecture explanation */}
      <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl space-y-3 text-xs text-slate-300">
        <h4 className="font-bold text-white font-mono text-sm">
          ¿Por qué Signals es la mejor opción para este módulo en Angular?
        </h4>
        <p className="leading-relaxed">
          En formularios de registro ultrarrápido donde el usuario escribe a alta velocidad, los signals derivados como <code className="text-rose-300 font-mono">canSubmit = computed(...)</code> se evalúan de forma perezosa (lazy evaluation) y memorizada (memoized). Si el usuario cambia de plataforma pero su gamertag y correo siguen intactos, no se revalida la lógica pesada, permitiendo mantener la interfaz en <strong className="text-white">60 a 120 FPS</strong> sin tartamudeos (jank).
        </p>
      </div>
    </div>
  );
};
