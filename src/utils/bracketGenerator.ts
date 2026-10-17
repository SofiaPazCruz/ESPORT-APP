import { Participant, Tournament } from '../types/tournament';
import { TournamentBracket, BracketRound, BracketMatch, BracketPlayer } from '../types/bracket';

// Standard competitive bracket seeding arrays
// For size 2: [1, 2] -> Gran Final Directa
const SEED_ORDER_2: [number, number][] = [
  [1, 2],
];

// For size 4:
const SEED_ORDER_4: [number, number][] = [
  [1, 4],
  [2, 3],
];

// For size 8: [1,8], [4,5], [2,7], [3,6]
const SEED_ORDER_8: [number, number][] = [
  [1, 8],
  [4, 5],
  [2, 7],
  [3, 6],
];

// For size 16:
const SEED_ORDER_16: [number, number][] = [
  [1, 16],
  [8, 9],
  [4, 13],
  [5, 12],
  [2, 15],
  [7, 10],
  [3, 14],
  [6, 11],
];

export const getRoundName = (roundIndex: number, totalRounds: number): string => {
  const fromEnd = totalRounds - roundIndex;
  if (fromEnd === 1) return 'Gran Final';
  if (fromEnd === 2) return 'Semifinales';
  if (fromEnd === 3) return 'Cuartos de Final';
  if (fromEnd === 4) return 'Octavos de Final';
  if (fromEnd === 5) return 'Dieciseisavos de Final';
  return `Ronda ${roundIndex + 1}`;
};

