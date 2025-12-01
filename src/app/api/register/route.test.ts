import { POST } from './route';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    player: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
}));

describe('POST /api/register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (hash as jest.Mock).mockResolvedValue('hashed_password');
  });

  it('should register a new user with a new player', async () => {
    const mockUser = {
      id: 'user-1',
      username: 'johns',
      passwordHash: 'hashed_password',
    };

    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
      return callback({
        user: {
          create: jest.fn().mockResolvedValue(mockUser),
        },
        player: {
          update: jest.fn(),
          findFirst: jest.fn().mockResolvedValue(null),
        },
      });
    });

    const request = new Request('http://localhost:3000/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        password: 'password123',
        name: 'John Smith',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.user).toEqual({
      id: 'user-1',
      username: 'johns',
    });
    expect(hash).toHaveBeenCalledWith('password123', 12);
  });

  it('should register a user claiming an existing player', async () => {
    const mockPlayer = {
      id: 'player-1',
      name: 'John Smith',
      userId: null,
    };

    const mockUser = {
      id: 'user-1',
      username: 'johns',
      passwordHash: 'hashed_password',
    };

    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.player.findUnique as jest.Mock).mockResolvedValue(mockPlayer);
    (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
      return callback({
        user: {
          create: jest.fn().mockResolvedValue(mockUser),
        },
        player: {
          update: jest.fn(),
          findFirst: jest.fn().mockResolvedValue(null),
        },
      });
    });

    const request = new Request('http://localhost:3000/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        password: 'password123',
        playerId: 'player-1',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.user).toEqual({
      id: 'user-1',
      username: 'johns',
    });
  });

  it('should reject registration with invalid password (too short)', async () => {
    const request = new Request('http://localhost:3000/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        password: 'short',
        name: 'John Smith',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('at least 6 characters');
  });

  it('should reject registration when claiming non-existent player', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.player.findUnique as jest.Mock).mockResolvedValue(null);

    const request = new Request('http://localhost:3000/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        password: 'password123',
        playerId: 'non-existent',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Player not found');
  });

  it('should reject registration when claiming already claimed player', async () => {
    const mockPlayer = {
      id: 'player-1',
      name: 'John Smith',
      userId: 'another-user',
    };

    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.player.findUnique as jest.Mock).mockResolvedValue(mockPlayer);

    const request = new Request('http://localhost:3000/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        password: 'password123',
        playerId: 'player-1',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Player already claimed');
  });

  it('should handle missing required fields', async () => {
    const request = new Request('http://localhost:3000/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        password: 'password123',
        // Missing both name and playerId
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('name or playerId');
  });

  it('should generate unique username when collision occurs', async () => {
    const mockUser = {
      id: 'user-1',
      username: 'johns1',
      passwordHash: 'hashed_password',
    };

    // First call returns existing user, second returns null
    (prisma.user.findUnique as jest.Mock)
      .mockResolvedValueOnce({ id: 'existing', username: 'johns' }) // Username collision
      .mockResolvedValueOnce(null); // johns1 is available

    (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
      return callback({
        user: {
          create: jest.fn().mockResolvedValue(mockUser),
        },
        player: {
          update: jest.fn(),
          findFirst: jest.fn().mockResolvedValue(null),
        },
      });
    });

    const request = new Request('http://localhost:3000/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        password: 'password123',
        name: 'John Smith',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.user.id).toBe('user-1');
  });
});
