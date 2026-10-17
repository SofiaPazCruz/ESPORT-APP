export interface BracketPlayer {
  id: string | number;
  gamertag: string;
  seed: number;
  studentId?: string;
  faculty?: string;
  avatarUrl: string;
  isBye?: boolean;
}

export interface BracketMatch {
  id: string;
  roundIndex: number;
  roundName: string;
  matchIndex: number;
  player1: BracketPlayer | null;
  player2: BracketPlayer | null;
  score1: number | null;
  score2: number | null;
  winner: BracketPlayer | null;
  status: 'PENDING' | 'READY' | 'COMPLETED';
  nextMatchId?: string;
  nextMatchSlot?: 'player1' | 'player2';
}

export interface BracketRound {
  roundIndex: number;
  name: string;
  matches: BracketMatch[];
}

export interface TournamentBracket {
  tournamentId: number;
  tournamentName: string;
  gameName: string;
  bracketSize: number; // 4, 8, 16, 32
  rounds: BracketRound[];
  champion: BracketPlayer | null;
  runnerUp: BracketPlayer | null;
  thirdPlace: BracketPlayer | null;
  generatedAt: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';
  completedAt?: string;
  closedReason?: string;
}
