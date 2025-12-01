import { POST, GET } from './route';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    matchday: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('../../auth/[...nextauth]/route', () => ({
  authOptions: {},
}));

describe('Admin Matchdays API', () => {
  const mockDate = new Date('2024-01-01');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST', () => {
    it('should return 403 if user is not admin', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { role: 'USER' },
      });

      const req = new Request('http://localhost/api/admin/matchdays', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const res = await POST(req);
      expect(res.status).toBe(403);
    });

    it('should create a matchday with default match if input is valid', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { role: 'ADMIN' },
      });

      const body = {
        date: mockDate.toISOString(),
        seasonId: 'season-1',
      };

      const req = new Request('http://localhost/api/admin/matchdays', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      (prisma.matchday.create as jest.Mock).mockResolvedValue({
        id: 'matchday-1',
        ...body,
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.id).toBe('matchday-1');
      expect(prisma.matchday.create).toHaveBeenCalledWith({
        data: {
          date: expect.any(Date),
          seasonId: 'season-1',
          startTime: undefined,
          endTime: undefined,
          matches: {
            create: {},
          },
        },
      });
    });

    it('should return 400 if validation fails', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { role: 'ADMIN' },
      });

      const req = new Request('http://localhost/api/admin/matchdays', {
        method: 'POST',
        body: JSON.stringify({}), // Missing required fields
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
    });
  });

  describe('GET', () => {
    it('should return 403 if user is not admin', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { name: 'user', role: 'USER' },
      });

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        role: 'USER',
      });

      const res = await GET();
      expect(res.status).toBe(403);
    });

    it('should return matchdays with matches', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { name: 'admin', role: 'ADMIN' },
      });

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        role: 'ADMIN',
      });

      const mockMatchdays = [{ id: '1', date: mockDate, matches: [] }];

      (prisma.matchday.findMany as jest.Mock).mockResolvedValue(mockMatchdays);

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toEqual(JSON.parse(JSON.stringify(mockMatchdays)));
      expect(prisma.matchday.findMany).toHaveBeenCalledWith({
        include: {
          season: {
            select: { name: true },
          },
          matches: true,
        },
        orderBy: { date: 'desc' },
      });
    });
  });
});
