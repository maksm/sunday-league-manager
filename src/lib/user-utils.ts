import { prisma } from '@/lib/prisma';
import { UserRole } from '@/types/api';

/**
 * Gets a user with their associated player profile
 */
export async function getUserWithPlayer(username: string) {
  return prisma.user.findUnique({
    where: { username },
    include: { player: true },
  });
}

/**
 * Gets user display information including player name and role
 */
export async function getUserDisplayInfo(username: string) {
  const user = await getUserWithPlayer(username);

  if (!user) {
    return {
      displayName: username,
      role: UserRole.USER,
    };
  }

  return {
    displayName: user.player?.name || user.username,
    role: user.role as UserRole,
  };
}
