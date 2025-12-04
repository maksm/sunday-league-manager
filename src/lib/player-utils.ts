import { Player } from '@prisma/client';

export const calculatePlayerWeight = (
  playerId: string,
  attendingPlayerIds: Set<string>,
  beerPlayerIds: Set<string>,
  declinedPlayerIds: Set<string>
): number => {
  if (beerPlayerIds.has(playerId)) return 0;
  if (attendingPlayerIds.has(playerId)) return 1;
  if (declinedPlayerIds.has(playerId)) return 2;
  return 3;
};

export const sortPlayers = <T extends Player>(
  players: T[],
  attendingPlayerIds: Set<string>,
  beerPlayerIds: Set<string>,
  declinedPlayerIds: Set<string>
): T[] => {
  return [...players].sort((a, b) => {
    const weightA = calculatePlayerWeight(
      a.id,
      attendingPlayerIds,
      beerPlayerIds,
      declinedPlayerIds
    );
    const weightB = calculatePlayerWeight(
      b.id,
      attendingPlayerIds,
      beerPlayerIds,
      declinedPlayerIds
    );

    if (weightA !== weightB) {
      return weightA - weightB;
    }
    return a.name.localeCompare(b.name);
  });
};
