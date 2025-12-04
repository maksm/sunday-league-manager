import { prisma } from '@/lib/prisma';
import {
  errorResponse,
  successResponse,
  requireAuth,
  getPlayerFromSession,
} from '@/lib/auth-helpers';
import { z } from 'zod';
import { validateRequest } from '@/lib/validation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const changeTeamSchema = z.object({
  teamId: z.string().nullable(),
});

export async function POST(req: Request) {
  try {
    // Auth check - get authenticated user
    const authResult = await requireAuth(authOptions);
    if (!authResult.success) return authResult.response;

    const { user } = authResult;

    // Get player from session
    const playerResult = await getPlayerFromSession(user);
    if (!playerResult.success) return playerResult.response;

    const { player } = playerResult;

    // Validate input
    const body = await req.json();
    const validation = await validateRequest(changeTeamSchema, body);
    if (!validation.success) {
      return errorResponse(validation.error, 400);
    }

    const { teamId } = validation.data;

    // Update player's team
    const updatedPlayer = await prisma.player.update({
      where: { id: player.id },
      data: { teamId: teamId || null },
      include: {
        team: true,
      },
    });

    return successResponse({
      player: {
        id: updatedPlayer.id,
        name: updatedPlayer.name,
        teamId: updatedPlayer.teamId,
        team: updatedPlayer.team,
      },
    });
  } catch (error) {
    console.error('Change team error:', error);
    return errorResponse('Internal Server Error', 500);
  }
}
