import React, { useState } from 'react';
import { Tournament, CreateTournamentFormData } from '../types/tournament';
import { BRAND_ASSETS } from '../data/universityBrand';
import { 
  Trophy, 
  X, 
  Gamepad2, 
  Users, 
  Calendar, 
  Globe2, 
  School, 
  PlusCircle, 
  Award, 
  Layers, 
  Clock 
} from 'lucide-react';

interface CreateTournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTournament: (formData: CreateTournamentFormData) => void;
}

const POPULAR_GAMES = [
  { id: 'valorant', name: 'Valorant', genre: 'Shooter 5v5' },
  { id: 'lol', name: 'League of Legends', genre: 'MOBA 5v5' },
  { id: 'smash', name: 'Super Smash Bros. Ultimate', genre: 'Peleas 1v1' },
  { id: 'sf6', name: 'Street Fighter 6', genre: 'Peleas 1v1' },
  { id: 'rl', name: 'Rocket League', genre: 'Fútbol con Autos 3v3' },
  { id: 'eafc', name: 'EA Sports FC 24', genre: 'Fútbol 1v1' },
  { id: 'cs2', name: 'Counter-Strike 2', genre: 'Shooter 5v5' },
  { id: 'custom', name: 'Otro Videojuego...', genre: 'Personalizado' },
];

const POPULAR_FORMATS = [
  '1v1 Doble Eliminación FT3 (Intercarreras FIT)',
  '1v1 Eliminación Directa',
  '5v5 Bracket Clásico',
  '5v5 Sistema Suizo + Finales',
  '3v3 Torneo Abierto Crossplay',
  'Fase de Grupos + Llave Final',
];

const SLOT_PRESETS = [8, 16, 32, 64, 128];

export const CreateTournamentModal: React.FC<CreateTournamentModalProps> = ({
  isOpen,
  onClose,
  onCreateTournament,
}) => {
  const [selectedGameId, setSelectedGameId] = useState<string>('valorant');
  const [customGameName, setCustomGameName] = useState<string>('');
  const [tournamentName, setTournamentName] = useState<string>('');
  const [format, setFormat] = useState<string>(POPULAR_FORMATS[0]);
  const [customFormat, setCustomFormat] = useState<string>('');
  const [maxSlots, setMaxSlots] = useState<number>(32);
  const [prizePool, setPrizePool] = useState<string>('Trofeo Castor Dorado + Reconocimiento FIT UAT');
  const [region, setRegion] = useState<string>('Facultad de Ingeniería Tampico (UAT)');
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 16);
  });
  const [platformRequired, setPlatformRequired] = useState<string>('Crossplay (Todas las plataformas)');
  const [rulesSummary, setRulesSummary] = useState<string>('Inscripción abierta a estudiantes de la Facultad de Ingeniería Tampico y UAT. Puntualidad en los horarios de partida.');
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const gameName = selectedGameId === 'custom' 
      ? customGameName.trim() 
      : POPULAR_GAMES.find(g => g.id === selectedGameId)?.name || 'Videojuego';

    if (!tournamentName.trim()) {
      setFormError('Por favor ingresa un nombre para el torneo de videojuegos.');
      return;
    }

    if (selectedGameId === 'custom' && !customGameName.trim()) {
      setFormError('Por favor especifica el nombre del videojuego.');
      return;
    }

    if (maxSlots < 2 || maxSlots > 512) {
      setFormError('El cupo de participantes debe estar entre 2 y 512.');
      return;
    }

    const finalFormat = format === 'custom' ? customFormat.trim() || 'Formato Libre' : format;

    onCreateTournament({
      name: tournamentName.trim(),
      gameId: selectedGameId,
      gameName,
      format: finalFormat,
      maxSlots,
      prizePool: prizePool.trim() || 'Trofeo Institucional FIT',
      region: region.trim() || 'Facultad de Ingeniería Tampico',
      startDate: startDate.replace('T', ' '),
      platformRequired,
      rulesSummary
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in text-slate-900">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        
        {/* Header on White */}
        <div className="relative p-6 bg-slate-50 border-b border-slate-200 shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <Gamepad2 className="w-6 h-6 text-[#f15a24]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-red-50 text-[#ed1c24] border border-red-200">
                  ESPORTS • FIT UAT
                </span>
                <span className="text-xs text-slate-500 font-medium">Gestor de Torneos</span>
              </div>
              <h3 className="text-xl font-bold font-heading text-[#002f6c] mt-0.5">
                Crear Nuevo Torneo de Videojuegos
              </h3>
            </div>
          </div>
        </div>

        {/* Scrollable Form Body on White */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          
          {/* 1. SELECT GAME */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 font-semibold mb-2">
              1. Videojuego
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {POPULAR_GAMES.map((game) => (
                <button
                  key={game.id}
                  type="button"
                  onClick={() => setSelectedGameId(game.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedGameId === game.id
                      ? 'border-[#f15a24] bg-orange-50/60 ring-2 ring-[#f15a24]/30'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <p className="font-semibold text-xs text-slate-900 truncate">{game.name}</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">{game.genre}</p>
                </button>
              ))}
            </div>

            {selectedGameId === 'custom' && (
              <div className="mt-3">
                <input
                  type="text"
                  value={customGameName}
                  onChange={(e) => setCustomGameName(e.target.value)}
                  placeholder="Escribe el nombre del juego (ej. Mario Kart, Brawlhalla...)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 text-xs font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#002f6c]"
                />
              </div>
            )}
          </div>

          {/* 2. TOURNAMENT NAME */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 font-semibold mb-1.5">
              2. Nombre del Torneo <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={tournamentName}
              onChange={(e) => setTournamentName(e.target.value)}
              placeholder="Ej. Copa Intercarreras FIT Valorant 2026"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#002f6c]/30"
            />
          </div>

          {/* 3. FORMAT & SLOTS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 font-semibold mb-1.5">
                3. Formato del Torneo
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#002f6c]/30"
              >
                {POPULAR_FORMATS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-mono uppercase tracking-wider text-slate-700 font-semibold">
                  4. Capacidad Máxima (Jugadores)
                </label>
                <div className="flex gap-1">
                  {SLOT_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setMaxSlots(preset)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono cursor-pointer ${
                        maxSlots === preset
                          ? 'bg-[#002f6c] text-white font-bold'
                          : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="number"
                min={2}
                max={512}
                value={maxSlots}
                onChange={(e) => setMaxSlots(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#002f6c]/30"
              />
            </div>
          </div>

          {/* 4. PRIZE & REGION */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 font-semibold mb-1.5">
                Premio o Reconocimiento
              </label>
              <input
                type="text"
                value={prizePool}
                onChange={(e) => setPrizePool(e.target.value)}
                placeholder="Ej. Trofeo Castor Dorado + Reconocimiento FIT"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#002f6c]/30"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 font-semibold mb-1.5">
                Sede o Modalidad
              </label>
              <input
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="Facultad de Ingeniería Tampico"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#002f6c]/30"
              />
            </div>
          </div>

          {/* 5. START DATE */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 font-semibold mb-1.5">
              Fecha y Hora de Inicio
            </label>
            <input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#002f6c]/30"
            />
          </div>

          {/* ERROR ALERT */}
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-mono">
              {formError}
            </div>
          )}

          {/* ACTIONS */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-mono text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#002f6c] hover:bg-[#002352] text-white font-bold font-mono text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Publicar Torneo</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
