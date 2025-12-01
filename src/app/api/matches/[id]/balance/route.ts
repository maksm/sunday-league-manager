import { prisma } from '@/lib/prisma';
import { requireAdmin, errorResponse, successResponse } from '@/lib/auth-helpers';
import { authOptions } from '../../../auth/[...nextauth]/route';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdmin(authOptions);
  if (!authResult.success) {
    return authResult.response;
  }

  try {
    const { id } = await params; // This is matchId

    // Fetch Match and its Matchday to get RSVPs
    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        matchday: {
          include: {
            rsvps: {
              where: { status: 'IN' },
              include: { player: true },
            },
          },
        },
      },
    });

    if (!match) {
      return errorResponse('Match not found', 404);
    }

    if (match.result) {
      return errorResponse('Cannot balance teams for finished match', 400);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const players = match.matchday.rsvps.map((r: { player: any }) => r.player);

    if (players.length < 2) {
      return errorResponse('Not enough players (minimum 2 required)', 400);
    }

    // Balancing Algorithm (Random Shuffle)
    // Fisher-Yates shuffle
    for (let i = players.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [players[i], players[j]] = [players[j], players[i]];
    }

    const mid = Math.ceil(players.length / 2);
    const teamA = players.slice(0, mid);
    const teamB = players.slice(mid);

    // Save team assignments to MatchStat table
    await prisma.$transaction(async (tx) => {
      // Delete existing match stats for this match
      await tx.matchStat.deleteMany({
        where: { matchId: id },
      });

      // Create match stats for team A
      await Promise.all(
        teamA.map((player) =>
          tx.matchStat.create({
            data: {
              matchId: id,
              playerId: player.id,
              team: 'A',
              goals: 0,
              assists: 0,
            },
          })
        )
      );

      // Create match stats for team B
      await Promise.all(
        teamB.map((player) =>
          tx.matchStat.create({
            data: {
              matchId: id,
              playerId: player.id,
              team: 'B',
              goals: 0,
              assists: 0,
            },
          })
        )
      );
    });

    return successResponse({
      teamA,
      teamB,
      stats: {
        countA: teamA.length,
        countB: teamB.length,
      },
    });
  } catch (error) {
    console.error('Team balancing error:', error);
    return errorResponse('Failed to balance teams', 500);
  }
}
