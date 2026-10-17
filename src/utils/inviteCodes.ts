import { Tournament } from '../types/tournament';

/**
 * Standardize or retrieve the unique invitation code for a tournament.
 */
export function getTournamentInviteCode(tournament: Tournament): string {
  if (tournament.inviteCode && tournament.inviteCode.trim().length > 0) {
    return tournament.inviteCode.toUpperCase();
  }
  const cleanGame = (tournament.gameId || 'GAME').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
  return `FIT-${cleanGame}-${tournament.id}`;
}

/**
 * Normalizes an invitation code by stripping whitespace, hyphens, and converting to uppercase.
 */
export function normalizeCode(raw: string): string {
  return (raw || '').trim().toUpperCase().replace(/[\s\-_]/g, '');
}

/**
 * Verifies if an entered code corresponds to a video game tournament.
 * Automatically verifies:
 * 1. Exact match (e.g. "FIT-VAL-101")
 * 2. Case-insensitive / no-hyphens match (e.g. "fitval101")
 * 3. Game shorthand + ID (e.g. "VAL-101" or "VALORANT")
 * 4. Numeric ID match (e.g. "101")
 */
export function verifyTournamentCode(
  inputCode: string,
  tournaments: Tournament[]
): {
  isValid: boolean;
  tournament?: Tournament;
  verifiedGameName?: string;
  matchType?: 'exact' | 'normalized' | 'game' | 'id';
} {
  const trimmed = (inputCode || '').trim().toUpperCase();
  if (!trimmed) {
    return { isValid: false };
  }

  const cleanInput = normalizeCode(trimmed);

  // 1. Exact or canonical code match
  for (const t of tournaments) {
    const code = getTournamentInviteCode(t);
    if (code === trimmed) {
      return {
        isValid: true,
        tournament: t,
        verifiedGameName: t.gameName,
        matchType: 'exact',
      };
    }
  }

  // 2. Normalized match without hyphens (e.g. "FITVAL101")
  for (const t of tournaments) {
    const codeNormalized = normalizeCode(getTournamentInviteCode(t));
    if (codeNormalized === cleanInput) {
      return {
        isValid: true,
        tournament: t,
        verifiedGameName: t.gameName,
        matchType: 'normalized',
      };
    }
  }

  // 3. Match by ID or gameId + id
  for (const t of tournaments) {
    if (cleanInput === String(t.id) || cleanInput.endsWith(String(t.id))) {
      return {
        isValid: true,
        tournament: t,
        verifiedGameName: t.gameName,
        matchType: 'id',
      };
    }
  }

  // 4. Flexible match by game keyword if unique
  const matchingGames = tournaments.filter(t => {
    const gSlug = normalizeCode(t.gameId);
    const gName = normalizeCode(t.gameName);
    return cleanInput.length >= 3 && (cleanInput === gSlug || cleanInput === gName || gSlug.includes(cleanInput));
  });

  if (matchingGames.length === 1) {
    const matched = matchingGames[0];
    return {
      isValid: true,
      tournament: matched,
      verifiedGameName: matched.gameName,
      matchType: 'game',
    };
  }

  return { isValid: false };
}

/**
 * Builds the direct URL for a player to open the standalone registration window.
 */
export function buildInviteUrl(code: string): string {
  try {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    return `${origin}${pathname}?join=${encodeURIComponent(code)}`;
  } catch {
    return `/?join=${encodeURIComponent(code)}`;
  }
}

/**
 * Builds the general standalone player portal URL.
 */
export function buildGeneralPortalUrl(): string {
  try {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    return `${origin}${pathname}?view=portal-jugador`;
  } catch {
    return `/?view=portal-jugador`;
  }
}