export const generateAutomaticBracket = (
  tournament: Tournament,
  registeredParticipants: Participant[],
  preferredSize?: number,
  _fillWithCollegiatePool: boolean = false
): TournamentBracket => {
  // Determine appropriate bracket size (2, 4, 8, 16)
  const actualCount = registeredParticipants.length;
  let bracketSize = preferredSize || 8;

  if (!preferredSize) {
    if (actualCount <= 2 && actualCount > 0) bracketSize = 2;
    else if (actualCount <= 4) bracketSize = 4;
    else if (actualCount <= 8) bracketSize = 8;
    else bracketSize = 16;
  }

  // Build the list of players ordered by seed (ONLY REAL PLAYERS)
  const players: BracketPlayer[] = [];

  // 1. Add registered participants
  registeredParticipants.forEach((p, idx) => {
    players.push({
      id: p.id,
      gamertag: p.gamertag,
      seed: idx + 1,
      studentId: p.studentId,
      faculty: p.faculty,
      avatarUrl: p.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(p.gamertag)}&backgroundColor=002f6c`,
      isBye: false,
    });
  });

  // 2. Fill remaining unfilled slots with BYE (Pase Libre), never simulated students
  while (players.length < bracketSize) {
    const nextSeed = players.length + 1;
    players.push({
      id: `bye-${nextSeed}`,
      gamertag: 'Pase Libre (BYE)',
      seed: nextSeed,
      avatarUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=bye',
      isBye: true,
    });
  }

  // Create pairing list based on standard competitive seeding
  let seedPairs: [number, number][] = [];
  if (bracketSize === 2) seedPairs = SEED_ORDER_2;
  else if (bracketSize === 4) seedPairs = SEED_ORDER_4;
  else if (bracketSize === 8) seedPairs = SEED_ORDER_8;
  else seedPairs = SEED_ORDER_16;

  const totalRounds = Math.log2(bracketSize);
  const rounds: BracketRound[] = [];

  // Generate blank tree structure
  for (let r = 0; r < totalRounds; r++) {
    const matchCount = bracketSize / Math.pow(2, r + 1);
    const roundMatches: BracketMatch[] = [];

    for (let m = 0; m < matchCount; m++) {
      const matchId = `r${r}-m${m}`;
      const nextMatchId = r < totalRounds - 1 ? `r${r + 1}-m${Math.floor(m / 2)}` : undefined;
      const nextMatchSlot = m % 2 === 0 ? 'player1' : 'player2';

      roundMatches.push({
        id: matchId,
        roundIndex: r,
        roundName: getRoundName(r, totalRounds),
        matchIndex: m,
        player1: null,
        player2: null,
        score1: null,
        score2: null,
        winner: null,
        status: 'PENDING',
        nextMatchId,
        nextMatchSlot,
      });
    }

    rounds.push({
      roundIndex: r,
      name: getRoundName(r, totalRounds),
      matches: roundMatches,
    });
  }

  // Populate Round 1 with the seed pairs
  const round1 = rounds[0];
  seedPairs.forEach(([s1, s2], idx) => {
    if (round1.matches[idx]) {
      const p1 = players.find(p => p.seed === s1) || null;
      const p2 = players.find(p => p.seed === s2) || null;

      round1.matches[idx].player1 = p1;
      round1.matches[idx].player2 = p2;
      round1.matches[idx].status = p1 && p2 ? 'READY' : 'PENDING';

      // Auto-advance if one is a BYE
      if (p1 && p2?.isBye) {
        round1.matches[idx].winner = p1;
        round1.matches[idx].score1 = 2;
        round1.matches[idx].score2 = 0;
        round1.matches[idx].status = 'COMPLETED';
      } else if (p2 && p1?.isBye) {
        round1.matches[idx].winner = p2;
        round1.matches[idx].score1 = 0;
        round1.matches[idx].score2 = 2;
        round1.matches[idx].status = 'COMPLETED';
      }
    }
  });

  // Advance any auto-completed byes to Round 2
  round1.matches.forEach(m => {
    if (m.winner && m.nextMatchId && m.nextMatchSlot) {
      const nextRound = rounds[1];
      const targetMatch = nextRound?.matches.find(nm => nm.id === m.nextMatchId);
      if (targetMatch) {
        if (m.nextMatchSlot === 'player1') targetMatch.player1 = m.winner;
        else targetMatch.player2 = m.winner;

        if (targetMatch.player1 && targetMatch.player2) {
          targetMatch.status = 'READY';
        }
      }
    }
  });

  return {
    tournamentId: tournament.id,
    tournamentName: tournament.name,
    gameName: tournament.gameName,
    bracketSize,
    rounds,
    champion: null,
    runnerUp: null,
    thirdPlace: null,
    status: 'OPEN',
    generatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
};

export const isTournamentPassed = (tournament: Tournament): boolean => {
  if (tournament.status === 'COMPLETED') return true;
  if (!tournament.startDate) return false;
  try {
    const formatted = tournament.startDate.replace(' ', 'T');
    const tourneyDate = new Date(formatted);
    if (!isNaN(tourneyDate.getTime())) {
      return tourneyDate.getTime() <= Date.now();
    }
  } catch {
    // fallback
  }
  return false;
};

export interface BracketProgress {
  totalMatches: number;
  completedMatches: number;
  percentage: number;
  isCompleted: boolean;
  currentRoundName: string;
  activeRoundIndex: number;
  allRoundsCount: number;
}

export const getBracketProgress = (bracket: TournamentBracket): BracketProgress => {
  let totalMatches = 0;
  let completedMatches = 0;
  let activeRoundIndex = 0;
  let currentRoundName = bracket.rounds[0]?.name || 'Ronda 1';

  for (let i = 0; i < bracket.rounds.length; i++) {
    const round = bracket.rounds[i];
    totalMatches += round.matches.length;
    const roundCompleted = round.matches.filter(m => m.status === 'COMPLETED').length;
    completedMatches += roundCompleted;

    if (roundCompleted < round.matches.length && activeRoundIndex === 0) {
      activeRoundIndex = i;
      currentRoundName = round.name;
    }
  }

  const isCompleted = bracket.status === 'COMPLETED' || (totalMatches > 0 && completedMatches >= totalMatches);
  const percentage = totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0;

  if (isCompleted) {
    currentRoundName = 'Torneo Concluido';
    activeRoundIndex = bracket.rounds.length - 1;
  }

  return {
    totalMatches,
    completedMatches,
    percentage,
    isCompleted,
    currentRoundName,
    activeRoundIndex,
    allRoundsCount: bracket.rounds.length,
  };
};

export const advanceMatchWinner = (
  bracket: TournamentBracket,
  matchId: string,
  winnerId: string | number,
  customScore1?: number,
  customScore2?: number
): TournamentBracket => {
  // Deep clone bracket
  const newRounds: BracketRound[] = JSON.parse(JSON.stringify(bracket.rounds));
  let updatedChampion: BracketPlayer | null = bracket.champion;
  let updatedRunnerUp: BracketPlayer | null = bracket.runnerUp;

  // Find the match
  for (let rIdx = 0; rIdx < newRounds.length; rIdx++) {
    const round = newRounds[rIdx];
    const match = round.matches.find(m => m.id === matchId);

    if (match) {
      const winner = match.player1?.id === winnerId ? match.player1 : match.player2?.id === winnerId ? match.player2 : null;
      const loser = match.player1?.id === winnerId ? match.player2 : match.player1;

      if (!winner) return bracket;

      // Realistic video game match score (Best of 3 or Best of 5)
      const isGrandFinal = rIdx === newRounds.length - 1;
      const winScore = isGrandFinal ? 3 : 2;
      const loseScore = isGrandFinal ? Math.floor(Math.random() * 2) : Math.floor(Math.random() * (winScore - 1));

      match.winner = winner;
      match.score1 = customScore1 !== undefined 
        ? customScore1 
        : (match.player1?.id === winnerId ? winScore : loseScore);
      match.score2 = customScore2 !== undefined 
        ? customScore2 
        : (match.player2?.id === winnerId ? winScore : loseScore);
      match.status = 'COMPLETED';

      // If there is a next match, advance winner
      if (match.nextMatchId && match.nextMatchSlot && rIdx + 1 < newRounds.length) {
        const nextRound = newRounds[rIdx + 1];
        const nextMatch = nextRound.matches.find(nm => nm.id === match.nextMatchId);

        if (nextMatch) {
          if (match.nextMatchSlot === 'player1') {
            nextMatch.player1 = winner;
          } else {
            nextMatch.player2 = winner;
          }

          if (nextMatch.player1 && nextMatch.player2) {
            nextMatch.status = 'READY';
          }
        }
      } else if (isGrandFinal) {
        // Tournament completed and closed!
        updatedChampion = winner;
        updatedRunnerUp = loser;
      }

      break;
    }
  }

  // Calculate if now completed
  let allMatchesCompleted = true;
  for (const r of newRounds) {
    for (const m of r.matches) {
      if (m.status !== 'COMPLETED') {
        allMatchesCompleted = false;
        break;
      }
    }
    if (!allMatchesCompleted) break;
  }

  const isClosed = allMatchesCompleted && updatedChampion !== null;

  return {
    ...bracket,
    rounds: newRounds,
    champion: updatedChampion,
    runnerUp: updatedRunnerUp,
    status: isClosed ? 'COMPLETED' : 'IN_PROGRESS',
    completedAt: isClosed ? (bracket.completedAt || new Date().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })) : undefined,
  };
};

/**
 * Advances the active round by resolving and closing all currently ready matches
 */
export const advanceNextRound = (bracket: TournamentBracket): TournamentBracket => {
  let current: TournamentBracket = JSON.parse(JSON.stringify(bracket));

  // Find the first round with ready matches that are not completed
  for (let rIdx = 0; rIdx < current.rounds.length; rIdx++) {
    const round = current.rounds[rIdx];
    const readyMatches = round.matches.filter(m => m.status === 'READY' && m.player1 && m.player2);

    if (readyMatches.length > 0) {
      // Resolve all ready matches in this round
      for (const match of readyMatches) {
        if (!match.player1 || !match.player2) continue;
        const p1Weight = 1 / (match.player1.seed || 1);
        const p2Weight = 1 / (match.player2.seed || 1);
        const totalWeight = p1Weight + p2Weight;
        const winner = Math.random() < (p1Weight / totalWeight) ? match.player1 : match.player2;

        current = advanceMatchWinner(current, match.id, winner.id);
      }
      return current;
    }
  }

  return current;
};

export const simulateEntireBracket = (bracket: TournamentBracket): TournamentBracket => {
  let current = JSON.parse(JSON.stringify(bracket)) as TournamentBracket;

  for (let rIdx = 0; rIdx < current.rounds.length; rIdx++) {
    const round = current.rounds[rIdx];
    for (let mIdx = 0; mIdx < round.matches.length; mIdx++) {
      const match = round.matches[mIdx];
      if (match.status !== 'COMPLETED' && match.player1 && match.player2) {
        // Randomly pick winner with slight seed weight
        const p1Weight = 1 / (match.player1.seed || 1);
        const p2Weight = 1 / (match.player2.seed || 1);
        const totalWeight = p1Weight + p2Weight;
        const winner = Math.random() < (p1Weight / totalWeight) ? match.player1 : match.player2;

        current = advanceMatchWinner(current, match.id, winner.id);
      }
    }
  }

  // Ensure status is marked as COMPLETED and timestamped
  current.status = 'COMPLETED';
  current.completedAt = new Date().toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' });
  return current;
};

/**
 * Generates a pre-completed and closed bracket for tournaments that have already passed
 */
export const generatePrecompletedBracket = (
  tournament: Tournament,
  registeredParticipants: Participant[],
  preferredSize: number = 8
): TournamentBracket => {
  const fresh = generateAutomaticBracket(tournament, registeredParticipants, preferredSize, false);
  const completed = simulateEntireBracket(fresh);
  completed.status = 'COMPLETED';
  completed.completedAt = tournament.startDate || 'Finalizado';
  completed.closedReason = 'Torneo finalizado según calendario oficial FIT UAT';
  return completed;
};
