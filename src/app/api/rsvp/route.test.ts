// Mock auth route before importing
jest.mock('@/app/api/auth/[...nextauth]/route', () => ({
  authOptions: {},
}));

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    matchday: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    rSVP: {
      upsert: jest.fn(),
    },
  },
}));

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

import { POST } from './route';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';

jest.mock('@/lib/auth-helpers', () => ({
  requireAuth: jest.fn(),
  getPlayerFromSession: jest.fn(),
  errorResponse: (msg: string, status: number) => NextResponse.json({ error: msg }, { status }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  successResponse: (data: any) => NextResponse.json(data),
}));

describe('POST /api/rsvp', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (requireAuth as jest.Mock).mockResolvedValue({ success: true, user: { id: 'user-1' } });
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getPlayerFromSession } = require('@/lib/auth-helpers');
    getPlayerFromSession.mockResolvedValue({ success: true, player: { id: 'player-1' } });
  });

  it('should create RSVP successfully', async () => {
    const mockRSVP = {
      id: 'rsvp-1',
      matchdayId: 'matchday-1',
      playerId: 'player-1',
      status: 'IN',
    };

    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-1' },
    });
    (prisma.matchday.findUnique as jest.Mock).mockResolvedValue({
      id: 'matchday-1',
      status: 'SCHEDULED',
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      player: { id: 'player-1', isActive: true },
    });
    (prisma.rSVP.upsert as jest.Mock).mockResolvedValue(mockRSVP);

    const request = new Request('http://localhost:3000/api/rsvp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        matchdayId: 'matchday-1',
        status: 'IN',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockRSVP);
  });

  it('should update existing RSVP', async () => {
    const mockRSVP = {
      id: 'rsvp-1',
      matchdayId: 'matchday-1',
      playerId: 'player-1',
      status: 'OUT',
    };

    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-1' },
    });
    (prisma.matchday.findUnique as jest.Mock).mockResolvedValue({
      id: 'matchday-1',
      status: 'SCHEDULED',
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      player: { id: 'player-1', isActive: true },
    });
    (prisma.rSVP.upsert as jest.Mock).mockResolvedValue(mockRSVP);

    const request = new Request('http://localhost:3000/api/rsvp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        matchdayId: 'matchday-1',
        status: 'OUT',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('OUT');
  });

  it('should reject RSVP for non-existent matchday', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-1' },
    });
    (prisma.matchday.findUnique as jest.Mock).mockResolvedValue(null);

    const request = new Request('http://localhost:3000/api/rsvp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        matchdayId: 'matchday-1',
        status: 'IN',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Matchday not found');
  });

  it('should reject RSVP for finished matchday', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-1' },
    });
    (prisma.matchday.findUnique as jest.Mock).mockResolvedValue({
      id: 'matchday-1',
      status: 'COMPLETED',
    });

    const request = new Request('http://localhost:3000/api/rsvp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        matchdayId: 'matchday-1',
        status: 'IN',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('finished matchday');
  });

  it('should reject invalid status', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-1' },
    });

    const request = new Request('http://localhost:3000/api/rsvp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        matchdayId: 'matchday-1',
        status: 'INVALID',
      }),
    });

    const response = await POST(request);
    await response.json();

    expect(response.status).toBe(400);
  });

  it('should reject unauthenticated requests', async () => {
    (requireAuth as jest.Mock).mockResolvedValue({
      success: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    });
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const request = new Request('http://localhost:3000/api/rsvp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        matchdayId: 'matchday-1',
        status: 'IN',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should reject user without player profile', async () => {
    (requireAuth as jest.Mock).mockResolvedValue({
      success: true,
      user: { id: 'user-1' },
    });
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getPlayerFromSession } = require('@/lib/auth-helpers');
    getPlayerFromSession.mockResolvedValue({
      success: false,
      response: NextResponse.json({ error: 'Player profile not found' }, { status: 404 }),
    });

    (prisma.matchday.findUnique as jest.Mock).mockResolvedValue({
      id: 'matchday-1',
      status: 'SCHEDULED',
    });
    // Removed prisma.user.findUnique mock as it's not used directly if getPlayerFromSession handles it or is mocked
    // But wait, getPlayerFromSession implementation usually calls prisma.user.findUnique.
    // Since we mock getPlayerFromSession, we don't need to mock prisma.user.findUnique for this specific check unless the route calls it separately.
    // The route calls getPlayerFromSession.

    const request = new Request('http://localhost:3000/api/rsvp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        matchdayId: 'matchday-1',
        status: 'IN',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toContain('Player profile');
  });
});
