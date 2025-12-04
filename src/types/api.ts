// API Request/Response Types

// Enums and Constants
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export type RSVPStatus =
  | 'IN'
  | 'IN_BEER'
  | 'IN_SUIT'
  | 'OUT'
  | 'OUT_INJURED'
  | 'OUT_BEER'
  | 'MAYBE';
export type MatchdayStatus = 'SCHEDULED' | 'COMPLETED';
export type Team = 'A' | 'B';

export interface RegisterRequest {
  password: string;
  name?: string;
  playerId?: string;
}

export interface RegisterResponse {
  user: {
    id: string;
  };
}

export interface RSVPRequest {
  matchdayId: string;
  status: RSVPStatus;
}

export interface VoteRequest {
  targetId: string;
}

export interface FinishMatchRequest {
  result: string; // Format: "5-4"
  teamAIds: string[];
  teamBIds: string[];
}

export interface CreatePlayerRequest {
  name: string;
}

export interface UpdatePlayerRequest {
  name?: string;
}

export interface CreateSeasonRequest {
  name: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  location: string;
  matchday: string; // e.g., "FRIDAY"
  startHour: string; // e.g., "20:00"
  endHour: string; // e.g., "21:30"
}

export interface UpdateSeasonRequest {
  name?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  matchday?: string;
  startHour?: string;
  endHour?: string;
}

export interface BalanceTeamsResponse {
  teamA: Player[];
  teamB: Player[];
  stats: {
    countA: number;
    countB: number;
  };
}

// Database Model Types

export interface Player {
  id: string;
  name: string;
  matchesPlayed: number;
  goals: number;
  assists: number;
  motmCount: number;
  form: string;
  isActive: boolean;
  userId: string | null;
}

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface Matchday {
  id: string;
  date: Date;
  startTime?: Date;
  endTime?: Date;
  status: MatchdayStatus;
  seasonId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Match {
  id: string;
  matchdayId: string;
  result: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Season {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  location: string;
  matchday: string;
  startHour: string;
  endHour: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RSVP {
  id: string;
  matchdayId: string;
  playerId: string;
  status: RSVPStatus;
}

export interface MatchStat {
  id: string;
  matchId: string;
  playerId: string;
  goals: number;
  assists: number;
  team: Team;
  isMotm: boolean;
}

export interface Vote {
  id: string;
  matchdayId: string;
  voterId: string;
  targetId: string;
}

// Error Response Type

export interface ErrorResponse {
  error: string;
}

// Session Types

export interface SessionUser {
  id: string;
  name?: string | null;
  role: UserRole;
}
