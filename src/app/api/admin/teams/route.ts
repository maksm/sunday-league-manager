import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { requireAdmin, errorResponse, successResponse } from '@/lib/auth-helpers';
import { logError } from '@/lib/logger';
import { authOptions } from '../../auth/[...nextauth]/route';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createTeamSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  badge: z.string().max(200).optional(),
});

export async function GET() {
  const authResult = await requireAdmin(authOptions);
  if (!authResult.success) {
    return authResult.response;
  }

  try {
    const teams = await prisma.team.findMany({
      include: {
        _count: {
          select: { players: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return successResponse(teams);
  } catch (error) {
    logError('Error fetching teams', error, {
      endpoint: '/api/admin/teams',
      method: 'GET',
    });
    return errorResponse('Failed to fetch teams', 500);
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(authOptions);
  if (!authResult.success) {
    return authResult.response;
  }

  try {
    const body = await request.json();

    const validation = createTeamSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse(validation.error.issues[0].message, 400);
    }

    const { name, badge } = validation.data;

    // Check if team name already exists
    const existing = await prisma.team.findUnique({
      where: { name },
    });

    if (existing) {
      return errorResponse('Team name already exists', 400);
    }

    const team = await prisma.team.create({
      data: {
        name,
        badge: badge || null,
      },
    });

    return successResponse(team, 201);
  } catch (error) {
    logError('Failed to create team', error, {
      endpoint: '/api/admin/teams',
      method: 'POST',
      userId: authResult.user.id,
    });
    return errorResponse('Internal Server Error', 500);
  }
}
