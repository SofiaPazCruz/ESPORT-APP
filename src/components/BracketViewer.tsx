import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Tournament, Participant } from '../types/tournament';
import { TournamentBracket, BracketMatch, BracketPlayer } from '../types/bracket';
import { 
  generateAutomaticBracket, 
  advanceMatchWinner, 
  advanceNextRound,
  simulateEntireBracket,
  generatePrecompletedBracket,
  isTournamentPassed,
  getBracketProgress 
} from '../utils/bracketGenerator';
import { 
  Trophy, 
  Gamepad2, 
  RotateCcw, 
  Sparkles, 
  CheckCircle2, 
  Crown, 
  Lock, 
  Unlock, 
  FastForward, 
  Clock, 
  Calendar, 
  AlertCircle,
  Award,
  Layers,
  Check,
  Flame,
  ArrowRight,
  X,
  HelpCircle,
  ShieldAlert
} from 'lucide-react';

interface WinnerConfirmationData {
  match: BracketMatch;
  winner: BracketPlayer;
  opponent: BracketPlayer | null;
  roundName: string;
}

interface ActionConfirmationData {
  title: string;
  message: string;
  confirmLabel: string;
  variant?: 'danger' | 'primary' | 'warning';
  action: () => void;
}

interface BracketViewerProps {
  tournaments: Tournament[];
  participants: Participant[];
  selectedTournamentId?: number;
  onSelectTournament?: (id: number) => void;
  brackets?: Record<number, TournamentBracket>;
  onUpdateBracket?: (tournamentId: number, bracket: TournamentBracket) => void;
  onUpdateTournamentStatus?: (
    tournamentId: number, 
    status: Tournament['status'], 
    championName?: string, 
    runnerUpName?: string
  ) => void;
  onGoToTournaments?: () => void;
}

