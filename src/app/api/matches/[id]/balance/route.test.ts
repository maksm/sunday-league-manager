import { POST } from './route';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-helpers';
import { NextResponse } from 'next/server';

// Mock dependencies
jest.mock('@/lib/prisma', () => {
  const mockPrisma = {
    match: {
      findUnique: jest.fn(),
    },
    matchStat: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  (mockPrisma.$transaction as jest.Mock).mockImplementation((callback) => callback(mockPrisma));
  return { prisma: mockPrisma };
});

jest.mock('@/lib/auth-helpers', () => ({
  requireAdmin: jest.fn(),
  errorResponse: (msg: string, status: number) => NextResponse.json({ error: msg }, { status }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  successResponse: (data: any) => NextResponse.json(data),
}));

jest.mock('../../../auth/[...nextauth]/route', () => ({
  authOptions: {},
}));

describe('Match Balance API', () => {
  const mockMatchId = 'match-1';
  const mockParams = Promise.resolve({ id: mockMatchId });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 403 if user is not admin', async () => {
    (requireAdmin as jest.Mock).mockResolvedValue({
      success: false,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    });

    const req = new Request(`http://localhost/api/matches/${mockMatchId}/balance`, {
      method: 'POST',
    });

    const res = await POST(req, { params: mockParams });
    expect(res.status).toBe(403);
  });

  it('should return 404 if match not found', async () => {
    (requireAdmin as jest.Mock).mockResolvedValue({ success: true });
    (prisma.match.findUnique as jest.Mock).mockResolvedValue(null);

    const req = new Request(`http://localhost/api/matches/${mockMatchId}/balance`, {
      method: 'POST',
    });

    const res = await POST(req, { params: mockParams });
    expect(res.status).toBe(404);
  });

  it('should return 400 if not enough players', async () => {
    (requireAdmin as jest.Mock).mockResolvedValue({ success: true });
    (prisma.match.findUnique as jest.Mock).mockResolvedValue({
      id: mockMatchId,
      matchday: {
        rsvps: [{ player: { id: 'p1', name: 'Player 1' }, status: 'IN' }],
      },
    });

    const req = new Request(`http://localhost/api/matches/${mockMatchId}/balance`, {
      method: 'POST',
    });

    const res = await POST(req, { params: mockParams });
    expect(res.status).toBe(400);
  });

  it('should balance teams and return 200', async () => {
    (requireAdmin as jest.Mock).mockResolvedValue({ success: true, user: { id: 'admin-1' } });

    const mockPlayers = Array.from({ length: 4 }, (_, i) => ({
      player: { id: `p${i}`, name: `Player ${i}`, rating: 1000 },
      status: 'IN',
    }));

    (prisma.match.findUnique as jest.Mock).mockResolvedValue({
      id: mockMatchId,
      matchday: {
        rsvps: mockPlayers,
      },
    });

    const req = new Request(`http://localhost/api/matches/${mockMatchId}/balance`, {
      method: 'POST',
    });

    const res = await POST(req, { params: mockParams });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.teamA).toHaveLength(2);
    expect(data.teamB).toHaveLength(2);
    expect(prisma.matchStat.deleteMany).toHaveBeenCalledWith({
      where: { matchId: mockMatchId },
    });
    expect(prisma.matchStat.create).toHaveBeenCalled();
  });
});
