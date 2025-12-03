import { getUserWithPlayer, getUserDisplayInfo } from './user-utils';
import { prisma } from './prisma';
import { UserRole } from '@/types/api';

// Mock prisma
jest.mock('./prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

describe('user-utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserWithPlayer', () => {
    it('should return user with player profile', async () => {
      const mockUser = {
        id: '1',
        username: 'testuser',
        passwordHash: 'hash',
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
        player: {
          id: 'p1',
          name: 'Test Player',
          userId: '1',
          matchesPlayed: 5,
          goals: 3,
          assists: 2,
          motmCount: 1,
          form: 'W,W,L',
          isActive: true,
        },
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await getUserWithPlayer('testuser');

      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { username: 'testuser' },
        include: { player: true },
      });
    });

    it('should return null if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await getUserWithPlayer('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getUserDisplayInfo', () => {
    it('should return player name when user has player profile', async () => {
      const mockUser = {
        id: '1',
        username: 'testuser',
        passwordHash: 'hash',
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
        player: {
          id: 'p1',
          name: 'Test Player',
          userId: '1',
          matchesPlayed: 5,
          goals: 3,
          assists: 2,
          motmCount: 1,
          form: 'W,W,L',
          isActive: true,
        },
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await getUserDisplayInfo('testuser');

      expect(result).toEqual({
        displayName: 'Test Player',
        role: UserRole.USER,
      });
    });

    it('should return username when user has no player profile', async () => {
      const mockUser = {
        id: '1',
        username: 'testuser',
        passwordHash: 'hash',
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
        player: null,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await getUserDisplayInfo('testuser');

      expect(result).toEqual({
        displayName: 'testuser',
        role: UserRole.USER,
      });
    });

    it('should return username and USER role when user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await getUserDisplayInfo('nonexistent');

      expect(result).toEqual({
        displayName: 'nonexistent',
        role: UserRole.USER,
      });
    });

    it('should return ADMIN role for admin users', async () => {
      const mockUser = {
        id: '1',
        username: 'admin',
        passwordHash: 'hash',
        role: 'ADMIN',
        createdAt: new Date(),
        updatedAt: new Date(),
        player: {
          id: 'p1',
          name: 'Admin Player',
          userId: '1',
          matchesPlayed: 0,
          goals: 0,
          assists: 0,
          motmCount: 0,
          form: '',
          isActive: true,
        },
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await getUserDisplayInfo('admin');

      expect(result).toEqual({
        displayName: 'Admin Player',
        role: UserRole.ADMIN,
      });
    });
  });
});
