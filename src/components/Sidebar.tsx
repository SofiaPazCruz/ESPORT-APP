import React, { useEffect } from 'react';
import { UniversityBrandConfig, BRAND_ASSETS } from '../data/universityBrand';
import { 
  Menu, 
  X, 
  Users, 
  Gamepad2, 
  Trophy, 
  UserPlus, 
  IdCard, 
  School,
  ChevronRight,
  PanelLeftClose,
  Share2
} from 'lucide-react';

export type ActiveWindowView = 'torneos' | 'registro' | 'brackets' | 'roster' | 'invitaciones';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  participantCount: number;
  brandConfig: UniversityBrandConfig;
  onOpenIdentityModal: () => void;
  activeView: ActiveWindowView;
  onSelectView: (view: ActiveWindowView) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
  onClose,
  participantCount,
  brandConfig,
  onOpenIdentityModal,
  activeView,
  onSelectView,
}) => {
  const currentUatLogo = brandConfig.customLogoUatUrl || BRAND_ASSETS.uatEscudo;
  const currentFitLogo = brandConfig.customLogoFitUrl || BRAND_ASSETS.fitLogo;

  // Close on Escape key (for mobile overlay mode)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && window.innerWidth < 1024) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const viewLabels: Record<ActiveWindowView, string> = {
    torneos: 'Torneos de Videojuegos',
    registro: 'Inscripción de Jugadores',
    brackets: 'Llaves y Brackets',
    roster: 'Padrón de Jugadores',
    invitaciones: 'Invitaciones y Enlaces',
  };

  const handleNavClick = (view: ActiveWindowView) => {
    onSelectView(view);
    // The sidebar stays deployed permanently across all navigation unless manually hidden by the user
  };

  return (
    <>
      {/* Floating Toggle Button (Visible ONLY when sidebar is manually hidden) */}
      {!isOpen && (
        <button
          onClick={onToggle}
          title="Mostrar menú de navegación"
          aria-label="Mostrar menú de navegación"
          className="fixed top-4 left-4 z-40 p-3 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-md hover:bg-slate-50 text-slate-800 transition-all cursor-pointer flex items-center justify-center group animate-fade-in"
        >
          <Menu className="w-5 h-5 text-slate-700 transition-transform group-hover:scale-110" />
        </button>
      )}

      {/* Mobile Backdrop overlay (only on very small phones below 640px) */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-2xs sm:hidden transition-opacity animate-fade-in"
          aria-hidden="true"
        />
      )}

      {/* The Sidebar: Visible and deployed by default, only hidden if user clicks Ocultar */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-40 w-72 sm:w-80 bg-white border-r border-slate-200 shadow-lg sm:shadow-xs flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header with Hide Button */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ed1c24]" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Menú de Ventanas
            </span>
          </div>

          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer flex items-center gap-1"
            title="Ocultar menú lateral"
            aria-label="Ocultar menú lateral"
          >
            <PanelLeftClose className="w-4 h-4" />
            <span className="text-[11px] font-semibold text-slate-500 hidden sm:inline">
              Ocultar
            </span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          
          {/* 1. Official Logos Container (Balanced dimensions) */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-2xs space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block text-center">
              Identidad Oficial
            </span>

            <div className="flex items-center justify-center gap-3 py-1">
              {/* UAT Logo Box */}
              <div className="h-16 w-16 p-2 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center justify-center">
                <img
                  src={currentUatLogo}
                  alt="UAT"
                  className="h-11 w-auto max-w-[46px] object-contain"
                />
              </div>

              <div className="w-[1px] h-10 bg-slate-200" />

              {/* FIT Tampico Logo Box */}
              <div className="h-16 px-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center justify-center">
                <img
                  src={currentFitLogo}
                  alt="FIT Tampico"
                  className="h-7 w-auto max-w-[110px] object-contain"
                />
              </div>
            </div>

            <div className="text-center pt-1 border-t border-slate-200/60">
              <h2 className="text-xl font-extrabold font-heading text-[#002f6c] tracking-tight">
                ESPORTS
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Facultad de Ingeniería Tampico • UAT
              </p>
            </div>
          </div>

          {/* 2. Player Count Highlight Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-200/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#002f6c]" />
                Jugadores Registrados
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="text-3xl font-extrabold font-heading text-[#002f6c] mt-2 tabular-nums">
              {participantCount}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Estudiantes activos en los torneos
            </p>
          </div>

          {/* 3. Window Navigation Links - Separate Windows */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-2 mb-1">
              Ventanas del Sistema
            </span>

            {/* Window 1: Torneos */}
            <button
              type="button"
              onClick={() => handleNavClick('torneos')}
              className={`w-full flex items-center justify-between p-3 rounded-2xl text-sm transition-all cursor-pointer text-left ${
                activeView === 'torneos'
                  ? 'bg-orange-50 text-[#f15a24] border border-orange-200 font-bold shadow-xs'
                  : 'hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${
                  activeView === 'torneos' ? 'bg-[#f15a24] text-white shadow-2xs' : 'bg-orange-100 text-[#f15a24]'
                }`}>
                  <Gamepad2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="block leading-snug">Torneos de Videojuegos</span>
                  <span className="text-[10px] text-slate-400 block font-normal">Catálogo y fechas</span>
                </div>
              </div>
              {activeView === 'torneos' ? (
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-orange-200/70 text-[#f15a24]">
                  Activa
                </span>
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {/* Window 2: Inscripción */}
            <button
              type="button"
              onClick={() => handleNavClick('registro')}
              className={`w-full flex items-center justify-between p-3 rounded-2xl text-sm transition-all cursor-pointer text-left ${
                activeView === 'registro'
                  ? 'bg-blue-50 text-[#002f6c] border border-blue-200 font-bold shadow-xs'
                  : 'hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${
                  activeView === 'registro' ? 'bg-[#002f6c] text-white shadow-2xs' : 'bg-blue-100 text-[#002f6c]'
                }`}>
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <span className="block leading-snug">Inscripción de Jugadores</span>
                  <span className="text-[10px] text-slate-400 block font-normal">Registro y pase oficial</span>
                </div>
              </div>
              {activeView === 'registro' ? (
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-blue-200/70 text-[#002f6c]">
                  Activa
                </span>
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {/* Window 3: Brackets */}
            <button
              type="button"
              onClick={() => handleNavClick('brackets')}
              className={`w-full flex items-center justify-between p-3 rounded-2xl text-sm transition-all cursor-pointer text-left ${
                activeView === 'brackets'
                  ? 'bg-red-50 text-[#ed1c24] border border-red-200 font-bold shadow-xs'
                  : 'hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${
                  activeView === 'brackets' ? 'bg-[#ed1c24] text-white shadow-2xs' : 'bg-red-100 text-[#ed1c24]'
                }`}>
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <span className="block leading-snug">Llaves y Brackets</span>
                  <span className="text-[10px] text-slate-400 block font-normal">Generador automático</span>
                </div>
              </div>
              {activeView === 'brackets' ? (
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-red-200/70 text-[#ed1c24]">
                  Activa
                </span>
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {/* Window 4: Padrón */}
            <button
              type="button"
              onClick={() => handleNavClick('roster')}
              className={`w-full flex items-center justify-between p-3 rounded-2xl text-sm transition-all cursor-pointer text-left ${
                activeView === 'roster'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold shadow-xs'
                  : 'hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${
                  activeView === 'roster' ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  <IdCard className="w-4 h-4" />
                </div>
                <div>
                  <span className="block leading-snug">Padrón de Jugadores</span>
                  <span className="text-[10px] text-slate-400 block font-normal">Directorio y credenciales</span>
                </div>
              </div>
              {activeView === 'roster' ? (
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-200/70 text-emerald-800">
                  Activa
                </span>
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {/* Window 5: Invitaciones y Enlaces Directos */}
            <button
              type="button"
              onClick={() => handleNavClick('invitaciones')}
              className={`w-full flex items-center justify-between p-3 rounded-2xl text-sm transition-all cursor-pointer text-left ${
                activeView === 'invitaciones'
                  ? 'bg-purple-50 text-purple-900 border border-purple-200 font-bold shadow-xs'
                  : 'hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${
                  activeView === 'invitaciones' ? 'bg-purple-600 text-white shadow-2xs' : 'bg-purple-100 text-purple-700'
                }`}>
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="block leading-snug">Invitaciones y Enlaces</span>
                  <span className="text-[10px] text-slate-400 block font-normal">Códigos y formulario externo</span>
                </div>
              </div>
              {activeView === 'invitaciones' ? (
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-purple-200/70 text-purple-900">
                  Activa
                </span>
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </button>

          </div>

          {/* Institutional Footer inside Sidebar */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-700">
              <School className="w-3.5 h-3.5 text-[#002f6c]" />
              <span>UAT • FIT Tampico</span>
            </div>
            <p className="italic text-slate-600">"{brandConfig.motto}"</p>
            <p className="text-[11px] text-slate-400">Campus Tampico (Centro Universitario Sur)</p>
          </div>

        </div>

        {/* Sidebar Sticky Bottom */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-400">
          <span>ESPORTS FIT UAT</span>
          <button
            onClick={onToggle}
            className="text-[11px] font-semibold text-[#002f6c] hover:underline cursor-pointer"
          >
            Ocultar barra
          </button>
        </div>
      </aside>
    </>
  );
};
