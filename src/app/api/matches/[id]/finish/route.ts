import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAdmin, errorResponse, successResponse } from '@/lib/auth-helpers';
import { validateRequest, finishMatchSchema } from '@/lib/validation';
import { authOptions } from '../../../auth/[...nextauth]/route';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdmin(authOptions);
  if (!authResult.success) {
    return authResult.response;
  }

  try {
    const { id } = await params;
    const body = await req.json();

    // Validate input
    const validation = await validateRequest(finishMatchSchema, body);
    if (!validation.success) {
      return errorResponse(validation.error, 400);
    }

    const { result, teamAIds, teamBIds } = validation.data;

    // Verify match exists and is not already finished
    const existingMatch = await prisma.match.findUnique({
      where: { id },
      include: { matchday: true },
    });

    if (!existingMatch) {
      return errorResponse('Match not found', 404);
    }

    if (existingMatch.result) {
      return errorResponse('Match already finished', 400);
    }

    // Calculate winner and ELO changes
    const [scoreA, scoreB] = result.split('-').map(Number);
    const winner = scoreA > scoreB ? 'A' : scoreA < scoreB ? 'B' : 'DRAW';

    // Use transaction to ensure atomicity
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Update match result
      await tx.match.update({
        where: { id },
        data: {
          result,
        },
      });

      // Update matchday status if needed (e.g., if all matches are done)
      // For now, we can mark matchday as COMPLETED if this was the only match or logic dictates
      // But let's keep it simple and just update the match.
      // However, the previous logic updated Game status. Matchday has status.
      // Maybe we should update Matchday status to COMPLETED?
      // Let's assume for now that finishing a match doesn't automatically close the matchday,
      // or maybe it does if it's the "main" match.
      // Given the requirement "support multiple matches", maybe we shouldn't close the matchday yet.
      // But the previous logic did set status to PLAYED.
      // Let's update Matchday status to COMPLETED for backward compatibility if we assume 1 match/matchday for now.
      await tx.matchday.update({
        where: { id: existingMatch.matchdayId },
        data: { status: 'COMPLETED' },
      });

      // Helper function to update players in batch
      const updatePlayers = async (playerIds: string[], team: 'A' | 'B') => {
        const isWinner = (team === 'A' && winner === 'A') || (team === 'B' && winner === 'B');
        const formResult = isWinner ? 'W' : winner === 'DRAW' ? 'D' : 'L';

        // Fetch all players at once
        const players = await tx.player.findMany({
          where: { id: { in: playerIds } },
        });

        // Update all players in parallel
        await Promise.all(
          players.map(async (player) => {
            const currentForm = player.form ? player.form.split(',') : [];
            const newForm = [formResult, ...currentForm].slice(0, 5).join(',');

            await tx.player.update({
              where: { id: player.id },
              data: {
                matchesPlayed: { increment: 1 },
                form: newForm,
              },
            });
          })
        );
      };

      // Update both teams
      await Promise.all([updatePlayers(teamAIds, 'A'), updatePlayers(teamBIds, 'B')]);
    });

    return successResponse({ success: true });
  } catch (error) {
    console.error('Error finishing match:', error);
    return errorResponse('Failed to finish match', 500);
  }
}
