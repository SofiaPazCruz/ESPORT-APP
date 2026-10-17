import React, { useState, useEffect } from 'react';
import { Sidebar, ActiveWindowView } from './components/Sidebar';
import { TournamentsWindow } from './views/TournamentsWindow';
import { RegistrationWindow } from './views/RegistrationWindow';
import { RosterWindow } from './views/RosterWindow';
import { InvitationsWindow } from './views/InvitationsWindow';
import { PlayerRegistrationPortal } from './views/PlayerRegistrationPortal';
import { BracketViewer } from './components/BracketViewer';
import { UniversityIdentityModal } from './components/UniversityIdentityModal';
import { INITIAL_TOURNAMENTS, INITIAL_PARTICIPANTS, TEMPLATE_FIT_TOURNAMENTS } from './data/mockTournaments';
import { 
  UniversityBrandConfig, 
  loadUniversityBrand, 
  saveUniversityBrand, 
  BRAND_ASSETS 
} from './data/universityBrand';
import { Tournament, Participant, RegistrationFormData, CreateTournamentFormData } from './types/tournament';
import { TournamentBracket } from './types/bracket';
import { isTournamentPassed, generateAutomaticBracket } from './utils/bracketGenerator';
import { GoogleAuthProviderComponent } from './context/GoogleAuthContext';

const SIDEBAR_STORAGE_KEY = 'esports_sidebar_visible_pref_v1';
const VIEW_STORAGE_KEY = 'esports_active_window_view_v1';
const TOURNAMENTS_STORAGE_KEY = 'esports_tournaments_v7';
const PARTICIPANTS_STORAGE_KEY = 'esports_participants_v7';
const BRACKETS_STORAGE_KEY = 'esports_brackets_v7';
const PURGE_WIPE_APPLIED_KEY = 'esports_fresh_start_first_use_v7';

// One-time guaranteed wipe to leave the application in a clean state as if used for the very first time:
try {
  if (typeof window !== 'undefined' && !localStorage.getItem(PURGE_WIPE_APPLIED_KEY)) {
    const keysToPurge = [
      'esports_participants_v1',
      'esports_participants_v2',
      'esports_participants_v3',
      'esports_participants_v4',
      'esports_participants_v5',
      'esports_participants_v6',
      'esports_participants_v7',
      'esports_tournaments_v1',
      'esports_tournaments_v2',
      'esports_tournaments_v3',
      'esports_tournaments_v4',
      'esports_tournaments_v5',
      'esports_tournaments_v6',
      'esports_tournaments_v7',
      'esports_brackets_v1',
      'esports_brackets_v2',
      'esports_brackets_v3',
      'esports_brackets_v4',
      'esports_brackets_v5',
      'esports_brackets_v6',
      'esports_brackets_v7',
      'esports_wipe_all_manual_and_mock_data_v6',
    ];
    keysToPurge.forEach(k => {
      try { localStorage.removeItem(k); } catch {}
    });
    localStorage.setItem(PURGE_WIPE_APPLIED_KEY, 'true');
    localStorage.setItem(PARTICIPANTS_STORAGE_KEY, JSON.stringify([]));
    localStorage.setItem(TOURNAMENTS_STORAGE_KEY, JSON.stringify([]));
    localStorage.setItem(BRACKETS_STORAGE_KEY, JSON.stringify({}));
  }
} catch {}

