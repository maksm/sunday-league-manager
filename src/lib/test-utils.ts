import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import type { Session } from 'next-auth';

// Mock Prisma Client
export const prismaMock = mockDeep<PrismaClient>() as unknown as DeepMockProxy<PrismaClient>;

// Reset mocks between tests
beforeEach(() => {
  mockReset(prismaMock);
});

// Mock NextAuth Session
export function createMockSession(overrides?: Partial<Session>): Session {
  return {
    user: {
      id: 'test-user-id',

      name: 'Test User',
      role: 'USER',
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    ...overrides,
  };
}

export function createMockAdminSession(): Session {
  return createMockSession({
    user: {
      id: 'admin-user-id',

      name: 'Admin User',
      role: 'ADMIN',
    },
  });
}

// Test Data Factories
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createMockUser(overrides?: Partial<any>) {
  return {
    id: 'user-1',

    username: 'testuser',
    passwordHash: '$2a$12$hashedpassword',
    role: 'USER',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createMockPlayer(overrides?: Partial<any>) {
  return {
    id: 'player-1',
    name: 'Test Player',
    eloRating: 1200,
    matchesPlayed: 0,
    goals: 0,
    assists: 0,
    motmCount: 0,
    form: '',
    userId: null,
    ...overrides,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createMockGame(overrides?: Partial<any>) {
  return {
    id: 'game-1',
    date: new Date(),
    status: 'SCHEDULED',
    result: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createMockRSVP(overrides?: Partial<any>) {
  return {
    id: 'rsvp-1',
    gameId: 'game-1',
    playerId: 'player-1',
    status: 'IN',
    ...overrides,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createMockVote(overrides?: Partial<any>) {
  return {
    id: 'vote-1',
    gameId: 'game-1',
    voterId: 'player-1',
    targetId: 'player-2',
    ...overrides,
  };
}

// API Testing Helpers
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function mockRequest(method: string, url: string, body?: any): Promise<Request> {
  return new Request(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function parseJsonResponse(response: Response) {
  return await response.json();
}

// Mock getServerSession
export function mockGetServerSession(session: Session | null) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getServerSession } = require('next-auth');
  (getServerSession as jest.Mock).mockResolvedValue(session);
}
