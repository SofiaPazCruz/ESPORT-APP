import React, { useState } from 'react';
import { UniversityBrandConfig, BRAND_ASSETS, UNIVERSITY_FACULTIES } from '../data/universityBrand';
import { Shield, Sparkles, X, Upload, Check, RefreshCw, School, Award, FileImage } from 'lucide-react';

interface UniversityIdentityModalProps {
  isOpen: boolean;
  onClose: () => void;
  brandConfig: UniversityBrandConfig;
  onSaveBrandConfig: (newConfig: UniversityBrandConfig) => void;
}

export const UniversityIdentityModal: React.FC<UniversityIdentityModalProps> = ({
  isOpen,
  onClose,
  brandConfig,
  onSaveBrandConfig,
}) => {
  const [institutionName, setInstitutionName] = useState(brandConfig.institutionName);
  const [facultyName, setFacultyName] = useState(brandConfig.facultyName);
  const [campusName, setCampusName] = useState(brandConfig.campusName);
  const [customUatUrl, setCustomUatUrl] = useState(brandConfig.customLogoUatUrl);
  const [customFitUrl, setCustomFitUrl] = useState(brandConfig.customLogoFitUrl);

  if (!isOpen) return null;

  const handleUatFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        setCustomUatUrl(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFitFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        setCustomFitUrl(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    onSaveBrandConfig({
      ...brandConfig,
      institutionName: institutionName.trim() || 'Universidad Autónoma de Tamaulipas',
      facultyName: facultyName.trim() || 'Facultad de Ingeniería Tampico',
      campusName: campusName.trim() || 'Campus Tampico (Centro Universitario Sur)',
      customLogoUatUrl: customUatUrl.trim(),
      customLogoFitUrl: customFitUrl.trim(),
    });
    onClose();
  };

  const handleResetDefaults = () => {
    setInstitutionName('Universidad Autónoma de Tamaulipas');
    setFacultyName('Facultad de Ingeniería Tampico');
    setCampusName('Campus Tampico (Centro Universitario Sur)');
    setCustomUatUrl('');
    setCustomFitUrl('');
  };

  const currentUatDisplay = customUatUrl || BRAND_ASSETS.uatEscudo;
  const currentFitDisplay = customFitUrl || BRAND_ASSETS.fitLogo;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in text-slate-900">
      <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header on White */}
        <div className="flex items-center justify-between p-6 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 p-1 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <img 
                src={currentUatDisplay} 
                alt="UAT" 
                className="h-8 w-auto max-w-[36px] object-contain" 
              />
              <div className="w-[1px] h-6 bg-slate-200" />
              <img 
                src={currentFitDisplay} 
                alt="FIT UAT" 
                className="h-6 w-auto max-w-[85px] object-contain" 
              />
            </div>
            <div>
              <h3 className="text-lg font-bold font-heading text-[#002f6c]">
                Logotipos PNG Oficiales
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                Universidad Autónoma de Tamaulipas • Facultad de Ingeniería Tampico
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content on White */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          <div className="text-xs text-slate-600 leading-relaxed bg-blue-50/70 p-3.5 rounded-xl border border-blue-200">
            Aquí puedes ver los logotipos oficiales en formato <strong>PNG</strong> que se muestran en el encabezado, hero y pases de jugador. Si cuentas con archivos PNG específicos de tu facultad, puedes subirlos directamente aquí.
          </div>

          {/* Cards for the two PNG logos */}
          <div className="space-y-4">
            
            {/* 1. UAT Logo Box */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-[#002f6c]">1. Logo Universidad Autónoma de Tamaulipas (UAT)</h4>
                  <p className="text-xs text-slate-500 font-mono">Escudo oficial institucional en formato PNG</p>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-2xs">
                  <img src={currentUatDisplay} alt="UAT" className="h-9 w-auto max-w-[42px] object-contain" />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  value={customUatUrl}
                  onChange={(e) => setCustomUatUrl(e.target.value)}
                  placeholder="URL del archivo PNG de la UAT..."
                  className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#002f6c]"
                />
                <label className="px-3 py-2 bg-white hover:bg-slate-100 rounded-lg border border-slate-300 text-xs font-mono text-slate-700 cursor-pointer flex items-center justify-center gap-1.5 shrink-0 transition-colors shadow-2xs font-semibold">
                  <Upload className="w-3.5 h-3.5 text-[#002f6c]" />
                  <span>Subir PNG UAT</span>
                  <input type="file" accept="image/png,image/*" onChange={handleUatFileUpload} className="hidden" />
                </label>
              </div>
            </div>

            {/* 2. FIT Logo Box */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-[#f15a24]">2. Logo Facultad de Ingeniería Tampico (FIT)</h4>
                  <p className="text-xs text-slate-500 font-mono">Logotipo oficial de la FIT en formato PNG</p>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-2xs">
                  <img src={currentFitDisplay} alt="FIT UAT" className="h-7 w-auto max-w-[105px] object-contain" />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  value={customFitUrl}
                  onChange={(e) => setCustomFitUrl(e.target.value)}
                  placeholder="URL del archivo PNG de la FIT..."
                  className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#f15a24]"
                />
                <label className="px-3 py-2 bg-white hover:bg-slate-100 rounded-lg border border-slate-300 text-xs font-mono text-slate-700 cursor-pointer flex items-center justify-center gap-1.5 shrink-0 transition-colors shadow-2xs font-semibold">
                  <Upload className="w-3.5 h-3.5 text-[#f15a24]" />
                  <span>Subir PNG FIT</span>
                  <input type="file" accept="image/png,image/*" onChange={handleFitFileUpload} className="hidden" />
                </label>
              </div>
            </div>

          </div>

          {/* Institutional Info */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-600 font-semibold mb-1">
                Universidad
              </label>
              <input
                type="text"
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#002f6c]/30"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-600 font-semibold mb-1">
                Facultad
              </label>
              <input
                type="text"
                value={facultyName}
                onChange={(e) => setFacultyName(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#002f6c]/30"
              />
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="text-xs font-mono text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Restablecer Predeterminados</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-mono text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-mono font-bold text-white bg-[#002f6c] hover:bg-[#002352] rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Guardar Cambios</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