export default function App() {
  // Load real registered participants from persistent localStorage (starts completely clean: 0 players)
  const [participants, setParticipants] = useState<Participant[]>(() => {
    try {
      const saved = localStorage.getItem(PARTICIPANTS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Keep only real registered players, no simulated mocks
          return parsed.filter(p => !String(p.id).startsWith('mock-') && p.gamertag !== 'Castor_Dev');
        }
      }
    } catch {
      // fallback
    }
    return INITIAL_PARTICIPANTS;
  });

  // Tournaments state - always synchronized with actual participant count!
  const [tournaments, setTournaments] = useState<Tournament[]>(() => {
    let list = INITIAL_TOURNAMENTS;
    try {
      const saved = localStorage.getItem(TOURNAMENTS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          list = parsed;
        }
      }
    } catch {
      // fallback
    }

    // Read real saved participants to compute currentSlots accurately on reload
    let savedP: Participant[] = [];
    try {
      const rawP = localStorage.getItem(PARTICIPANTS_STORAGE_KEY);
      if (rawP) {
        const parsed = JSON.parse(rawP);
        if (Array.isArray(parsed)) {
          savedP = parsed.filter(p => !String(p.id).startsWith('mock-') && p.gamertag !== 'Castor_Dev');
        }
      }
    } catch {}

    return list.map(t => {
      const actualCount = savedP.filter(p => p.tournamentId === t.id).length;
      return {
        ...t,
        currentSlots: actualCount,
        status: t.status === 'COMPLETED' ? 'COMPLETED' : actualCount >= t.maxSlots ? 'FULL' : 'OPEN'
      };
    });
  });

  // Brackets state - starts clean for active tournaments with real players
  const [brackets, setBrackets] = useState<Record<number, TournamentBracket>>(() => {
    try {
      const saved = localStorage.getItem(BRACKETS_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // fallback
    }
    return {};
  });

  const [brandConfig, setBrandConfig] = useState<UniversityBrandConfig>(loadUniversityBrand);
  const [isIdentityModalOpen, setIsIdentityModalOpen] = useState<boolean>(false);
  const [selectedTournamentForWindow, setSelectedTournamentForWindow] = useState<number>(0);

  // Standalone Player Portal mode (Independent window without ArenaHub admin layout)
  const [isStandalonePortal, setIsStandalonePortal] = useState<boolean>(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      return Boolean(urlParams.get('join') || urlParams.get('code') || urlParams.get('view') === 'portal-jugador');
    } catch {
      return false;
    }
  });

  const [standaloneInitialCode, setStandaloneInitialCode] = useState<string>(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('join') || urlParams.get('code') || '';
    } catch {
      return '';
    }
  });

  // Active Window View state (Separate Windows as requested)
  const [activeView, setActiveView] = useState<ActiveWindowView>(() => {
    try {
      const saved = localStorage.getItem(VIEW_STORAGE_KEY) as ActiveWindowView | null;
      if (saved && ['torneos', 'registro', 'brackets', 'roster', 'invitaciones'].includes(saved)) {
        return saved;
      }
      return 'torneos';
    } catch {
      return 'torneos';
    }
  });

  const handleSelectView = (view: ActiveWindowView) => {
    setActiveView(view);
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, view);
    } catch {
      // ignore
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // The sidebar is visible by default, but the user can manually hide or show it at will
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (saved !== null) {
        return saved === 'true';
      }
      return true;
    } catch {
      return true;
    }
  });

  const handleToggleSidebar = () => {
    setIsSidebarOpen(prev => {
      const nextState = !prev;
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, String(nextState));
      } catch {
        // ignore
      }
      return nextState;
    });
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, 'false');
    } catch {
      // ignore
    }
  };

  const handleSaveBrandConfig = (newConfig: UniversityBrandConfig) => {
    setBrandConfig(newConfig);
    saveUniversityBrand(newConfig);
  };

  // Sync participants to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(PARTICIPANTS_STORAGE_KEY, JSON.stringify(participants));
    } catch {
      // ignore
    }
  }, [participants]);

  // Sync tournaments to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(TOURNAMENTS_STORAGE_KEY, JSON.stringify(tournaments));
    } catch {
      // ignore
    }
  }, [tournaments]);

  // Sync brackets to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(BRACKETS_STORAGE_KEY, JSON.stringify(brackets));
    } catch {
      // ignore
    }
  }, [brackets]);

  // Real-time synchronization across windows/tabs (e.g. standalone player portal window)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === PARTICIPANTS_STORAGE_KEY && e.newValue) {
        try {
          const updatedP: Participant[] = JSON.parse(e.newValue);
          setParticipants(updatedP);
          setTournaments(prev => prev.map(t => ({
            ...t,
            currentSlots: updatedP.filter(p => p.tournamentId === t.id).length
          })));
        } catch {}
      }
      if (e.key === TOURNAMENTS_STORAGE_KEY && e.newValue) {
        try {
          setTournaments(JSON.parse(e.newValue));
        } catch {}
      }
      if (e.key === BRACKETS_STORAGE_KEY && e.newValue) {
        try {
          setBrackets(JSON.parse(e.newValue));
        } catch {}
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Handler for bracket updates (match advanced, round advanced, simulator, closure)
  const handleUpdateBracket = (tournamentId: number, updatedBracket: TournamentBracket) => {
    setBrackets(prev => {
      const next = { ...prev, [tournamentId]: updatedBracket };
      try {
        localStorage.setItem(BRACKETS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });

    // If a champion is determined, automatically close the tournament and celebrate champion
    if (updatedBracket.champion) {
      setTournaments(prev => prev.map(t => {
        if (t.id === tournamentId) {
          return {
            ...t,
            status: 'COMPLETED',
            championName: updatedBracket.champion?.gamertag,
            runnerUpName: updatedBracket.runnerUp?.gamertag,
            completedAt: updatedBracket.completedAt || new Date().toLocaleString(),
          };
        }
        return t;
      }));
    } else if (updatedBracket.status === 'IN_PROGRESS') {
      setTournaments(prev => prev.map(t => {
        if (t.id === tournamentId && t.status !== 'IN_PROGRESS' && t.status !== 'COMPLETED') {
          return { ...t, status: 'IN_PROGRESS' };
        }
        return t;
      }));
    }
  };

  const handleUpdateTournamentStatus = (
    tournamentId: number,
    newStatus: Tournament['status'],
    championName?: string,
    runnerUpName?: string
  ) => {
    setTournaments(prev => prev.map(t => {
      if (t.id === tournamentId) {
        return {
          ...t,
          status: newStatus,
          championName: championName !== undefined ? championName : t.championName,
          runnerUpName: runnerUpName !== undefined ? runnerUpName : t.runnerUpName,
          completedAt: newStatus === 'COMPLETED' ? (t.completedAt || new Date().toLocaleString()) : undefined,
        };
      }
      return t;
    }));
  };

  // Crear y publicar un nuevo torneo de la Facultad de Ingeniería Tampico
  const handleCreateTournament = (formData: CreateTournamentFormData): Tournament => {
    const newId = Date.now();
    const codePrefix = formData.gameId.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4) || 'FIT';
    const newTournament: Tournament = {
      id: newId,
      name: formData.name,
      gameId: formData.gameId,
      gameName: formData.gameName,
      format: formData.format,
      maxSlots: formData.maxSlots,
      currentSlots: 0,
      prizePool: formData.prizePool,
      status: 'OPEN',
      region: formData.region,
      startDate: formData.startDate,
      bannerColor: 'from-orange-50 via-white to-slate-50 border-orange-200',
      icon: 'Gamepad2',
      inviteCode: `FIT-${codePrefix}-${newId.toString().slice(-3)}`,
    };

    setTournaments(prev => [newTournament, ...prev]);
    setSelectedTournamentForWindow(newId);
    return newTournament;
  };

  // Lógica de registro para torneos de videojuegos en la FIT UAT
  const handleAddParticipant = (formData: RegistrationFormData) => {
    const tournament = tournaments.find(t => t.id === formData.tournamentId);

    if (!tournament) {
      return {
        success: false,
        message: 'El torneo seleccionado no existe o no está disponible.',
        errorField: 'tournament' as const,
      };
    }

    if (tournament.currentSlots >= tournament.maxSlots) {
      return {
        success: false,
        message: `El torneo "${tournament.name}" ha completado su capacidad máxima (${tournament.maxSlots} lugares).`,
        errorField: 'tournament' as const,
      };
    }

    const gamertagExists = participants.some(
      p => p.tournamentId === formData.tournamentId && 
           p.gamertag.toLowerCase() === formData.gamertag.toLowerCase()
    );

    if (gamertagExists) {
      return {
        success: false,
        message: `El Gamertag "${formData.gamertag}" ya está registrado en este torneo de la FIT.`,
        errorField: 'gamertag' as const,
      };
    }

    const emailExists = participants.some(
      p => p.tournamentId === formData.tournamentId && 
           p.email.toLowerCase() === formData.email.toLowerCase()
    );

    if (emailExists) {
      return {
        success: false,
        message: `El correo "${formData.email}" ya cuenta con una inscripción activa en este torneo.`,
        errorField: 'email' as const,
      };
    }

    const newSeed = tournament.currentSlots + 1;
    const prefix = 'FIT-UAT';
    const randomHex = Math.random().toString(16).substring(2, 7).toUpperCase();
    const checkInCode = `${prefix}-${tournament.id}-${randomHex}`;

    const newParticipant: Participant = {
      id: Date.now(),
      tournamentId: tournament.id,
      tournamentName: tournament.name,
      gameName: tournament.gameName,
      gamertag: formData.gamertag,
      email: formData.email,
      studentId: formData.studentId,
      faculty: formData.faculty,
      discordTag: formData.discordTag || undefined,
      platform: formData.platform,
      checkInCode,
      seedNumber: newSeed,
      registeredAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'CONFIRMED',
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(formData.gamertag)}&backgroundColor=002f6c`,
      emailSent: true,
      emailSentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedParticipants = [newParticipant, ...participants];
    setParticipants(updatedParticipants);
    try {
      localStorage.setItem(PARTICIPANTS_STORAGE_KEY, JSON.stringify(updatedParticipants));
    } catch {}

    setTournaments(prev =>
      prev.map(t => {
        if (t.id === tournament.id) {
          const updatedSlots = t.currentSlots + 1;
          return {
            ...t,
            currentSlots: updatedSlots,
            status: updatedSlots >= t.maxSlots ? 'FULL' : updatedSlots >= (t.maxSlots * 0.85) ? 'CLOSING_SOON' : 'OPEN',
          };
        }
        return t;
      })
    );

    // Synchronize tournament bracket immediately so both players are placed into the bracket
    const tourneyParticipants = updatedParticipants.filter(p => p.tournamentId === tournament.id);
    const existingBracket = brackets[tournament.id];
    if (!existingBracket || existingBracket.status === 'OPEN') {
      const preferredSize = existingBracket?.bracketSize || (tourneyParticipants.length <= 2 ? 2 : tourneyParticipants.length <= 4 ? 4 : 8);
      const updatedBracket = generateAutomaticBracket(tournament, tourneyParticipants, preferredSize, false);
      setBrackets(prev => {
        const next = { ...prev, [tournament.id]: updatedBracket };
        try {
          localStorage.setItem(BRACKETS_STORAGE_KEY, JSON.stringify(next));
        } catch {}
        return next;
      });
    }

    return {
      success: true,
      message: 'Jugador de la Facultad de Ingeniería Tampico registrado exitosamente.',
      participant: newParticipant,
    };
  };

  const handleDeleteParticipant = (id: number) => {
    const toRemove = participants.find(p => p.id === id);
    if (!toRemove) return;

    const updatedParticipants = participants.filter(p => p.id !== id);
    setParticipants(updatedParticipants);
    try {
      localStorage.setItem(PARTICIPANTS_STORAGE_KEY, JSON.stringify(updatedParticipants));
    } catch {}

    setTournaments(prev =>
      prev.map(t => {
        if (t.id === toRemove.tournamentId) {
          const updatedSlots = Math.max(0, t.currentSlots - 1);
          return {
            ...t,
            currentSlots: updatedSlots,
            status: updatedSlots < t.maxSlots ? 'OPEN' : t.status,
          };
        }
        return t;
      })
    );

    const tourneyParticipants = updatedParticipants.filter(p => p.tournamentId === toRemove.tournamentId);
    const tourney = tournaments.find(t => t.id === toRemove.tournamentId);
    if (tourney) {
      const existingBracket = brackets[toRemove.tournamentId];
      if (!existingBracket || existingBracket.status === 'OPEN') {
        const preferredSize = existingBracket?.bracketSize || (tourneyParticipants.length <= 2 ? 2 : tourneyParticipants.length <= 4 ? 4 : 8);
        const updatedBracket = generateAutomaticBracket(tourney, tourneyParticipants, preferredSize, false);
        setBrackets(prev => {
          const next = { ...prev, [toRemove.tournamentId]: updatedBracket };
          try {
            localStorage.setItem(BRACKETS_STORAGE_KEY, JSON.stringify(next));
          } catch {}
          return next;
        });
      }
    }
  };

  const handleClearAll = () => {
    setParticipants([]);
    setTournaments([]);
    setBrackets({});
    try {
      localStorage.setItem(PARTICIPANTS_STORAGE_KEY, JSON.stringify([]));
      localStorage.setItem(TOURNAMENTS_STORAGE_KEY, JSON.stringify([]));
      localStorage.setItem(BRACKETS_STORAGE_KEY, JSON.stringify({}));
    } catch {}
  };

  const handleLoadTemplates = () => {
    setTournaments(TEMPLATE_FIT_TOURNAMENTS);
    try {
      localStorage.setItem(TOURNAMENTS_STORAGE_KEY, JSON.stringify(TEMPLATE_FIT_TOURNAMENTS));
    } catch {}
    if (TEMPLATE_FIT_TOURNAMENTS[0]) {
      setSelectedTournamentForWindow(TEMPLATE_FIT_TOURNAMENTS[0].id);
    }
  };

  const handleMarkEmailSent = (participantId: number) => {
    setParticipants(prev =>
      prev.map(p => {
        if (p.id === participantId) {
          return {
            ...p,
            emailSent: true,
            emailSentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
        }
        return p;
      })
    );
  };

  const currentUatLogo = brandConfig.customLogoUatUrl || BRAND_ASSETS.uatEscudo;
  const currentFitLogo = brandConfig.customLogoFitUrl || BRAND_ASSETS.fitLogo;

  // Render Standalone Player Registration Window if requested via invitation link (?join=CODE) or portal button
  if (isStandalonePortal) {
    return (
      <GoogleAuthProviderComponent>
        <PlayerRegistrationPortal
          tournaments={tournaments}
          participants={participants}
          brandConfig={brandConfig}
          initialCode={standaloneInitialCode}
          onAddParticipant={handleAddParticipant}
          onReturnToAdmin={() => {
            setIsStandalonePortal(false);
            try {
              window.history.pushState({}, '', window.location.pathname);
            } catch {
              // ignore
            }
          }}
        />
      </GoogleAuthProviderComponent>
    );
  }

  return (
    <GoogleAuthProviderComponent>
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col uat-grid">
      
      {/* Left Sidebar Navigation with separate window tabs */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={handleToggleSidebar}
        onClose={handleCloseSidebar}
        participantCount={participants.length}
        brandConfig={brandConfig}
        onOpenIdentityModal={() => setIsIdentityModalOpen(true)}
        activeView={activeView}
        onSelectView={handleSelectView}
      />

      {/* Main Content Area: Smoothly shifts when sidebar is open or closed */}
      <div 
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isSidebarOpen ? 'sm:pl-72 md:pl-80' : 'pl-0'
        }`}
      >
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* DEDICATED SEPARATE WINDOWS: ONLY THE ACTIVE WINDOW IS RENDERED */}
          {activeView === 'torneos' && (
            <TournamentsWindow
              tournaments={tournaments}
              participants={participants}
              onSelectTournamentForRegistration={(tId) => {
                setSelectedTournamentForWindow(tId);
                handleSelectView('registro');
              }}
              onSelectTournamentForBrackets={(tId) => {
                setSelectedTournamentForWindow(tId);
                handleSelectView('brackets');
              }}
              onCreateTournament={handleCreateTournament}
              onLoadTemplates={handleLoadTemplates}
            />
          )}

          {activeView === 'registro' && (
            <RegistrationWindow
              tournaments={tournaments}
              participants={participants}
              brandConfig={brandConfig}
              selectedTournamentId={selectedTournamentForWindow}
              onSelectTournamentId={(id) => setSelectedTournamentForWindow(id)}
              onAddParticipant={handleAddParticipant}
              onGoToBrackets={(tId) => {
                setSelectedTournamentForWindow(tId);
                handleSelectView('brackets');
              }}
              onGoToTournaments={() => handleSelectView('torneos')}
              onMarkEmailSent={handleMarkEmailSent}
            />
          )}

          {activeView === 'brackets' && (
            <BracketViewer
              tournaments={tournaments}
              participants={participants}
              selectedTournamentId={selectedTournamentForWindow}
              onSelectTournament={(id) => setSelectedTournamentForWindow(id)}
              brackets={brackets}
              onUpdateBracket={handleUpdateBracket}
              onUpdateTournamentStatus={handleUpdateTournamentStatus}
              onGoToTournaments={() => handleSelectView('torneos')}
            />
          )}

          {activeView === 'roster' && (
            <RosterWindow
              tournaments={tournaments}
              participants={participants}
              brandConfig={brandConfig}
              onDeleteParticipant={handleDeleteParticipant}
              onClearAll={handleClearAll}
              onGoToRegistration={() => handleSelectView('registro')}
              onMarkEmailSent={handleMarkEmailSent}
            />
          )}

          {activeView === 'invitaciones' && (
            <InvitationsWindow
              tournaments={tournaments}
              participants={participants}
              brandConfig={brandConfig}
              onOpenStandalonePortal={(code) => {
                setStandaloneInitialCode(code || '');
                setIsStandalonePortal(true);
              }}
              onGoToTournaments={() => handleSelectView('torneos')}
            />
          )}

        </main>

        {/* Institutional Footer on White */}
        <footer className="border-t border-slate-200 bg-white py-6 text-xs text-slate-600 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 p-1 bg-slate-50 rounded-lg border border-slate-200">
                <img 
                  src={currentUatLogo} 
                  alt="UAT" 
                  className="h-5 w-auto max-w-[24px] object-contain" 
                />
                <div className="w-[1px] h-4 bg-slate-200" />
                <img 
                  src={currentFitLogo} 
                  alt="FIT UAT" 
                  className="h-4 w-auto max-w-[70px] object-contain" 
                />
              </div>
              <span className="text-slate-800 font-bold">
                ESPORTS • Facultad de Ingeniería Tampico • Universidad Autónoma de Tamaulipas
              </span>
            </div>

            <div className="flex items-center gap-4 text-slate-500">
              <span className="italic font-medium">"Verdad, Belleza, Probidad"</span>
              <span aria-hidden="true">·</span>
              <span className="text-[#002f6c] font-bold">Campus Tampico (CUS)</span>
            </div>
          </div>
        </footer>
      </div>

      {/* University & Faculty Identity Modal */}
      <UniversityIdentityModal
        isOpen={isIdentityModalOpen}
        onClose={() => setIsIdentityModalOpen(false)}
        brandConfig={brandConfig}
        onSaveBrandConfig={handleSaveBrandConfig}
      />

      </div>
    </GoogleAuthProviderComponent>
  );
}
