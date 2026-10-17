import React, { useState } from 'react';
import { DATABASE_CODE } from '../../data/architectureCode';
import { CodeBlock } from '../CodeBlock';
import { Database, ShieldCheck, Key, FileText, CheckCircle2, Cpu } from 'lucide-react';

export const DatabaseTab: React.FC = () => {
  const [activeCodeTab, setActiveCodeTab] = useState<'tables' | 'sp'>('sp');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Intro Header */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-indigo-400 font-semibold">
              Paso 1: Persistencia Relacional y ACID
            </div>
            <h3 className="text-xl font-bold font-heading text-white">
              Diseño de Base de Datos en Microsoft SQL Server
            </h3>
          </div>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed">
          Para garantizar la máxima velocidad de registro y evitar el problema más temido en torneos de esports (la <strong className="text-white">condición de carrera por el último cupo</strong> y registros duplicados), el motor relacional implementa restricciones a nivel de esquema (DDL) y un procedimiento almacenado atómico con aislamiento <code className="text-indigo-300 font-mono">UPDLOCK, HOLDLOCK</code>.
        </p>

        {/* 3 Pillars badges */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold text-white block">Unicidad Contextual</span>
              <span className="text-[11px] text-slate-400">
                Índice único <code className="text-indigo-300">UQ(TorneoID, Gamertag)</code> para permitir el mismo alias en diferentes torneos sin colisión.
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5">
            <Cpu className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold text-white block">Control de Cupo Concurrente</span>
              <span className="text-[11px] text-slate-400">
                Bloqueo pesimista exclusivo dentro de la transacción. El contador nunca superará <code className="text-amber-300">CuposMaximos</code>.
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5">
            <Key className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold text-white block">Ticket Criptográfico y Seed</span>
              <span className="text-[11px] text-slate-400">
                Generación en una sola operación del código de Check-in (ej. <code className="text-cyan-300">VAL-101-A9F4</code>) y número de semilla.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Relational Schema Diagram */}
      <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl space-y-4">
        <h4 className="text-sm font-bold font-heading text-white flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-400" />
          Modelo Entidad-Relación (ERD) Normalizado
        </h4>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 font-mono text-xs">
          
          {/* Table 1: Juegos */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
            <div className="p-3 bg-slate-900 border-b border-slate-800 font-bold text-indigo-300 flex items-center justify-between">
              <span>dbo.Juegos</span>
              <span className="text-[10px] text-slate-500 font-normal">Catálogo</span>
            </div>
            <div className="p-3 space-y-1.5 text-slate-300">
              <div className="flex justify-between text-amber-400 font-semibold">
                <span>PK JuegoID</span>
                <span className="text-slate-500 text-[10px]">INT IDENTITY</span>
              </div>
              <div className="flex justify-between">
                <span>Nombre</span>
                <span className="text-slate-500 text-[10px]">NVARCHAR(100)</span>
              </div>
              <div className="flex justify-between text-cyan-400">
                <span>UQ Slug</span>
                <span className="text-slate-500 text-[10px]">VARCHAR(50)</span>
              </div>
              <div className="flex justify-between">
                <span>Genero</span>
                <span className="text-slate-500 text-[10px]">NVARCHAR(50)</span>
              </div>
              <div className="flex justify-between">
                <span>EsActivo</span>
                <span className="text-slate-500 text-[10px]">BIT (DF 1)</span>
              </div>
            </div>
          </div>

          {/* Table 2: Torneos */}
          <div className="rounded-xl border border-indigo-500/40 bg-slate-950 overflow-hidden ring-1 ring-indigo-500/30">
            <div className="p-3 bg-indigo-950/40 border-b border-indigo-500/30 font-bold text-white flex items-center justify-between">
              <span>dbo.Torneos</span>
              <span className="text-[10px] text-indigo-300 font-normal">Eventos & Cupos</span>
            </div>
            <div className="p-3 space-y-1.5 text-slate-300">
              <div className="flex justify-between text-amber-400 font-semibold">
                <span>PK TorneoID</span>
                <span className="text-slate-500 text-[10px]">INT IDENTITY</span>
              </div>
              <div className="flex justify-between text-indigo-300">
                <span>FK JuegoID</span>
                <span className="text-slate-500 text-[10px]">INT → Juegos</span>
              </div>
              <div className="flex justify-between">
                <span>Nombre</span>
                <span className="text-slate-500 text-[10px]">NVARCHAR(150)</span>
              </div>
              <div className="flex justify-between text-emerald-400 font-bold">
                <span>CuposMaximos</span>
                <span className="text-slate-500 text-[10px]">INT</span>
              </div>
              <div className="flex justify-between text-emerald-400 font-bold">
                <span>CuposActuales</span>
                <span className="text-slate-500 text-[10px]">INT (DF 0)</span>
              </div>
              <div className="flex justify-between">
                <span>Estado</span>
                <span className="text-slate-500 text-[10px]">VARCHAR(20)</span>
              </div>
            </div>
          </div>

          {/* Table 3: Participantes */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
            <div className="p-3 bg-slate-900 border-b border-slate-800 font-bold text-emerald-400 flex items-center justify-between">
              <span>dbo.Participantes</span>
              <span className="text-[10px] text-slate-500 font-normal">Inscripciones</span>
            </div>
            <div className="p-3 space-y-1.5 text-slate-300">
              <div className="flex justify-between text-amber-400 font-semibold">
                <span>PK ParticipanteID</span>
                <span className="text-slate-500 text-[10px]">BIGINT IDENTITY</span>
              </div>
              <div className="flex justify-between text-indigo-300">
                <span>FK TorneoID</span>
                <span className="text-slate-500 text-[10px]">INT → Torneos</span>
              </div>
              <div className="flex justify-between text-rose-300 font-bold">
                <span>UQ Gamertag</span>
                <span className="text-slate-500 text-[10px]">(TorneoID, Tag)</span>
              </div>
              <div className="flex justify-between text-rose-300 font-bold">
                <span>UQ Email</span>
                <span className="text-slate-500 text-[10px]">(TorneoID, Mail)</span>
              </div>
              <div className="flex justify-between text-cyan-300">
                <span>CodigoCheckIn</span>
                <span className="text-slate-500 text-[10px]">VARCHAR(20)</span>
              </div>
              <div className="flex justify-between">
                <span>NumeroSeed</span>
                <span className="text-slate-500 text-[10px]">INT</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Code Viewer Switcher */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveCodeTab('sp')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer ${
              activeCodeTab === 'sp'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            ⚡ Procedimiento Almacenado: sp_InsertarParticipante
          </button>
          <button
            onClick={() => setActiveCodeTab('tables')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer ${
              activeCodeTab === 'tables'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            🗄️ Script DDL: Tablas, Índices y Constraints
          </button>
        </div>

        {activeCodeTab === 'sp' ? (
          <CodeBlock
            code={DATABASE_CODE.storedProcedureSql}
            language="sql"
            filename="dbo.sp_InsertarParticipante.sql"
            description="Procedimiento almacenado en T-SQL con control de concurrencia UPDLOCK, bloqueo exclusivo, validación de cupos y retorno de códigos de estado."
          />
        ) : (
          <CodeBlock
            code={DATABASE_CODE.tablesSql}
            language="sql"
            filename="TorneosEsportsDB_DDL.sql"
            description="Script T-SQL completo para creación de tablas Juegos, Torneos y Participantes con claves foráneas, índices filtrados y constraints de integridad."
          />
        )}
      </div>

      {/* SP Return Codes Reference */}
      <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl space-y-3">
        <h4 className="text-sm font-bold font-heading text-white">
          Contrato de Códigos de Retorno del Stored Procedure (@CodigoEstado)
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 font-mono text-xs">
          <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/40">
            <span className="text-emerald-400 font-bold block">0: ÉXITO</span>
            <span className="text-slate-400 text-[11px]">Registro confirmado y seed asignado.</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-amber-500/40">
            <span className="text-amber-400 font-bold block">1: TORNEO LLENO</span>
            <span className="text-slate-400 text-[11px]">Sin cupos libres disponibles.</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-rose-500/40">
            <span className="text-rose-400 font-bold block">2: GAMERTAG REPETIDO</span>
            <span className="text-slate-400 text-[11px]">Ya registrado en este torneo.</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-rose-500/40">
            <span className="text-rose-400 font-bold block">3: CORREO DUPLICADO</span>
            <span className="text-slate-400 text-[11px]">El email ya tiene un registro.</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-700">
            <span className="text-slate-300 font-bold block">4 / 99: ERROR O CERRADO</span>
            <span className="text-slate-400 text-[11px]">Torneo no activo o excepción DB.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
