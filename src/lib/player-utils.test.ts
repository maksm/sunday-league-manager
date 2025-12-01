import { describe, it, expect } from '@jest/globals';
import { calculatePlayerWeight, sortPlayers } from './player-utils';
import { Player } from '@prisma/client';

describe('player-utils', () => {
  describe('calculatePlayerWeight', () => {
    const attendingPlayerIds = new Set(['player-1', 'player-2']);
    const beerPlayerIds = new Set(['player-3']);
    const declinedPlayerIds = new Set(['player-4']);

    it('should return 0 for beer players (highest priority)', () => {
      expect(
        calculatePlayerWeight('player-3', attendingPlayerIds, beerPlayerIds, declinedPlayerIds)
      ).toBe(0);
    });

    it('should return 1 for attending players', () => {
      expect(
        calculatePlayerWeight('player-1', attendingPlayerIds, beerPlayerIds, declinedPlayerIds)
      ).toBe(1);
      expect(
        calculatePlayerWeight('player-2', attendingPlayerIds, beerPlayerIds, declinedPlayerIds)
      ).toBe(1);
    });

    it('should return 2 for declined players', () => {
      expect(
        calculatePlayerWeight('player-4', attendingPlayerIds, beerPlayerIds, declinedPlayerIds)
      ).toBe(2);
    });

    it('should return 3 for unknown players (lowest priority)', () => {
      expect(
        calculatePlayerWeight(
          'player-unknown',
          attendingPlayerIds,
          beerPlayerIds,
          declinedPlayerIds
        )
      ).toBe(3);
    });
  });

  describe('sortPlayers', () => {
    const createMockPlayer = (id: string, name: string): Player => ({
      id,
      name,
      matchesPlayed: 0,
      goals: 0,
      assists: 0,
      motmCount: 0,
      form: '',
      isActive: true,
      userId: null,
    });

    const players: Player[] = [
      createMockPlayer('player-unknown', 'Zoe Unknown'),
      createMockPlayer('player-1', 'Alice Attending'),
      createMockPlayer('player-3', 'Charlie Beer'),
      createMockPlayer('player-4', 'David Declined'),
      createMockPlayer('player-2', 'Bob Attending'),
    ];

    const attendingPlayerIds = new Set(['player-1', 'player-2']);
    const beerPlayerIds = new Set(['player-3']);
    const declinedPlayerIds = new Set(['player-4']);

    it('should sort players by weight priority (beer > attending > declined > unknown)', () => {
      const sorted = sortPlayers(players, attendingPlayerIds, beerPlayerIds, declinedPlayerIds);

      expect(sorted[0].id).toBe('player-3'); // Beer (weight 0)
      expect(sorted[1].id).toBe('player-1'); // Attending (weight 1)
      expect(sorted[2].id).toBe('player-2'); // Attending (weight 1)
      expect(sorted[3].id).toBe('player-4'); // Declined (weight 2)
      expect(sorted[4].id).toBe('player-unknown'); // Unknown (weight 3)
    });

    it('should sort players with same weight alphabetically by name', () => {
      const sorted = sortPlayers(players, attendingPlayerIds, beerPlayerIds, declinedPlayerIds);

      // Both have weight 1 (attending), should be sorted alphabetically
      const attendingPlayers = sorted.filter((p) => attendingPlayerIds.has(p.id));
      expect(attendingPlayers[0].name).toBe('Alice Attending');
      expect(attendingPlayers[1].name).toBe('Bob Attending');
    });

    it('should not mutate the original array', () => {
      const originalOrder = [...players];
      sortPlayers(players, attendingPlayerIds, beerPlayerIds, declinedPlayerIds);

      expect(players).toEqual(originalOrder);
    });

    it('should handle empty sets', () => {
      const sorted = sortPlayers(players, new Set(), new Set(), new Set());

      // All should have weight 3 (unknown) and be sorted alphabetically
      expect(sorted[0].name).toBe('Alice Attending');
      expect(sorted[1].name).toBe('Bob Attending');
      expect(sorted[2].name).toBe('Charlie Beer');
      expect(sorted[3].name).toBe('David Declined');
      expect(sorted[4].name).toBe('Zoe Unknown');
    });

    it('should handle empty player array', () => {
      const sorted = sortPlayers([], attendingPlayerIds, beerPlayerIds, declinedPlayerIds);

      expect(sorted).toEqual([]);
    });
  });
});
