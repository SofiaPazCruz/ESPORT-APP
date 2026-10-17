export interface Game {
  id: string;
  name: string;
  slug: string;
  genre: string;
  accentColor: string;
  badge: string;
  coverImage?: string;
}

export interface Tournament {
  id: number;
  name: string;
  gameId: string;
  gameName: string;
  format: string; // ej. 1v1 Doble Eliminación, 5v5 Suizo
  maxSlots: number;
  currentSlots: number;
  prizePool: string;
  status: 'OPEN' | 'CLOSING_SOON' | 'FULL' | 'IN_PROGRESS' | 'COMPLETED';
  region: string; // LATAM Norte, LATAM Sur, Global
  startDate: string;
  bannerColor: string;
  icon: string;
  inviteCode?: string; // Código único de invitación del torneo (ej. FIT-VAL-101)
  championName?: string;
  runnerUpName?: string;
  completedAt?: string;
}

export interface Participant {
  id: number;
  tournamentId: number;
  tournamentName: string;
  gameName: string;
  gamertag: string;
  email: string;
  studentId?: string; // Matrícula universitaria
  faculty?: string; // Carrera / Facultad
  semester?: string; // Semestre
  discordTag?: string;
  platform: 'PC' | 'PlayStation 5' | 'Xbox Series X/S' | 'Nintendo Switch' | 'Mobile';
  checkInCode: string;
  seedNumber: number;
  registeredAt: string;
  status: 'CONFIRMED' | 'CHECKED_IN' | 'WAITLIST';
  avatarUrl: string;
  emailSent?: boolean;
  emailSentAt?: string;
}

export interface RegistrationFormData {
  tournamentId: number;
  gamertag: string;
  email: string;
  studentId?: string;
  faculty?: string;
  discordTag: string;
  platform: 'PC' | 'PlayStation 5' | 'Xbox Series X/S' | 'Nintendo Switch' | 'Mobile';
  acceptRules: boolean;
}

export interface CreateTournamentFormData {
  name: string;
  gameId: string;
  gameName: string;
  format: string;
  maxSlots: number;
  prizePool: string;
  region: string;
  startDate: string;
  platformRequired?: string;
  rulesSummary?: string;
}

export interface RegistrationApiResult {
  success: boolean;
  statusCode: number; // 201, 400, 409, 422
  message: string;
  participant?: Participant;
  details?: {
    field?: 'gamertag' | 'email' | 'tournamentId';
    code?: 'DUPLICATE_GAMERTAG' | 'DUPLICATE_EMAIL' | 'TOURNAMENT_FULL' | 'INVALID_INPUT';
    remainingSlots?: number;
  };
}
