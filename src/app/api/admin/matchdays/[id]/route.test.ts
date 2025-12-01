import { DELETE, PATCH } from './route';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    matchday: {
      delete: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('../../../auth/[...nextauth]/route', () => ({
  authOptions: {},
}));

describe('Admin Matchday [id] API', () => {
  const mockDate = new Date('2024-01-01');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('DELETE', () => {
    it('should return 403 if user is not admin', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { role: 'USER' },
      });

      const req = new Request('http://localhost/api/admin/matchdays/1', {
        method: 'DELETE',
      });

      const res = await DELETE(req, { params: { id: '1' } });
      expect(res.status).toBe(403);
    });

    it('should delete matchday if user is admin', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { role: 'ADMIN' },
      });

      const req = new Request('http://localhost/api/admin/matchdays/1', {
        method: 'DELETE',
      });

      (prisma.matchday.delete as jest.Mock).mockResolvedValue({ id: '1' });

      const res = await DELETE(req, { params: { id: '1' } });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(prisma.matchday.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });
  });

  describe('PATCH', () => {
    it('should return 403 if user is not admin', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { role: 'USER' },
      });

      const req = new Request('http://localhost/api/admin/matchdays/1', {
        method: 'PATCH',
        body: JSON.stringify({}),
      });

      const res = await PATCH(req, { params: { id: '1' } });
      expect(res.status).toBe(403);
    });

    it('should update matchday if user is admin and input is valid', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { role: 'ADMIN' },
      });

      const body = {
        date: mockDate.toISOString(),
        status: 'COMPLETED',
      };

      const req = new Request('http://localhost/api/admin/matchdays/1', {
        method: 'PATCH',
        body: JSON.stringify(body),
      });

      (prisma.matchday.update as jest.Mock).mockResolvedValue({
        id: '1',
        ...body,
      });

      const res = await PATCH(req, { params: { id: '1' } });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.id).toBe('1');
      expect(prisma.matchday.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          date: expect.any(Date),
          seasonId: undefined,
          status: 'COMPLETED',
        },
      });
    });

    it('should return 400 if validation fails', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { role: 'ADMIN' },
      });

      const req = new Request('http://localhost/api/admin/matchdays/1', {
        method: 'PATCH',
        body: JSON.stringify({ date: 'invalid-date' }),
      });

      const res = await PATCH(req, { params: { id: '1' } });
      expect(res.status).toBe(400);
    });
  });
});
