import { GET, POST } from './route';
import { DELETE } from './[id]/route';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    season: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    matchday: {
      deleteMany: jest.fn(),
      findMany: jest.fn(),
    },
    vote: {
      deleteMany: jest.fn(),
    },
    matchStat: {
      deleteMany: jest.fn(),
    },
    rSVP: {
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('../../auth/[...nextauth]/route', () => ({
  authOptions: {},
}));

describe('Season API', () => {
  const mockSession = {
    user: { name: 'admin', role: 'ADMIN' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
  });

  describe('GET /api/admin/seasons', () => {
    it('should return list of seasons', async () => {
      const mockSeasons = [
        { id: '1', name: 'Season 1' },
        { id: '2', name: 'Season 2' },
      ];
      (prisma.season.findMany as jest.Mock).mockResolvedValue(mockSeasons);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockSeasons);
    });

    it('should return 403 if not admin', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { role: 'USER' },
      });

      const response = await GET();
      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/admin/seasons', () => {
    const validSeason = {
      name: 'New Season',
      startDate: '2025-09-01T00:00:00.000Z',
      endDate: '2026-05-31T00:00:00.000Z',
      location: 'Stadium',
      matchday: 'FRIDAY',
      startHour: '20:00',
      endHour: '21:30',
    };

    it('should create a new season', async () => {
      (prisma.season.create as jest.Mock).mockResolvedValue({
        id: '1',
        ...validSeason,
      });

      const request = new Request('http://localhost/api/admin/seasons', {
        method: 'POST',
        body: JSON.stringify(validSeason),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.name).toBe(validSeason.name);
    });

    it('should return 400 for invalid data', async () => {
      const request = new Request('http://localhost/api/admin/seasons', {
        method: 'POST',
        body: JSON.stringify({ name: '' }), // Missing required fields
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/admin/seasons/[id]', () => {
    it('should delete a season if no matchdays associated', async () => {
      (prisma.matchday.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.season.findUnique as jest.Mock).mockResolvedValue({
        id: '1',
        _count: { matchdays: 0 },
      });
      (prisma.season.delete as jest.Mock).mockResolvedValue({ id: '1' });

      const request = new Request('http://localhost/api/admin/seasons/1', {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: Promise.resolve({ id: '1' }) });
      expect(response.status).toBe(200);
    });

    it('should delete season and associated matchdays and their data', async () => {
      // Mock finding matchdays
      (prisma.matchday.findMany as jest.Mock).mockResolvedValue([
        { id: 'matchday1' },
        { id: 'matchday2' },
      ]);

      // Mock delete operations
      (prisma.vote.deleteMany as jest.Mock).mockResolvedValue({ count: 2 });
      (prisma.rSVP.deleteMany as jest.Mock).mockResolvedValue({ count: 5 });
      (prisma.matchday.deleteMany as jest.Mock).mockResolvedValue({ count: 2 });
      (prisma.season.delete as jest.Mock).mockResolvedValue({ id: '1' });

      // Mock transaction
      (prisma.$transaction as jest.Mock).mockResolvedValue([
        { count: 2 }, // votes
        { count: 5 }, // rsvps
        { count: 2 }, // matchdays
        { id: '1' }, // season
      ]);

      const request = new Request('http://localhost/api/admin/seasons/1', {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: Promise.resolve({ id: '1' }) });
      expect(response.status).toBe(200);

      // Verify transaction was called
      expect(prisma.$transaction).toHaveBeenCalled();

      // Verify we fetched matchdays first
      expect(prisma.matchday.findMany).toHaveBeenCalledWith({
        where: { seasonId: '1' },
        select: { id: true },
      });
    });
  });
});
