// Mock auth route before importing
jest.mock('@/app/api/auth/[...nextauth]/route', () => ({
  authOptions: {},
}));

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    match: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    matchday: {
      update: jest.fn(),
    },
    player: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

import { POST } from './route';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-helpers';

jest.mock('@/lib/auth-helpers', () => ({
  requireAdmin: jest.fn(),
  errorResponse: (msg: string, status: number) => NextResponse.json({ error: msg }, { status }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  successResponse: (data: any) => NextResponse.json(data),
}));

describe('POST /api/matches/[id]/finish', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (requireAdmin as jest.Mock).mockResolvedValue({ success: true, user: { id: 'user-1' } });
  });

  it('should finish match and update player stats successfully', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-1' },
    });
    (prisma.match.findUnique as jest.Mock).mockResolvedValue({
      id: 'match-1',
      matchdayId: 'matchday-1',
      result: null,
    });

    (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
      const tx = {
        match: {
          update: jest.fn().mockResolvedValue({ id: 'match-1', result: '5-3' }),
        },
        matchday: {
          update: jest.fn(),
        },
        player: {
          findMany: jest.fn().mockResolvedValue([
            { id: 'player-1', form: 'W,L' },
            { id: 'player-2', form: '' },
          ]),
          update: jest.fn(),
        },
      };
      return callback(tx);
    });

    const request = new Request('http://localhost:3000/api/matches/match-1/finish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        result: '5-3',
        teamAIds: ['player-1', 'player-2'],
        teamBIds: ['player-3'],
      }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: 'match-1' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('should reject finishing already finished match', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-1' },
    });
    (prisma.match.findUnique as jest.Mock).mockResolvedValue({
      id: 'match-1',
      result: '5-3',
    });

    const request = new Request('http://localhost:3000/api/matches/match-1/finish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        result: '5-3',
        teamAIds: ['player-1'],
        teamBIds: ['player-2'],
      }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: 'match-1' }) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('already finished');
  });

  it('should reject invalid result format', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-1' },
    });

    const request = new Request('http://localhost:3000/api/matches/match-1/finish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        result: 'invalid',
        teamAIds: ['player-1'],
        teamBIds: ['player-2'],
      }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: 'match-1' }) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('format');
  });

  it('should reject empty teams', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-1' },
    });

    const request = new Request('http://localhost:3000/api/matches/match-1/finish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        result: '5-3',
        teamAIds: [],
        teamBIds: ['player-2'],
      }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: 'match-1' }) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('at least one player');
  });

  it('should reject non-existent match', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-1' },
    });
    (prisma.match.findUnique as jest.Mock).mockResolvedValue(null);

    const request = new Request('http://localhost:3000/api/matches/match-1/finish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        result: '5-3',
        teamAIds: ['player-1'],
        teamBIds: ['player-2'],
      }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: 'match-1' }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Match not found');
  });
});
