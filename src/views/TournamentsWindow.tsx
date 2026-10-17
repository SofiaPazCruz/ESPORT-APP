import React, { useState } from 'react';
import { Tournament, Participant, CreateTournamentFormData } from '../types/tournament';
import { CreateTournamentModal } from '../components/CreateTournamentModal';
import { 
  Trophy, 
  Gamepad2, 
  PlusCircle, 
  Users, 
  Calendar, 
  Clock, 
  MapPin, 
  Sparkles, 
  ArrowRight,
  Search,
  CheckCircle2,
  Award,
  Lock,
  Crown
} from 'lucide-react';
import { isTournamentPassed } from '../utils/bracketGenerator';

interface TournamentsWindowProps {
  tournaments: Tournament[];
  participants: Participant[];
  onSelectTournamentForRegistration: (tournamentId: number) => void;
  onSelectTournamentForBrackets: (tournamentId: number) => void;
  onCreateTournament: (data: CreateTournamentFormData) => Tournament;
}

export const TournamentsWindow: React.FC<TournamentsWindowProps> = ({
  tournaments,
  participants,
  onSelectTournamentForRegistration,
  onSelectTournamentForBrackets,
  onCreateTournament,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGameFilter, setSelectedGameFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PASSED'>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Unique games list
  const uniqueGames = Array.from(new Set(tournaments.map(t => t.gameName)));

  const filteredTournaments = tournaments.filter(t => {
    const isPassed = isTournamentPassed(t) || t.status === 'COMPLETED';
    const matchesGame = selectedGameFilter === 'ALL' || t.gameName === selectedGameFilter;
    const matchesSearch = 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.gameName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.format.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.region.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = 
      statusFilter === 'ALL' 
        ? true 
        : statusFilter === 'PASSED' 
        ? isPassed 
        : !isPassed;

    return matchesGame && matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in text-slate-900">
      
      {/* WINDOW TITLE BANNER */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#f15a24]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#f15a24]">
              Catálogo Oficial
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-[#002f6c] mt-1 flex items-center gap-2.5">
            <Gamepad2 className="w-8 h-8 text-[#f15a24]" />
            <span>Torneos de Videojuegos</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 max-w-xl">
            Catálogo oficial de torneos de la Facultad de Ingeniería Tampico (UAT). Crea un torneo oficial para habilitar inscripciones y llaves de competencia.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-5 py-3 rounded-2xl bg-[#002f6c] hover:bg-[#002454] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer shrink-0"
        >
          <PlusCircle className="w-4 h-4 text-white" />
          <span>+ Agregar Nuevo Torneo</span>
        </button>
      </div>

      {tournaments.length === 0 ? (
        <div className="py-20 px-6 rounded-3xl border border-dashed border-slate-200 bg-white text-center space-y-5 shadow-sm">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#f15a24]">
            <Gamepad2 className="w-8 h-8 text-[#f15a24]" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Plataforma limpia para primer uso</span>
            </div>
            <h3 className="text-xl font-bold font-heading text-slate-900">
              No hay torneos registrados
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Todos los torneos simulados y datos anteriores han sido eliminados. La página está completamente en blanco, lista para registrar tu primer torneo oficial desde cero.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-6 py-3 rounded-2xl bg-[#002f6c] hover:bg-[#002454] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-white" />
              <span>+ Crear Primer Torneo</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* FILTERS & SEARCH BAR */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por juego o formato..."
                className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#002f6c]"
              />
            </div>

            {/* State and Game Filters */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Status filter pills */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    statusFilter === 'ALL' ? 'bg-white text-[#002f6c] shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Todos ({tournaments.length})
                </button>
                <button
                  onClick={() => setStatusFilter('ACTIVE')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                    statusFilter === 'ACTIVE' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Activos</span>
                </button>
                <button
                  onClick={() => setStatusFilter('PASSED')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                    statusFilter === 'PASSED' ? 'bg-white text-rose-700 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Lock className="w-2.5 h-2.5 text-rose-600" />
                  <span>Pasados / Cerrados</span>
                </button>
              </div>

              {/* Game filter dropdown/chips */}
              <div className="flex items-center gap-1 overflow-x-auto">
                {uniqueGames.map((game) => (
                  <button
                    key={game}
                    onClick={() => setSelectedGameFilter(selectedGameFilter === game ? 'ALL' : game)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                      selectedGameFilter === game
                        ? 'bg-[#002f6c] text-white shadow-2xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {game}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* TOURNAMENTS CARDS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTournaments.map((t) => {
              const registered = participants.filter(p => p.tournamentId === t.id).length;
              const isPassed = isTournamentPassed(t) || t.status === 'COMPLETED';
              const isFull = registered >= t.maxSlots;
              const slotsPercent = Math.min(100, (registered / t.maxSlots) * 100);

              return (
                <div
                  key={t.id}
                  className={`rounded-3xl border shadow-sm p-6 flex flex-col justify-between space-y-5 hover:shadow-md transition-all group ${
                    isPassed ? 'bg-slate-50/80 border-slate-300' : 'bg-white border-slate-200'
                  }`}
                >
                  {/* Header */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1.5">
                        <Gamepad2 className="w-3.5 h-3.5 text-[#ed1c24]" />
                        {t.gameName}
                      </span>
                      
                      {isPassed ? (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          <span>Cerrado (Ya Pasó)</span>
                        </span>
                      ) : (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isFull
                            ? 'bg-rose-100 text-rose-700 border border-rose-200'
                            : registered > 0
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          {isFull ? 'Cupo Lleno' : `${registered}/${t.maxSlots} lugares`}
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold font-heading text-slate-900 group-hover:text-[#002f6c] transition-colors leading-snug">
                      {t.name}
                    </h3>

                    <p className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{t.region}</span>
                    </p>

                    {/* Champion highlight for passed tournaments */}
                    {isPassed && t.championName && (
                      <div className="mt-3 p-2.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-amber-900 font-bold">
                          <Crown className="w-4 h-4 text-amber-600" />
                          <span>Campeón: {t.championName}</span>
                        </div>
                        <span className="text-[10px] uppercase font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md">
                          Trofeo FIT
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Specs & Slots */}
                  <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
                    {/* Slots Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                        <span>Ocupación de la Llave</span>
                        <span className="text-[#002f6c]">{registered} / {t.maxSlots} jugadores</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isPassed 
                              ? 'bg-slate-400' 
                              : 'bg-gradient-to-r from-[#002f6c] to-[#ed1c24]'
                          }`}
                          style={{ width: `${Math.max(4, slotsPercent)}%` }}
                        />
                      </div>
                    </div>

                    {/* Details list */}
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2.5 rounded-xl bg-white border border-slate-200/80">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Formato</span>
                        <span className="font-semibold text-slate-800 truncate block mt-0.5">{t.format}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white border border-slate-200/80">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Premio</span>
                        <span className="font-semibold text-[#002f6c] truncate block mt-0.5">{t.prizePool}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{t.startDate}</span>
                      {isPassed && <span className="font-bold text-rose-600">• Fecha Concluida</span>}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 flex flex-col sm:flex-row gap-2">
                    {isPassed ? (
                      <>
                        <button
                          type="button"
                          onClick={() => onSelectTournamentForBrackets(t.id)}
                          className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                          title="Ver las llaves completadas y resultados de este torneo"
                        >
                          <Lock className="w-3.5 h-3.5 text-amber-400" />
                          <span>Ver Llave Cerrada</span>
                        </button>
                        <span className="py-2.5 px-3 rounded-xl bg-slate-200 text-slate-500 text-xs font-semibold text-center border border-slate-300 flex items-center justify-center">
                          Finalizado
                        </span>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          disabled={isFull}
                          onClick={() => onSelectTournamentForRegistration(t.id)}
                          className="flex-1 py-2.5 px-3 rounded-xl bg-[#002f6c] hover:bg-[#002352] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <span>Inscribirse</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onSelectTournamentForBrackets(t.id)}
                          className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-[#002f6c] text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200"
                          title="Ver y simular las llaves de este torneo"
                        >
                          <Trophy className="w-3.5 h-3.5 text-[#ed1c24]" />
                          <span>Brackets</span>
                        </button>
                      </>
                    )}
                  </div>

                </div>
              );
            })}
          </div>

          {filteredTournaments.length === 0 && (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 space-y-2">
              <Gamepad2 className="w-10 h-10 mx-auto text-slate-300" />
              <h3 className="text-base font-bold text-slate-700">No se encontraron torneos</h3>
              <p className="text-xs text-slate-500">Intenta con otro término de búsqueda o filtro de videojuego.</p>
            </div>
          )}
        </>
      )}

      {/* Modal para Crear Nuevo Torneo */}
      <CreateTournamentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateTournament={(data) => {
          onCreateTournament(data);
          setIsCreateModalOpen(false);
        }}
      />

    </div>
  );
};
