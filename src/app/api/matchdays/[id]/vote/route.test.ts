import { POST } from './route';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';
import { NextResponse } from 'next/server';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    matchday: {
      findUnique: jest.fn(),
    },
    vote: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    player: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('@/lib/auth-helpers', () => ({
  requireAuth: jest.fn(),
  getPlayerFromSession: jest.fn(),
  errorResponse: (msg: string, status: number) => NextResponse.json({ error: msg }, { status }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  successResponse: (data: any) => NextResponse.json(data),
}));

jest.mock('../../../auth/[...nextauth]/route', () => ({
  authOptions: {},
}));

describe('Matchday Vote API', () => {
  const mockMatchdayId = 'matchday-1';
  const mockParams = Promise.resolve({ id: mockMatchdayId });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    (requireAuth as jest.Mock).mockResolvedValue({
      success: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    });

    const req = new Request(`http://localhost/api/matchdays/${mockMatchdayId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ targetId: 'p2' }),
    });

    const res = await POST(req, { params: mockParams });
    expect(res.status).toBe(401);
  });

  it('should return 400 if validation fails', async () => {
    (requireAuth as jest.Mock).mockResolvedValue({ success: true, user: { id: 'u1' } });

    // Missing targetId
    const req = new Request(`http://localhost/api/matchdays/${mockMatchdayId}/vote`, {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const res = await POST(req, { params: mockParams });
    expect(res.status).toBe(400);
  });

  it('should return 404 if matchday not found', async () => {
    (requireAuth as jest.Mock).mockResolvedValue({ success: true, user: { id: 'u1' } });
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getPlayerFromSession } = require('@/lib/auth-helpers');
    getPlayerFromSession.mockResolvedValue({ success: true, player: { id: 'p1' } });

    (prisma.matchday.findUnique as jest.Mock).mockResolvedValue(null);

    const req = new Request(`http://localhost/api/matchdays/${mockMatchdayId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ targetId: 'p2' }),
    });

    const res = await POST(req, { params: mockParams });
    expect(res.status).toBe(404);
  });

  it('should create a vote if valid', async () => {
    (requireAuth as jest.Mock).mockResolvedValue({ success: true, user: { id: 'u1' } });
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getPlayerFromSession } = require('@/lib/auth-helpers');
    getPlayerFromSession.mockResolvedValue({ success: true, player: { id: 'p1' } });

    (prisma.matchday.findUnique as jest.Mock).mockResolvedValue({
      id: mockMatchdayId,
      status: 'COMPLETED',
    });

    (prisma.vote.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.vote.create as jest.Mock).mockResolvedValue({ id: 'vote-1' });
    (prisma.player.findUnique as jest.Mock).mockResolvedValue({ id: 'p2' });

    const req = new Request(`http://localhost/api/matchdays/${mockMatchdayId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ targetId: 'p2' }),
    });

    const res = await POST(req, { params: mockParams });
    expect(res.status).toBe(200);
    expect(prisma.vote.create).toHaveBeenCalledWith({
      data: {
        matchdayId: mockMatchdayId,
        voterId: 'p1',
        targetId: 'p2',
      },
    });
  });
});
