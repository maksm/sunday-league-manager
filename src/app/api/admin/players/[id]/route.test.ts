// Mock auth route before importing
jest.mock('@/app/api/auth/[...nextauth]/route', () => ({
  authOptions: {},
}));

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    player: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
}));

import { PUT, DELETE } from './route';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { hash } from 'bcryptjs';

describe('PUT /api/admin/players/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update player name successfully', async () => {
    const mockPlayer = {
      id: 'player-1',
      name: 'Updated Name',
    };

    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'admin-1', role: 'ADMIN' },
    });
    (prisma.player.findUnique as jest.Mock)
      .mockResolvedValueOnce({
        id: 'player-1',
        name: 'Old Name',
      })
      .mockResolvedValueOnce({
        id: 'player-1',
        name: 'Updated Name',
      });
    (prisma.player.update as jest.Mock).mockResolvedValue(mockPlayer);

    const request = new Request('http://localhost:3000/api/admin/players/player-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Updated Name' }),
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await PUT(request as any, { params: Promise.resolve({ id: 'player-1' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockPlayer);
    expect(prisma.player.update).toHaveBeenCalledWith({
      where: { id: 'player-1' },
      data: { name: 'Updated Name' },
    });
  });

  it('should update player active status', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'admin-1', role: 'ADMIN' },
    });
    (prisma.player.findUnique as jest.Mock).mockResolvedValue({
      id: 'player-1',
      name: 'Player',
      isActive: true,
    });
    (prisma.player.update as jest.Mock).mockResolvedValue({
      id: 'player-1',
      isActive: false,
    });

    const request = new Request('http://localhost:3000/api/admin/players/player-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: false }),
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await PUT(request as any, { params: Promise.resolve({ id: 'player-1' }) });

    expect(response.status).toBe(200);
    expect(prisma.player.update).toHaveBeenCalledWith({
      where: { id: 'player-1' },
      data: { isActive: false },
    });
  });

  it('should update user credentials if provided', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'admin-1', role: 'ADMIN' },
    });
    (prisma.player.findUnique as jest.Mock).mockResolvedValue({
      id: 'player-1',
      name: 'Player',
      userId: 'user-1',
      user: { id: 'user-1', username: 'olduser' },
    });

    const request = new Request('http://localhost:3000/api/admin/players/player-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'newuser', password: 'newpassword' }),
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await PUT(request as any, { params: Promise.resolve({ id: 'player-1' }) });

    expect(hash).toHaveBeenCalledWith('newpassword', 10);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        username: 'newuser',
        passwordHash: 'hashed_password',
      },
    });
  });

  it('should return 404 for non-existent player', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'admin-1', role: 'ADMIN' },
    });
    (prisma.player.findUnique as jest.Mock).mockResolvedValue(null);

    const request = new Request('http://localhost:3000/api/admin/players/player-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Updated Name' }),
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await PUT(request as any, { params: Promise.resolve({ id: 'player-1' }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Player not found');
  });
});

describe('DELETE /api/admin/players/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should hard delete player and user', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'admin-1', role: 'ADMIN' },
    });
    (prisma.player.findUnique as jest.Mock).mockResolvedValue({
      id: 'player-1',
      userId: 'user-1',
      user: { id: 'user-1' },
    });
    (prisma.player.delete as jest.Mock).mockResolvedValue({ id: 'player-1' });

    const request = new Request('http://localhost:3000/api/admin/players/player-1', {
      method: 'DELETE',
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await DELETE(request as any, { params: Promise.resolve({ id: 'player-1' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.softDeleted).toBe(false);

    // Check hard delete calls
    expect(prisma.player.delete).toHaveBeenCalledWith({
      where: { id: 'player-1' },
    });
    expect(prisma.user.delete).toHaveBeenCalledWith({
      where: { id: 'user-1' },
    });
  });

  it('should hard delete shadow player (no user)', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'admin-1', role: 'ADMIN' },
    });
    (prisma.player.findUnique as jest.Mock).mockResolvedValue({
      id: 'player-1',
      userId: null,
      user: null,
    });
    (prisma.player.delete as jest.Mock).mockResolvedValue({ id: 'player-1' });

    const request = new Request('http://localhost:3000/api/admin/players/player-1', {
      method: 'DELETE',
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await DELETE(request as any, { params: Promise.resolve({ id: 'player-1' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);

    expect(prisma.player.delete).toHaveBeenCalledWith({
      where: { id: 'player-1' },
    });
    expect(prisma.user.delete).not.toHaveBeenCalled();
  });

  it('should return 404 for non-existent player', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'admin-1', role: 'ADMIN' },
    });
    (prisma.player.findUnique as jest.Mock).mockResolvedValue(null);

    const request = new Request('http://localhost:3000/api/admin/players/player-1', {
      method: 'DELETE',
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await DELETE(request as any, { params: Promise.resolve({ id: 'player-1' }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Player not found');
  });
});
