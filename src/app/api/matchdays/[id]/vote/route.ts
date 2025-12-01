import { prisma } from '@/lib/prisma';
import {
  requireAuth,
  getPlayerFromSession,
  errorResponse,
  successResponse,
} from '@/lib/auth-helpers';
import { validateRequest, voteSchema } from '@/lib/validation';
import { authOptions } from '../../../auth/[...nextauth]/route';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAuth(authOptions);
  if (!authResult.success) {
    return authResult.response;
  }

  try {
    const { id } = await params; // This is matchdayId
    const body = await req.json();

    // Validate input
    const validation = await validateRequest(voteSchema, body);
    if (!validation.success) {
      return errorResponse(validation.error, 400);
    }

    const { targetId } = validation.data;

    // Verify matchday exists and is finished
    const matchday = await prisma.matchday.findUnique({
      where: { id },
    });

    if (!matchday) {
      return errorResponse('Matchday not found', 404);
    }

    if (matchday.status !== 'COMPLETED') {
      return errorResponse('Can only vote on finished matchdays', 400);
    }

    // Get player from session
    const playerResult = await getPlayerFromSession(authResult.user);
    if (!playerResult.success) {
      return playerResult.response;
    }

    // Check if already voted
    const existingVote = await prisma.vote.findUnique({
      where: {
        matchdayId_voterId: {
          matchdayId: id,
          voterId: playerResult.player.id,
        },
      },
    });

    if (existingVote) {
      return errorResponse('Already voted for this matchday', 400);
    }

    // Verify target player exists
    const targetPlayer = await prisma.player.findUnique({
      where: { id: targetId },
    });

    if (!targetPlayer) {
      return errorResponse('Target player not found', 404);
    }

    // Cast vote
    await prisma.vote.create({
      data: {
        matchdayId: id,
        voterId: playerResult.player.id,
        targetId,
      },
    });

    return successResponse({ success: true });
  } catch (error) {
    console.error('Voting error:', error);
    return errorResponse('Failed to cast vote', 500);
  }
}
