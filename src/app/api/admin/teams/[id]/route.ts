import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { requireAdmin, errorResponse, successResponse } from '@/lib/auth-helpers';
import { logError } from '@/lib/logger';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { z } from 'zod';

const updateTeamSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  badge: z.string().max(200).nullable().optional(),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdmin(authOptions);
  if (!authResult.success) {
    return authResult.response;
  }

  const { id } = await params;

  try {
    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        players: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!team) {
      return errorResponse('Team not found', 404);
    }

    return successResponse(team);
  } catch (error) {
    logError('Error fetching team', error, {
      endpoint: `/api/admin/teams/${id}`,
      method: 'GET',
    });
    return errorResponse('Failed to fetch team', 500);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdmin(authOptions);
  if (!authResult.success) {
    return authResult.response;
  }

  const { id } = await params;

  try {
    const body = await request.json();

    const validation = updateTeamSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse(validation.error.issues[0].message, 400);
    }

    const { name, badge } = validation.data;

    // Check if team exists
    const existing = await prisma.team.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse('Team not found', 404);
    }

    // Check if new name conflicts with another team
    if (name && name !== existing.name) {
      const nameConflict = await prisma.team.findUnique({
        where: { name },
      });
      if (nameConflict) {
        return errorResponse('Team name already exists', 400);
      }
    }

    const team = await prisma.team.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(badge !== undefined && { badge }),
      },
    });

    return successResponse(team);
  } catch (error) {
    logError('Failed to update team', error, {
      endpoint: `/api/admin/teams/${id}`,
      method: 'PATCH',
      userId: authResult.user.id,
    });
    return errorResponse('Internal Server Error', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(authOptions);
  if (!authResult.success) {
    return authResult.response;
  }

  const { id } = await params;

  try {
    // Check if team exists
    const existing = await prisma.team.findUnique({
      where: { id },
      include: {
        _count: {
          select: { players: true },
        },
      },
    });

    if (!existing) {
      return errorResponse('Team not found', 404);
    }

    // Remove team association from players first
    await prisma.player.updateMany({
      where: { teamId: id },
      data: { teamId: null },
    });

    // Delete the team
    await prisma.team.delete({
      where: { id },
    });

    return successResponse({ deleted: true });
  } catch (error) {
    logError('Failed to delete team', error, {
      endpoint: `/api/admin/teams/${id}`,
      method: 'DELETE',
      userId: authResult.user.id,
    });
    return errorResponse('Internal Server Error', 500);
  }
}
