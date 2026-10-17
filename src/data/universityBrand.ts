// Identidad Oficial de la Universidad Autónoma de Tamaulipas (UAT) y Facultad de Ingeniería Tampico (FIT)
// Logotipos oficiales en formato PNG con fondo transparente

import uatEscudoPng from '@/src/assets/images/uat_escudo_oficial.png';
import uatInstitucionalPng from '@/src/assets/images/uat_institucional.png';
import fitLogoPng from '@/src/assets/images/fit_logo_oficial.png';

export interface UniversityBrandConfig {
  institutionName: string;
  facultyName: string;
  departmentName: string;
  teamName: string;
  motto: string;
  submotto: string;
  logoDisplayMode: 'both' | 'fit' | 'uat' | 'custom';
  customLogoUatUrl: string;
  customLogoFitUrl: string;
  campusName: string;
  officialColors: {
    navyUat: string;
    redFit: string;
    orangeUat: string;
    white: string;
  };
}

export const DEFAULT_UNIVERSITY_BRAND: UniversityBrandConfig = {
  institutionName: 'Universidad Autónoma de Tamaulipas',
  facultyName: 'Facultad de Ingeniería Tampico',
  departmentName: 'Comité de Videojuegos y Convivencia Estudiantil FIT',
  teamName: 'ESPORTS',
  motto: 'Verdad, Belleza, Probidad',
  submotto: 'Facultad de Ingeniería Tampico · UAT',
  logoDisplayMode: 'both',
  customLogoUatUrl: '',
  customLogoFitUrl: '',
  campusName: 'Campus Tampico (Centro Universitario Sur)',
  officialColors: {
    navyUat: '#002f6c',
    redFit: '#ed1c24',
    orangeUat: '#f15a24',
    white: '#ffffff',
  }
};

export const UNIVERSITY_FACULTIES = [
  'Ingeniería en Sistemas Computacionales (FIT - UAT)',
  'Ingeniería Telemática / Software (FIT - UAT)',
  'Ingeniería Civil (FIT - UAT)',
  'Ingeniería Industrial (FIT - UAT)',
  'Ingeniería en Geomática (FIT - UAT)',
  'Posgrado en Ingeniería (FIT - UAT)',
  'Comunidad UAT Tampico (Otras Facultades)',
];

export const BRAND_ASSETS = {
  uatEscudo: uatEscudoPng,
  uatInstitucional: uatInstitucionalPng,
  fitLogo: fitLogoPng,
};

const STORAGE_KEY = 'esports_fit_uat_sidebar_v5';

export const loadUniversityBrand = (): UniversityBrandConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_UNIVERSITY_BRAND;
    return { ...DEFAULT_UNIVERSITY_BRAND, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_UNIVERSITY_BRAND;
  }
};

export const saveUniversityBrand = (config: UniversityBrandConfig): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // Ignore storage failure
  }
};
