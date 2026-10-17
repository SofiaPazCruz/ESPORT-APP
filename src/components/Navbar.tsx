import React from 'react';
import { UniversityBrandConfig, BRAND_ASSETS } from '../data/universityBrand';
import { Settings, Users, Gamepad2, Upload } from 'lucide-react';

interface NavbarProps {
  participantCount: number;
  brandConfig: UniversityBrandConfig;
  onOpenIdentityModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  participantCount,
  brandConfig,
  onOpenIdentityModal,
}) => {
  const currentUatLogo = brandConfig.customLogoUatUrl || BRAND_ASSETS.uatEscudo;
  const currentFitLogo = brandConfig.customLogoFitUrl || BRAND_ASSETS.fitLogo;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* Zone 1: Official PNG Logos + Title */}
          <div className="flex items-center gap-3 sm:gap-4">
            
            {/* Logos Pair with white background */}
            <div className="flex items-center gap-2.5 shrink-0 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
              
              {/* UAT Logo */}
              <div className="flex items-center justify-center p-1 bg-white rounded-lg border border-slate-100 shadow-2xs h-9 w-9" title="Universidad Autónoma de Tamaulipas (UAT)">
                <img
                  src={currentUatLogo}
                  alt="Escudo Universidad Autónoma de Tamaulipas"
                  className="h-7 w-auto max-w-[34px] object-contain"
                />
              </div>

              <div className="w-[1px] h-6 bg-slate-200" />

              {/* Exact FIT Tampico Logo PNG - Scaled to match UAT */}
              <div className="flex items-center justify-center px-2 py-1 bg-white rounded-lg border border-slate-100 shadow-2xs h-9" title="Facultad de Ingeniería Tampico (FIT - UAT)">
                <img
                  src={currentFitLogo}
                  alt="Facultad de Ingeniería Tampico"
                  className="h-5 sm:h-5.5 w-auto max-w-[85px] sm:max-w-[100px] object-contain"
                />
              </div>
            </div>

            {/* Brand Text */}
            <div>
              <div className="flex items-center gap-2">
                <a href="/" className="text-xl font-bold font-heading text-[#002f6c] tracking-wide hover:text-[#f15a24] transition-colors flex items-center gap-1.5">
                  CASTORES <span className="text-[#f15a24]">SPORTS</span>
                </a>
                <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-red-50 text-[#ed1c24] border border-red-200">
                  <Gamepad2 className="w-3.5 h-3.5" />
                  Torneos FIT UAT
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium hidden sm:block truncate max-w-lg">
                Facultad de Ingeniería Tampico • Universidad Autónoma de Tamaulipas
              </p>
            </div>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="#torneos" className="hover:text-[#002f6c] transition-colors">
              Torneos
            </a>
            <a href="#registro" className="hover:text-[#002f6c] transition-colors">
              Inscripción de Jugadores
            </a>
            <a href="#roster" className="hover:text-[#002f6c] transition-colors">
              Padrón de Jugadores
            </a>
          </nav>

          {/* Zone 3: Actions & Status */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={onOpenIdentityModal}
              className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Ver o cambiar los logotipos de la UAT y FIT"
            >
              <Upload className="w-3.5 h-3.5 text-[#002f6c]" />
              <span className="hidden sm:inline font-semibold">Logos PNG</span>
            </button>

            <div className="px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-[#002f6c] text-xs font-mono font-semibold flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#002f6c]" />
              <span>{participantCount} {participantCount === 1 ? 'Jugador' : 'Jugadores'}</span>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};
