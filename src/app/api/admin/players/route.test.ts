// Mock auth route before importing
jest.mock('@/app/api/auth/[...nextauth]/route', () => ({
  authOptions: {},
}));

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    player: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

import { GET, POST } from './route';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

describe('GET /api/admin/players', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return all players for admin user', async () => {
    const mockPlayers = [
      {
        id: 'player-1',
        name: 'Player One',

        user: null,
      },
      {
        id: 'player-2',
        name: 'Player Two',

        user: { id: 'user-1' },
      },
    ];

    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'admin-1', role: 'ADMIN' },
    });
    (prisma.player.findMany as jest.Mock).mockResolvedValue(mockPlayers);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockPlayers);
    expect(prisma.player.findMany).toHaveBeenCalledWith({
      include: { user: true },
      orderBy: { name: 'asc' },
    });
  });

  it('should reject non-admin users', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-1', role: 'USER' },
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toContain('Admin');
  });

  it('should reject unauthenticated requests', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });
});

describe('POST /api/admin/players', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a new shadow player for admin', async () => {
    const mockPlayer = {
      id: 'player-1',
      name: 'New Player',

      matchesPlayed: 0,
      goals: 0,
      assists: 0,
      motmCount: 0,
      form: '',
      userId: null,
    };

    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'admin-1', role: 'ADMIN' },
    });
    (prisma.player.create as jest.Mock).mockResolvedValue(mockPlayer);

    const request = new Request('http://localhost:3000/api/admin/players', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'New Player' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toEqual(mockPlayer);
    expect(prisma.player.create).toHaveBeenCalledWith({
      data: {
        name: 'New Player',
      },
    });
  });

  it('should reject request with missing name', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'admin-1', role: 'ADMIN' },
    });

    const request = new Request('http://localhost:3000/api/admin/players', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('string');
  });

  it('should reject non-admin users', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-1', role: 'USER' },
    });

    const request = new Request('http://localhost:3000/api/admin/players', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'New Player' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toContain('Admin');
  });

  it('should reject name that is too long', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'admin-1', role: 'ADMIN' },
    });

    const request = new Request('http://localhost:3000/api/admin/players', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'a'.repeat(101) }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('too long');
  });
});
