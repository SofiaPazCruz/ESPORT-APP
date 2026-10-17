import React, { useState } from 'react';
import { BACKEND_CODE } from '../../data/architectureCode';
import { CodeBlock } from '../CodeBlock';
import { Server, CheckCircle2, AlertTriangle, Shield, Layers, ArrowRight } from 'lucide-react';

export const BackendTab: React.FC = () => {
  const [activeFile, setActiveFile] = useState<'controller' | 'validator' | 'service' | 'routes'>('controller');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Intro Header */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-400">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-purple-400 font-semibold">
              Paso 2: API REST en Node.js + Express (TypeScript)
            </div>
            <h3 className="text-xl font-bold font-heading text-white">
              Arquitectura del Backend y Validación Defensiva
            </h3>
          </div>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed">
          La API implementa el patrón <strong className="text-white">Controller - Service - Repository</strong> para aislar la lógica HTTP, la validación de esquemas (Zod) y la ejecución del Stored Procedure en SQL Server. Mapea fielmente los códigos de error del negocio a códigos HTTP REST semánticos.
        </p>

        {/* HTTP status codes breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/40 font-mono text-xs">
            <div className="text-emerald-400 font-bold flex items-center gap-1.5">
              <span>201 Created</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-sans">
              Registro completado. Retorna el objeto participante con <code className="text-indigo-300 font-mono">seedNumber</code> y <code className="text-emerald-300 font-mono">checkInCode</code>.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-amber-500/40 font-mono text-xs">
            <div className="text-amber-400 font-bold flex items-center gap-1.5">
              <span>400 Bad Request</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-sans">
              Validación Zod fallida (ej. Gamertag con caracteres inválidos, correo mal formado o menos de 3 letras).
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-rose-500/40 font-mono text-xs">
            <div className="text-rose-400 font-bold flex items-center gap-1.5">
              <span>409 Conflict</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-sans">
              Gamertag o Email duplicado en el mismo torneo. Envía <code className="text-rose-300 font-mono">field: "gamertag"</code> para resaltar el input exacto.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-purple-500/40 font-mono text-xs">
            <div className="text-purple-400 font-bold flex items-center gap-1.5">
              <span>422 Unprocessable</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-sans">
              Torneo lleno o cerrado. El servidor procesó la petición pero la regla de negocio impidió la inserción.
            </p>
          </div>
        </div>
      </div>

      {/* File Selector Tabs */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveFile('controller')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer ${
              activeFile === 'controller'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            🎮 participant.controller.ts (Lógica HTTP & Mapeo)
          </button>

          <button
            onClick={() => setActiveFile('validator')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer ${
              activeFile === 'validator'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            🛡️ participant.validator.ts (Esquema Zod)
          </button>

          <button
            onClick={() => setActiveFile('service')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer ${
              activeFile === 'service'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            ⚡ participant.service.ts (Ejecución MSSQL)
          </button>

          <button
            onClick={() => setActiveFile('routes')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer ${
              activeFile === 'routes'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            🛣️ participant.routes.ts (Endpoints REST)
          </button>
        </div>

        {activeFile === 'controller' && (
          <CodeBlock
            code={BACKEND_CODE.controllerTs}
            language="typescript"
            filename="src/controllers/participant.controller.ts"
            description="Controlador Express con endpoints POST /participants y GET /check-gamertag (para comprobación con debounce en frontend)."
          />
        )}

        {activeFile === 'validator' && (
          <CodeBlock
            code={BACKEND_CODE.validatorTs}
            language="typescript"
            filename="src/validators/participant.validator.ts"
            description="Validación defensiva con Zod: límites de longitud, sanitización trim, regex estricto de gamertag y aceptación obligatoria de reglas."
          />
        )}

        {activeFile === 'service' && (
          <CodeBlock
            code={BACKEND_CODE.serviceTs}
            language="typescript"
            filename="src/services/participant.service.ts"
            description="Capa de servicio que invoca el Stored Procedure dbo.sp_InsertarParticipante en SQL Server pasando parámetros tipados y leyendo outputs."
          />
        )}

        {activeFile === 'routes' && (
          <CodeBlock
            code={BACKEND_CODE.routesTs}
            language="typescript"
            filename="src/routes/participant.routes.ts"
            description="Definición de rutas Express montando los endpoints RESTful en la versión 1 de la API."
          />
        )}
      </div>

      {/* Alternative Backend Note */}
      <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl space-y-2 text-xs text-slate-300">
        <h5 className="font-bold text-white font-mono flex items-center gap-1.5">
          <span>💡</span>
          <span>¿Considerando C# .NET o Spring Boot para el Backend?</span>
        </h5>
        <p className="leading-relaxed">
          Gracias a que la lógica transaccional y de concurrencia está encapsulada en el Stored Procedure <code className="text-indigo-300 font-mono">sp_InsertarParticipante</code> en SQL Server, migrar de Node.js a <strong>ASP.NET Core (.NET 8/9 Minimal API)</strong> o <strong>Spring Boot (Java)</strong> es trivial: solo se requiere invocar el SP con Dapper o Entity Framework Core (<code className="text-indigo-300 font-mono">context.Database.SqlQueryRaw</code>) sin tener que reescribir la lógica de bloqueos en código C#/Java.
        </p>
      </div>
    </div>
  );
};
