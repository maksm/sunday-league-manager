import { prisma } from '@/lib/prisma';
import {
  requireAuth,
  getPlayerFromSession,
  errorResponse,
  successResponse,
} from '@/lib/auth-helpers';
import { validateRequest, rsvpSchema } from '@/lib/validation';
import { logError } from '@/lib/logger';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';

const deleteRsvpSchema = z.object({
  matchdayId: z.string().min(1, 'Matchday ID is required'),
});

export async function POST(req: Request) {
  const authResult = await requireAuth(authOptions);
  if (!authResult.success) {
    return authResult.response;
  }

  let matchdayId: string | undefined;

  try {
    const body = await req.json();

    // Validate input
    const validation = await validateRequest(rsvpSchema, body);
    if (!validation.success) {
      return errorResponse(validation.error, 400);
    }

    const { status } = validation.data;
    matchdayId = validation.data.matchdayId;

    // Verify matchday exists and is not already played
    const matchday = await prisma.matchday.findUnique({
      where: { id: matchdayId },
    });

    if (!matchday) {
      return errorResponse('Matchday not found', 404);
    }

    if (matchday.status === 'COMPLETED') {
      return errorResponse('Cannot RSVP to a finished matchday', 400);
    }

    // Get player from session
    const playerResult = await getPlayerFromSession(authResult.user);
    if (!playerResult.success) {
      return playerResult.response;
    }

    const rsvp = await prisma.rSVP.upsert({
      where: {
        matchdayId_playerId: {
          matchdayId,
          playerId: playerResult.player.id,
        },
      },
      update: { status },
      create: {
        matchdayId,
        playerId: playerResult.player.id,
        status,
      },
    });

    return successResponse(rsvp);
  } catch (error) {
    logError('RSVP error', error, {
      endpoint: '/api/rsvp',
      method: 'POST',
      userId: authResult.user.id,
      matchdayId,
    });
    return errorResponse('Internal Server Error', 500);
  }
}

export async function DELETE(req: Request) {
  const authResult = await requireAuth(authOptions);
  if (!authResult.success) {
    return authResult.response;
  }

  let matchdayId: string | undefined;

  try {
    const body = await req.json();

    // Validate input
    const validation = await validateRequest(deleteRsvpSchema, body);
    if (!validation.success) {
      return errorResponse(validation.error, 400);
    }

    matchdayId = validation.data.matchdayId;

    // Get player from session
    const playerResult = await getPlayerFromSession(authResult.user);
    if (!playerResult.success) {
      return playerResult.response;
    }

    // Delete the RSVP
    await prisma.rSVP.delete({
      where: {
        matchdayId_playerId: {
          matchdayId,
          playerId: playerResult.player.id,
        },
      },
    });

    return successResponse({ deleted: true });
  } catch (error) {
    logError('RSVP delete error', error, {
      endpoint: '/api/rsvp',
      method: 'DELETE',
      userId: authResult.user.id,
      matchdayId,
    });
    return errorResponse('Internal Server Error', 500);
  }
}
