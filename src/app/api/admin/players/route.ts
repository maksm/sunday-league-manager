import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { requireAdmin, errorResponse, successResponse } from '@/lib/auth-helpers';
import { validateRequest, createPlayerSchema } from '@/lib/validation';
import { logError } from '@/lib/logger';
import { authOptions } from '../../auth/[...nextauth]/route';

export const dynamic = 'force-dynamic';

export async function GET() {
  const authResult = await requireAdmin(authOptions);
  if (!authResult.success) {
    return authResult.response;
  }

  try {
    const players = await prisma.player.findMany({
      include: { user: true },
      orderBy: { name: 'asc' },
    });

    return successResponse(players);
  } catch (error) {
    logError('Error fetching players', error, {
      endpoint: '/api/admin/players',
      method: 'GET',
    });
    return errorResponse('Failed to fetch players', 500);
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(authOptions);
  if (!authResult.success) {
    return authResult.response;
  }

  try {
    const body = await request.json();

    // Validate input
    const validation = await validateRequest(createPlayerSchema, body);
    if (!validation.success) {
      return errorResponse(validation.error, 400);
    }

    const { name } = validation.data;

    const player = await prisma.player.create({
      data: {
        name,
      },
    });

    return successResponse(player, 201);
  } catch (error) {
    logError('Failed to create player', error, {
      endpoint: '/api/admin/players',
      method: 'POST',
      userId: authResult.user.id,
    });
    return errorResponse('Internal Server Error', 500);
  }
}