export const BracketViewer: React.FC<BracketViewerProps> = ({
  tournaments,
  participants,
  selectedTournamentId,
  onSelectTournament,
  brackets = {},
  onUpdateBracket,
  onUpdateTournamentStatus,
  onGoToTournaments,
}) => {
  const [currentTourneyId, setCurrentTourneyId] = useState<number>(
    selectedTournamentId || tournaments[0]?.id || 0
  );
  const tourneyParticipants = participants.filter(p => p.tournamentId === currentTourneyId);
  const autoSize = tourneyParticipants.length <= 2 && tourneyParticipants.length > 0 ? 2 : tourneyParticipants.length <= 4 ? 4 : 8;
  const [bracketSize, setBracketSize] = useState<number>(autoSize);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PASSED' | 'IN_PROGRESS' | 'OPEN'>('ALL');
  const [isUnlockedForEditing, setIsUnlockedForEditing] = useState<boolean>(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Winner confirmation modal state (Required per user request: confirm before updating bracket)
  const [winnerConfirmData, setWinnerConfirmData] = useState<WinnerConfirmationData | null>(null);
  const [scoreWinner, setScoreWinner] = useState<number>(2);
  const [scoreOpponent, setScoreOpponent] = useState<number>(0);

  // Generic action confirmation modal (for Advance Round, Simulate, Regenerate, Close)
  const [actionConfirmData, setActionConfirmData] = useState<ActionConfirmationData | null>(null);

  // Fallback local brackets state if not managed by parent
  const [localBrackets, setLocalBrackets] = useState<Record<number, TournamentBracket>>(brackets);

  const activeBracketsMap = { ...localBrackets, ...brackets };

  const selectedTourney = tournaments.find(t => t.id === currentTourneyId) || tournaments[0];
  const isPassed = selectedTourney ? isTournamentPassed(selectedTourney) : false;

  // Sync currentTourneyId when selectedTournamentId prop changes
  useEffect(() => {
    if (selectedTournamentId && selectedTournamentId !== currentTourneyId) {
      setCurrentTourneyId(selectedTournamentId);
    }
  }, [selectedTournamentId]);

  // Current bracket for this tournament
  const currentBracket: TournamentBracket | null = activeBracketsMap[currentTourneyId] || null;

  // Synchronize bracket when tournament changes or when participants change (ensures Player 1 and Player 2 are immediately visible!)
  useEffect(() => {
    if (!selectedTourney) return;

    const existingBracket = activeBracketsMap[selectedTourney.id];
    let needsUpdate = false;

    if (!existingBracket) {
      needsUpdate = true;
    } else if (existingBracket.status === 'OPEN') {
      // Find all real player IDs currently inside the bracket
      const presentRealPlayerIds = (existingBracket.rounds[0]?.matches || [])
        .flatMap(m => [m.player1, m.player2])
        .filter(p => p && !p.isBye && !String(p.id).startsWith('mock-'))
        .map(p => p!.id);

      const actualIds = tourneyParticipants.map(p => p.id);
      
      // If the number of real players doesn't match or any registered participant is missing, refresh!
      if (presentRealPlayerIds.length !== actualIds.length) {
        needsUpdate = true;
      } else {
        const setPresent = new Set(presentRealPlayerIds);
        if (actualIds.some(id => !setPresent.has(id))) {
          needsUpdate = true;
        }
      }
    }

    if (needsUpdate) {
      const preferred = existingBracket?.bracketSize || (tourneyParticipants.length <= 2 && tourneyParticipants.length > 0 ? 2 : tourneyParticipants.length <= 4 ? 4 : bracketSize);
      const initialBracket = generateAutomaticBracket(
        selectedTourney,
        tourneyParticipants,
        preferred,
        false
      );
      updateBracketState(selectedTourney.id, initialBracket);
    }
  }, [currentTourneyId, selectedTourney?.id, tourneyParticipants, bracketSize]);

  // Helper to persist bracket updates
  const updateBracketState = (tId: number, newBracket: TournamentBracket) => {
    setLocalBrackets(prev => ({ ...prev, [tId]: newBracket }));
    if (onUpdateBracket) {
      onUpdateBracket(tId, newBracket);
    }

    // If bracket has crowned a champion, notify parent to update tournament status
    if (newBracket.champion && onUpdateTournamentStatus) {
      onUpdateTournamentStatus(
        tId,
        'COMPLETED',
        newBracket.champion.gamertag,
        newBracket.runnerUp?.gamertag
      );
    } else if (newBracket.status === 'IN_PROGRESS' && onUpdateTournamentStatus && selectedTourney?.status !== 'IN_PROGRESS') {
      onUpdateTournamentStatus(tId, 'IN_PROGRESS');
    }
  };

  // Trigger celebration confetti when champion is crowned
  useEffect(() => {
    if (currentBracket?.champion) {
      try {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#002f6c', '#ed1c24', '#f15a24', '#10b981', '#f59e0b'],
        });
      } catch {
        // ignore
      }
    }
  }, [currentBracket?.champion?.id]);

  const handleTournamentChange = (tId: number) => {
    setCurrentTourneyId(tId);
    setIsUnlockedForEditing(false);
    if (onSelectTournament) onSelectTournament(tId);
  };

  const handleRegenerate = () => {
    if (!selectedTourney) return;

    const fresh = generateAutomaticBracket(
      selectedTourney,
      tourneyParticipants,
      bracketSize,
      false
    );
    updateBracketState(selectedTourney.id, fresh);
    setIsUnlockedForEditing(false);
    showNotice('Llaves regeneradas con los jugadores inscritos.');
  };

  const requestRegenerate = () => {
    if (!selectedTourney) return;
    setActionConfirmData({
      title: 'Confirmar Reinicio de Llaves',
      message: '¿Estás seguro de reiniciar las llaves de este torneo? Los resultados registrados en la llave volverán a la primera ronda con los jugadores inscritos.',
      confirmLabel: 'Sí, Reiniciar',
      variant: 'danger',
      action: () => {
        handleRegenerate();
        setActionConfirmData(null);
      }
    });
  };

  // Click on a player initiates the Winner Confirmation modal
  const handlePlayerClick = (match: BracketMatch, player: BracketPlayer | null) => {
    if (!currentBracket || !player || player.isBye) return;
    if (!match.player1 || !match.player2) return;

    // If tournament is closed and user hasn't explicitly unlocked editing, prevent accidental modifications
    if (currentBracket.status === 'COMPLETED' && !isUnlockedForEditing) {
      showNotice('La llave de este torneo ya está concluida y cerrada. Usa "Reabrir Llave" si necesitas hacer correcciones.');
      return;
    }

    const opponent = match.player1.id === player.id ? match.player2 : match.player1;
    setWinnerConfirmData({
      match,
      winner: player,
      opponent: opponent && !opponent.isBye ? opponent : null,
      roundName: match.roundName || 'Esta Ronda',
    });
    setScoreWinner(2);
    setScoreOpponent(0);
  };

  // Called when admin approves winner confirmation modal
  const handleConfirmWinner = () => {
    if (!winnerConfirmData || !currentBracket) return;
    const { match, winner } = winnerConfirmData;

    const isPlayer1Winner = match.player1?.id === winner.id;
    const customScore1 = isPlayer1Winner ? scoreWinner : scoreOpponent;
    const customScore2 = isPlayer1Winner ? scoreOpponent : scoreWinner;

    const updated = advanceMatchWinner(
      currentBracket,
      match.id,
      winner.id,
      customScore1,
      customScore2
    );
    updateBracketState(currentTourneyId, updated);
    setWinnerConfirmData(null);

    if (updated.champion) {
      showNotice(`¡${updated.champion.gamertag} se ha coronado Campeón! La llave ha sido cerrada exitosamente.`);
    } else {
      showNotice(`Victoria confirmada para ${winner.gamertag}. Ha avanzado a la siguiente ronda.`);
    }
  };

  const handleAdvanceNextRound = () => {
    if (!currentBracket) return;

    const updated = advanceNextRound(currentBracket);
    updateBracketState(currentTourneyId, updated);
    
    if (updated.champion) {
      showNotice(`¡Torneo concluido! ${updated.champion.gamertag} ganó la Gran Final y se cerró la llave.`);
    } else {
      showNotice('Ronda completada: los ganadores han avanzado y los encuentros han quedado cerrados.');
    }
  };

  const requestAdvanceNextRound = () => {
    if (!currentBracket) return;
    setActionConfirmData({
      title: 'Confirmar Avance de Ronda',
      message: '¿Estás seguro de avanzar todas las partidas listas de esta ronda? Se declararán ganadores de forma automática según el sembrado competitivo.',
      confirmLabel: 'Sí, Avanzar Ronda',
      variant: 'primary',
      action: () => {
        handleAdvanceNextRound();
        setActionConfirmData(null);
      }
    });
  };

  const handleSimulateAll = () => {
    if (!currentBracket) return;
    const simulated = simulateEntireBracket(currentBracket);
    updateBracketState(currentTourneyId, simulated);
    showNotice(`Torneo simulado y concluido al 100%. Campeón: ${simulated.champion?.gamertag}.`);
  };

  const requestSimulateAll = () => {
    if (!currentBracket) return;
    setActionConfirmData({
      title: 'Confirmar Simulación y Cierre',
      message: '¿Estás seguro de simular todos los encuentros restantes? Se completarán todas las partidas y se proclamará al campeón oficial del torneo.',
      confirmLabel: 'Sí, Simular y Cerrar',
      variant: 'warning',
      action: () => {
        handleSimulateAll();
        setActionConfirmData(null);
      }
    });
  };

  const handleCloseTournamentManually = () => {
    if (!currentBracket) return;

    const closed = currentBracket.champion 
      ? { ...currentBracket, status: 'COMPLETED' as const, completedAt: new Date().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }) }
      : simulateEntireBracket(currentBracket);

    updateBracketState(currentTourneyId, closed);
    setIsUnlockedForEditing(false);
    showNotice('Torneo cerrado y sellado con resultados oficiales.');
  };

  const requestCloseTournamentManually = () => {
    if (!currentBracket) return;
    setActionConfirmData({
      title: 'Confirmar Cierre de Torneo',
      message: '¿Deseas cerrar oficialmente este torneo y sellar los resultados?',
      confirmLabel: 'Sí, Cerrar Torneo',
      variant: 'primary',
      action: () => {
        handleCloseTournamentManually();
        setActionConfirmData(null);
      }
    });
  };

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => {
      setActionNotice(null);
    }, 4500);
  };

  // Compute bracket progress
  const progress = currentBracket ? getBracketProgress(currentBracket) : null;
  const isBracketClosed = currentBracket?.status === 'COMPLETED' || isPassed;

  // Filter tournaments list
  const filteredTournaments = useMemo(() => {
    return tournaments.filter(t => {
      const tourneyPassed = isTournamentPassed(t) || t.status === 'COMPLETED';
      const bracket = activeBracketsMap[t.id];
      const isBracketDone = bracket?.status === 'COMPLETED';

      if (statusFilter === 'PASSED') {
        return tourneyPassed || isBracketDone;
      }
      if (statusFilter === 'IN_PROGRESS') {
        return (t.status === 'IN_PROGRESS' || bracket?.status === 'IN_PROGRESS') && !tourneyPassed && !isBracketDone;
      }
      if (statusFilter === 'OPEN') {
        return !tourneyPassed && !isBracketDone && (t.status === 'OPEN' || !bracket || bracket.status === 'OPEN');
      }
      return true;
    });
  }, [tournaments, activeBracketsMap, statusFilter]);

  return (
    <section id="brackets" className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
      
      {/* SECTION HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ed1c24]" />
            <span className="text-xs uppercase font-bold tracking-wider text-[#ed1c24]">
              Gestión Oficial de Brackets
            </span>
          </div>
          <h2 className="text-2xl font-extrabold font-heading text-[#002f6c] mt-0.5 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-[#f15a24]" />
            <span>Generador y Avance de Brackets</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Con cada partida ganada los brackets avanzan automáticamente y se cierran al finalizar el torneo.
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Advance Round Button */}
          <button
            type="button"
            onClick={requestAdvanceNextRound}
            disabled={isBracketClosed && !isUnlockedForEditing}
            className="px-3.5 py-2 rounded-xl bg-[#002f6c] hover:bg-[#002352] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Avanzar y cerrar todas las partidas de la ronda actual previa confirmación"
          >
            <FastForward className="w-4 h-4 text-orange-300" />
            <span>Avanzar Ronda ⏩</span>
          </button>

          {/* Simulate Entire Tournament */}
          <button
            type="button"
            onClick={requestSimulateAll}
            className="px-3.5 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#f15a24] border border-orange-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Simular todas las rondas y cerrar el torneo previa confirmación"
          >
            <Sparkles className="w-4 h-4 text-[#f15a24]" />
            <span>Simular y Cerrar 🏆</span>
          </button>

          {/* Regenerate */}
          <button
            type="button"
            onClick={requestRegenerate}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Reiniciar y regenerar las llaves previa confirmación"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reiniciar</span>
          </button>
        </div>
      </div>

      {/* ACTION NOTICE TOAST */}
      {actionNotice && (
        <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-[#002f6c] text-xs font-semibold flex items-center justify-between gap-3 animate-fade-in shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionNotice}</span>
          </div>
          <button 
            onClick={() => setActionNotice(null)}
            className="text-[11px] underline hover:text-[#002352] cursor-pointer"
          >
            Entendido
          </button>
        </div>
      )}

      {tournaments.length === 0 ? (
        <div className="py-16 px-6 rounded-3xl border border-dashed border-slate-200 bg-white text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#f15a24]">
            <Trophy className="w-7 h-7 text-[#f15a24]" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-lg font-bold font-heading text-slate-900">
              No hay torneos registrados para generar brackets
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              La plataforma está lista para su primer uso. Crea un torneo oficial y registra jugadores para generar y avanzar las llaves de competencia.
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
        <>
          {/* 1. TOURNAMENT STATUS FILTER & SELECTOR */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
            1. Selecciona el Torneo (Activo o Pasado)
          </label>

          {/* Filter tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-[11px] font-bold">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'ALL' ? 'bg-white text-[#002f6c] shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Todos ({tournaments.length})
            </button>
            <button
              onClick={() => setStatusFilter('IN_PROGRESS')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                statusFilter === 'IN_PROGRESS' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>En Curso</span>
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
            <button
              onClick={() => setStatusFilter('OPEN')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                statusFilter === 'OPEN' ? 'bg-white text-amber-700 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>En Registro</span>
            </button>
          </div>
        </div>

        {/* Chips of tournaments */}
        <div className="flex flex-wrap gap-2.5">
          {filteredTournaments.map((t) => {
            const isSelected = t.id === currentTourneyId;
            const tBracket = activeBracketsMap[t.id];
            const tourneyClosed = isTournamentPassed(t) || t.status === 'COMPLETED' || tBracket?.status === 'COMPLETED';
            const tourneyInProgress = (t.status === 'IN_PROGRESS' || tBracket?.status === 'IN_PROGRESS') && !tourneyClosed;
            const registeredInTourney = participants.filter(p => p.tournamentId === t.id).length;

            return (
              <button
                key={t.id}
                onClick={() => handleTournamentChange(t.id)}
                className={`px-4 py-2.5 rounded-2xl border text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
                  isSelected
                    ? 'border-[#002f6c] bg-blue-50/80 text-[#002f6c] ring-2 ring-[#002f6c]/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Gamepad2 className={`w-4 h-4 ${isSelected ? 'text-[#ed1c24]' : 'text-slate-400'}`} />
                <div className="text-left">
                  <div className="leading-tight flex items-center gap-1.5">
                    <span>{t.gameName}</span>
                    {tourneyClosed ? (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-rose-100 text-rose-700 border border-rose-200 font-extrabold flex items-center gap-0.5">
                        <Lock className="w-2.5 h-2.5" />
                        <span>Cerrado</span>
                      </span>
                    ) : tourneyInProgress ? (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200 font-extrabold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>En Juego</span>
                      </span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600 font-medium">
                        {registeredInTourney} inscritos
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-normal block truncate max-w-[170px]">
                    {t.startDate}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. DYNAMIC TOURNAMENT PROGRESS & STATUS BANNER */}
      {selectedTourney && (
        <div className={`p-5 rounded-3xl border transition-all ${
          isBracketClosed
            ? 'bg-gradient-to-r from-slate-900 via-[#002f6c] to-slate-900 text-white border-slate-700 shadow-md'
            : currentBracket?.status === 'IN_PROGRESS'
            ? 'bg-gradient-to-r from-emerald-50 via-blue-50 to-white border-emerald-200 text-slate-900 shadow-xs'
            : 'bg-slate-50 border-slate-200 text-slate-800'
        }`}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                {isBracketClosed ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-slate-950 flex items-center gap-1 uppercase tracking-wide">
                    <Lock className="w-3 h-3 text-slate-950" />
                    <span>Torneo Concluido • Llave Cerrada</span>
                  </span>
                ) : currentBracket?.status === 'IN_PROGRESS' ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500 text-white flex items-center gap-1 uppercase tracking-wide">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                    <span>En Juego • Llave Avanzando</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700 uppercase tracking-wide">
                    Llave Preliminar
                  </span>
                )}

                <span className={`text-xs font-semibold ${isBracketClosed ? 'text-slate-300' : 'text-slate-500'}`}>
                  {selectedTourney.name}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs">
                <span className={`flex items-center gap-1.5 font-medium ${isBracketClosed ? 'text-slate-300' : 'text-slate-600'}`}>
                  <Calendar className="w-3.5 h-3.5 opacity-80" />
                  <span>Programado: {selectedTourney.startDate}</span>
                </span>

                <span className={`flex items-center gap-1.5 font-medium ${isBracketClosed ? 'text-slate-300' : 'text-slate-600'}`}>
                  <Award className="w-3.5 h-3.5 opacity-80" />
                  <span>Premio: {selectedTourney.prizePool}</span>
                </span>
              </div>
            </div>

            {/* Quick State Toggle for Organizers */}
            <div className="flex items-center gap-2">
              {isBracketClosed ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsUnlockedForEditing(!isUnlockedForEditing);
                      showNotice(isUnlockedForEditing ? 'Llave protegida contra cambios.' : 'Modo edición activado: Ahora puedes hacer clic en partidas para corregir ganadores.');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isUnlockedForEditing 
                        ? 'bg-amber-400 text-slate-950 hover:bg-amber-300 shadow-2xs' 
                        : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                    }`}
                    title="Permite hacer correcciones a resultados de una llave ya cerrada"
                  >
                    {isUnlockedForEditing ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                    <span>{isUnlockedForEditing ? 'Edición Habilitada' : 'Reabrir Llave'}</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={requestCloseTournamentManually}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  title="Cerrar oficialmente el torneo y congelar los resultados previa confirmación"
                >
                  <Lock className="w-3.5 h-3.5 text-orange-400" />
                  <span>Cerrar Torneo Oficialmente</span>
                </button>
              )}
            </div>

          </div>

          {/* Live Progress Bar */}
          {progress && (
            <div className="mt-4 pt-4 border-t border-slate-200/20 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className={`font-bold flex items-center gap-1.5 ${isBracketClosed ? 'text-amber-300' : 'text-slate-700'}`}>
                  <Layers className="w-3.5 h-3.5" />
                  <span>Progreso de Llaves: {progress.percentage}%</span>
                  <span className="font-normal opacity-80">
                    ({progress.completedMatches} de {progress.totalMatches} partidas cerradas)
                  </span>
                </span>
                <span className={`text-[11px] font-semibold ${isBracketClosed ? 'text-slate-300' : 'text-[#002f6c]'}`}>
                  {isBracketClosed ? '🏆 Llave Completada' : `Fase activa: ${progress.currentRoundName}`}
                </span>
              </div>

              <div className="w-full h-2 rounded-full bg-slate-200/40 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    isBracketClosed 
                      ? 'bg-gradient-to-r from-amber-400 to-amber-200' 
                      : 'bg-gradient-to-r from-[#002f6c] via-[#f15a24] to-emerald-500'
                  }`}
                  style={{ width: `${Math.max(5, progress.percentage)}%` }}
                />
              </div>
            </div>
          )}

        </div>
      )}

      {/* 3. PODIUM / CHAMPION SPOTLIGHT (When crowned or tournament closed) */}
      {currentBracket?.champion && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-6 animate-fade-in relative overflow-hidden">
          
          {/* Decorative Glow */}
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center gap-5 relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white shadow-inner shrink-0">
              <Crown className="w-10 h-10 text-amber-200 animate-bounce" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-white text-orange-600 shadow-2xs">
                  🏆 Gran Campeón FIT UAT
                </span>
                <span className="text-xs text-orange-100 font-bold">
                  {currentBracket.tournamentName}
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-black font-heading text-white mt-1">
                {currentBracket.champion.gamertag}
              </h3>

              <p className="text-xs text-orange-100 font-medium">
                {currentBracket.champion.faculty || 'Facultad de Ingeniería Tampico • Universidad Autónoma de Tamaulipas'}
              </p>
            </div>
          </div>

          {/* Subchampion & Status Badge */}
          <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-white/20 relative z-10 text-right">
            <div>
              <div className="text-[11px] text-orange-200 font-semibold uppercase">Subcampeón (2° Lugar)</div>
              <div className="text-base font-extrabold text-white font-heading">
                {currentBracket.runnerUp?.gamertag || 'Segundo Lugar'}
              </div>
            </div>

            <span className="px-3 py-1 rounded-full bg-black/20 text-[11px] font-bold text-amber-200 border border-white/20 flex items-center gap-1">
              <Lock className="w-3 h-3 text-amber-300" />
              <span>Resultados Certificados y Cerrados</span>
            </span>
          </div>

        </div>
      )}

      {/* 4. BRACKET FORMAT CONTROLS (ONLY REAL PARTICIPANTS) */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* Size picker */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-700">Formato de la Llave:</span>
          <div className="flex flex-wrap gap-1.5">
            {[2, 4, 8, 16].map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => {
                  setBracketSize(size);
                  if (selectedTourney) {
                    const fresh = generateAutomaticBracket(
                      selectedTourney,
                      tourneyParticipants,
                      size,
                      false
                    );
                    updateBracketState(selectedTourney.id, fresh);
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  bracketSize === size
                    ? 'bg-[#002f6c] text-white shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {size === 2 ? '2 Jugadores (Final)' : `${size} Jugadores`}
              </button>
            ))}
          </div>
        </div>

        <div className="text-xs font-semibold text-slate-600 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>{tourneyParticipants.length} {tourneyParticipants.length === 1 ? 'jugador inscrito' : 'jugadores inscritos'} en este torneo</span>
        </div>

      </div>

      {tourneyParticipants.length === 0 && (
        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-[#002f6c] text-xs flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-4 h-4 text-[#f15a24] shrink-0" />
            <span>Aún no hay jugadores inscritos en este torneo. Los competidores registrados en el formulario se incorporarán automáticamente a las llaves.</span>
          </div>
        </div>
      )}

      {/* 5. VISUAL BRACKET TREE */}
      {currentBracket && (
        <div className="relative overflow-x-auto pb-4 pt-2">
          
          <div className="min-w-[780px] flex items-stretch gap-6 lg:gap-8 justify-between">
            {currentBracket.rounds.map((round, rIdx) => {
              const isLastRound = rIdx === currentBracket.rounds.length - 1;
              const isRoundFullyCompleted = round.matches.every(m => m.status === 'COMPLETED');
              const isRoundActive = round.matches.some(m => m.status === 'READY') && !isRoundFullyCompleted;

              return (
                <div key={round.roundIndex} className="flex-1 flex flex-col">
                  
                  {/* Round Header */}
                  <div className="mb-4 text-center space-y-1">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border shadow-2xs ${
                      isRoundFullyCompleted
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : isRoundActive
                        ? 'bg-blue-50 text-[#002f6c] border-blue-200 ring-2 ring-blue-500/10'
                        : isLastRound
                        ? 'bg-red-50 text-[#ed1c24] border-red-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {isRoundFullyCompleted && <Check className="w-3 h-3 text-emerald-600" />}
                      <span>{round.name}</span>
                    </span>

                    <span className="block text-[11px] font-medium text-slate-400">
                      {isRoundFullyCompleted ? (
                        <span className="text-emerald-600 font-bold flex items-center justify-center gap-1">
                          <Lock className="w-2.5 h-2.5" />
                          <span>Ronda Cerrada</span>
                        </span>
                      ) : isRoundActive ? (
                        <span className="text-[#002f6c] font-bold">
                          ⚡ En Disputa
                        </span>
                      ) : (
                        <span>{round.matches.length} {round.matches.length === 1 ? 'partida' : 'partidas'}</span>
                      )}
                    </span>
                  </div>

                  {/* Matches Column */}
                  <div className="flex-1 flex flex-col justify-around gap-6">
                    {round.matches.map((match) => {
                      const isCompleted = match.status === 'COMPLETED';
                      const p1Won = match.winner?.id === match.player1?.id;
                      const p2Won = match.winner?.id === match.player2?.id;
                      const isClickable = (!isBracketClosed || isUnlockedForEditing) && !isCompleted && match.status === 'READY';

                      return (
                        <div
                          key={match.id}
                          className={`rounded-2xl border transition-all duration-200 overflow-hidden shadow-2xs ${
                            isCompleted
                              ? 'border-slate-200 bg-white ring-1 ring-slate-100'
                              : match.status === 'READY'
                              ? 'border-[#002f6c]/50 bg-white ring-2 ring-[#002f6c]/15 shadow-sm'
                              : 'border-slate-200 bg-slate-50/70 opacity-75'
                          }`}
                        >
                          {/* Match Header Tag */}
                          <div className={`px-3 py-1 border-b flex items-center justify-between text-[10px] font-medium ${
                            isCompleted 
                              ? 'bg-emerald-50/50 border-emerald-100 text-emerald-900' 
                              : match.status === 'READY'
                              ? 'bg-blue-50/70 border-blue-100 text-[#002f6c]'
                              : 'bg-slate-50 border-slate-100 text-slate-500'
                          }`}>
                            <span className="font-bold">Partida #{match.matchIndex + 1}</span>
                            <span className="flex items-center gap-1 font-bold">
                              {isCompleted ? (
                                <>
                                  <Lock className="w-2.5 h-2.5 text-emerald-600" />
                                  <span className="text-emerald-700">Cerrada</span>
                                </>
                              ) : match.status === 'READY' ? (
                                <>
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                                  <span className="text-blue-700">Lista para Jugar</span>
                                </>
                              ) : (
                                <span className="text-slate-400">En espera</span>
                              )}
                            </span>
                          </div>

                          {/* Player 1 Row */}
                          <button
                            type="button"
                            disabled={!match.player1 || match.player1.isBye || (!isClickable && !isUnlockedForEditing)}
                            onClick={() => handlePlayerClick(match, match.player1)}
                            className={`w-full p-2.5 flex items-center justify-between gap-2 text-left transition-colors border-b border-slate-100 ${
                              isClickable && match.player1 && !match.player1.isBye
                                ? 'hover:bg-blue-50/80 cursor-pointer group'
                                : 'cursor-default'
                            } ${p1Won ? 'bg-emerald-50/80 font-bold' : ''}`}
                            title={isClickable && match.player1 ? 'Clic para declarar ganador y avanzar' : undefined}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">
                                #{match.player1?.seed || '-'}
                              </span>
                              {match.player1 ? (
                                <>
                                  <img
                                    src={match.player1.avatarUrl}
                                    alt=""
                                    className="w-6 h-6 rounded-md bg-white border border-slate-200 object-cover shrink-0"
                                  />
                                  <div className="truncate">
                                    <span className={`text-xs block truncate ${
                                      p1Won ? 'text-[#002f6c] font-bold' : 'text-slate-800 font-semibold'
                                    }`}>
                                      {match.player1.gamertag}
                                    </span>
                                  </div>
                                </>
                              ) : (
                                <span className="text-xs text-slate-400 italic">Por definir</span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {p1Won && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                              <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                                p1Won 
                                  ? 'bg-emerald-600 text-white' 
                                  : isCompleted 
                                  ? 'text-slate-400 bg-slate-100' 
                                  : 'text-slate-500'
                              }`}>
                                {match.score1 !== null ? match.score1 : '-'}
                              </span>
                            </div>
                          </button>

                          {/* Player 2 Row */}
                          <button
                            type="button"
                            disabled={!match.player2 || match.player2.isBye || (!isClickable && !isUnlockedForEditing)}
                            onClick={() => handlePlayerClick(match, match.player2)}
                            className={`w-full p-2.5 flex items-center justify-between gap-2 text-left transition-colors ${
                              isClickable && match.player2 && !match.player2.isBye
                                ? 'hover:bg-blue-50/80 cursor-pointer group'
                                : 'cursor-default'
                            } ${p2Won ? 'bg-emerald-50/80 font-bold' : ''}`}
                            title={isClickable && match.player2 ? 'Clic para declarar ganador y avanzar' : undefined}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">
                                #{match.player2?.seed || '-'}
                              </span>
                              {match.player2 ? (
                                <>
                                  <img
                                    src={match.player2.avatarUrl}
                                    alt=""
                                    className="w-6 h-6 rounded-md bg-white border border-slate-200 object-cover shrink-0"
                                  />
                                  <div className="truncate">
                                    <span className={`text-xs block truncate ${
                                      p2Won ? 'text-[#002f6c] font-bold' : 'text-slate-800 font-semibold'
                                    }`}>
                                      {match.player2.gamertag}
                                    </span>
                                  </div>
                                </>
                              ) : (
                                <span className="text-xs text-slate-400 italic">Por definir</span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {p2Won && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                              <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                                p2Won 
                                  ? 'bg-emerald-600 text-white' 
                                  : isCompleted 
                                  ? 'text-slate-400 bg-slate-100' 
                                  : 'text-slate-500'
                              }`}>
                                {match.score2 !== null ? match.score2 : '-'}
                              </span>
                            </div>
                          </button>

                        </div>
                      );
                    })}
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* FOOTER INSTRUCTIONS */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Gamepad2 className="w-4 h-4 text-[#002f6c] shrink-0" />
          <span>
            Haz clic en el jugador para otorgarle la victoria previa confirmación y avanzar en la llave, o usa <strong>Avanzar Ronda ⏩</strong> para resolver la fase actual.
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-extrabold text-[#002f6c] bg-white px-2.5 py-1 rounded-lg border border-slate-200">
            Reglamento Oficial ESPORTS FIT UAT
          </span>
        </div>
      </div>
      </>
      )}

      {/* MODAL DE CONFIRMACIÓN DE GANADOR (REQUERIDO POR EL USUARIO) */}
      {winnerConfirmData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in text-slate-900">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 border border-slate-200 shadow-2xl relative">
            
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#f15a24] block">
                    Confirmación de Resultado Oficial
                  </span>
                  <h3 className="text-lg font-bold font-heading text-[#002f6c]">
                    Confirmar Ganador del Encuentro
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWinnerConfirmData(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Match Context */}
            <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
              <span>{winnerConfirmData.roundName}</span>
              <span className="font-semibold text-[#002f6c]">{selectedTourney.gameName}</span>
            </div>

            {/* Matchup Comparison Card */}
            <div className="grid grid-cols-2 gap-3 items-stretch">
              {/* Winner Card */}
              <div className="p-4 rounded-2xl bg-emerald-50/80 border-2 border-emerald-500 text-center space-y-2 relative shadow-xs">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-600 text-white uppercase tracking-wider">
                  <Crown className="w-3 h-3" /> Ganador
                </span>
                <img
                  src={winnerConfirmData.winner.avatarUrl}
                  alt={winnerConfirmData.winner.gamertag}
                  className="w-12 h-12 rounded-xl mx-auto border-2 border-emerald-400 bg-white object-cover"
                />
                <div>
                  <h4 className="text-sm font-bold text-slate-900 truncate">
                    {winnerConfirmData.winner.gamertag}
                  </h4>
                  <p className="text-[11px] text-slate-500 truncate">
                    Semilla #{winnerConfirmData.winner.seed}
                  </p>
                </div>
                {/* Score selector */}
                <div className="pt-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Marcador
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="9"
                    value={scoreWinner}
                    onChange={(e) => setScoreWinner(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 px-2 py-1 text-center font-mono font-bold text-sm bg-white border border-emerald-400 rounded-lg text-emerald-800"
                  />
                </div>
              </div>

              {/* Opponent Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2 relative opacity-85">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-600 uppercase tracking-wider">
                  Rival
                </span>
                {winnerConfirmData.opponent ? (
                  <>
                    <img
                      src={winnerConfirmData.opponent.avatarUrl}
                      alt={winnerConfirmData.opponent.gamertag}
                      className="w-12 h-12 rounded-xl mx-auto border border-slate-300 bg-white object-cover"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-slate-700 truncate">
                        {winnerConfirmData.opponent.gamertag}
                      </h4>
                      <p className="text-[11px] text-slate-400 truncate">
                        Semilla #{winnerConfirmData.opponent.seed}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="py-4">
                    <span className="text-xs text-slate-400 italic">Pase Libre (BYE)</span>
                  </div>
                )}
                <div className="pt-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Marcador
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="9"
                    value={scoreOpponent}
                    onChange={(e) => setScoreOpponent(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-16 px-2 py-1 text-center font-mono font-bold text-sm bg-white border border-slate-300 rounded-lg text-slate-700"
                  />
                </div>
              </div>
            </div>

            {/* Presets */}
            <div className="flex items-center justify-center gap-2 text-xs">
              <span className="text-[11px] text-slate-500">Marcadores rápidos:</span>
              <button
                type="button"
                onClick={() => { setScoreWinner(2); setScoreOpponent(0); }}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-mono font-semibold cursor-pointer"
              >
                2 - 0
              </button>
              <button
                type="button"
                onClick={() => { setScoreWinner(2); setScoreOpponent(1); }}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-mono font-semibold cursor-pointer"
              >
                2 - 1
              </button>
              <button
                type="button"
                onClick={() => { setScoreWinner(1); setScoreOpponent(0); }}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-mono font-semibold cursor-pointer"
              >
                1 - 0
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed text-center">
              ¿Confirmas a <strong>{winnerConfirmData.winner.gamertag}</strong> como ganador para avanzar en la llave de la Facultad de Ingeniería Tampico?
            </p>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setWinnerConfirmData(null)}
                className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmWinner}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Confirmar Ganador y Actualizar Bracket</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN DE ACCIONES GLOBALES */}
      {actionConfirmData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in text-slate-900">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl relative">
            <div className="flex items-start gap-3.5">
              <div className={`p-3 rounded-2xl shrink-0 ${
                actionConfirmData.variant === 'danger' 
                  ? 'bg-rose-50 text-rose-600 border border-rose-200'
                  : actionConfirmData.variant === 'warning'
                  ? 'bg-amber-50 text-amber-600 border border-amber-200'
                  : 'bg-blue-50 text-[#002f6c] border border-blue-200'
              }`}>
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 font-heading">
                  {actionConfirmData.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {actionConfirmData.message}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActionConfirmData(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={actionConfirmData.action}
                className={`px-5 py-2 rounded-xl text-white font-bold text-xs shadow-xs transition-colors cursor-pointer ${
                  actionConfirmData.variant === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : actionConfirmData.variant === 'warning'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-[#002f6c] hover:bg-[#002352]'
                }`}
              >
                {actionConfirmData.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

    </section>
  );
};
