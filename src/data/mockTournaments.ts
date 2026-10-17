import { Game, Tournament, Participant } from '../types/tournament';

export const INITIAL_GAMES: Game[] = [
  {
    id: 'valorant',
    name: 'Valorant',
    slug: 'valorant',
    genre: 'Tactical FPS 5v5',
    accentColor: '#f43f5e',
    badge: 'FPS',
  },
  {
    id: 'lol',
    name: 'League of Legends',
    slug: 'lol',
    genre: 'MOBA 5v5',
    accentColor: '#0ea5e9',
    badge: 'MOBA',
  },
  {
    id: 'smash',
    name: 'Super Smash Bros. Ultimate',
    slug: 'smash',
    genre: 'Fighting 1v1',
    accentColor: '#f59e0b',
    badge: 'FIGHTING',
  },
  {
    id: 'rl',
    name: 'Rocket League',
    slug: 'rl',
    genre: 'Vehicular Soccer 3v3 / 1v1',
    accentColor: '#3b82f6',
    badge: 'SPORTS',
  },
  {
    id: 'eafc',
    name: 'EA Sports FC 24',
    slug: 'eafc',
    genre: 'Football Simulation 1v1',
    accentColor: '#10b981',
    badge: 'SOCCER',
  }
];

// Completely clean empty array for a 100% fresh, first-time user experience
export const INITIAL_TOURNAMENTS: Tournament[] = [];

// Completely clean empty array for registered participants
export const INITIAL_PARTICIPANTS: Participant[] = [];
