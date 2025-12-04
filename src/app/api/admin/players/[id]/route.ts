import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, errorResponse, successResponse } from '@/lib/auth-helpers';
import { validateRequest, updatePlayerSchema } from '@/lib/validation';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { hash } from 'bcryptjs';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdmin(authOptions);
  if (!authResult.success) {
    return authResult.response;
  }

  try {
    const body = await request.json();
    const { id: playerId } = await params;

    // Validate input - we might need to extend the schema or validate manually for now
    // since updatePlayerSchema might only have 'name'
    // For now, let's validate 'name' if present using the schema, and handle others manually
    if (body.name) {
      const validation = await validateRequest(updatePlayerSchema, { name: body.name });
      if (!validation.success) {
        return errorResponse(validation.error, 400);
      }
    }

    const { name, username, password, isActive, teamId } = body;

    // Check if player exists
    const existingPlayer = await prisma.player.findUnique({
      where: { id: playerId },
      include: { user: true },
    });

    if (!existingPlayer) {
      return errorResponse('Player not found', 404);
    }

    // Update Player
    const playerData: { name?: string; isActive?: boolean; teamId?: string | null } = {};
    if (name) playerData.name = name;
    if (typeof isActive === 'boolean') playerData.isActive = isActive;
    if (teamId !== undefined) playerData.teamId = teamId || null;

    if (Object.keys(playerData).length > 0) {
      await prisma.player.update({
        where: { id: playerId },
        data: playerData,
      });
    }

    // Update User if exists and fields are provided
    if (existingPlayer.userId && (username || password)) {
      const userData: { username?: string; passwordHash?: string } = {};
      if (username) userData.username = username;
      if (password) userData.passwordHash = await hash(password, 10);

      await prisma.user.update({
        where: { id: existingPlayer.userId },
        data: userData,
      });
    }

    // Fetch updated player with user info
    const updatedPlayer = await prisma.player.findUnique({
      where: { id: playerId },
      include: {
        user: {
          select: {
            username: true,
          },
        },
      },
    });

    return successResponse(updatedPlayer);
  } catch (error) {
    console.error('Error updating player:', error);
    return errorResponse('Failed to update player', 500);
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

  try {
    const { id: playerId } = await params;

    // Check if player exists
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: {
        user: true,
      },
    });

    if (!player) {
      return errorResponse('Player not found', 404);
    }

    // Hard delete: Delete User if exists (cascade should handle player, but let's be explicit or rely on schema)
    // Looking at schema: User -> Player is 1:1 (Player has userId).
    // If we delete User, Player might NOT be deleted if there is no cascade.
    // Schema:
    // model User { ... player Player? }
    // model Player { ... user User? @relation(fields: [userId], references: [id]) }
    // No onDelete: Cascade on Player.user.
    // So we should delete Player first, then User.

    // Delete Player first
    await prisma.player.delete({
      where: { id: playerId },
    });

    // If there was a user associated, delete it too
    if (player.userId) {
      await prisma.user.delete({
        where: { id: player.userId },
      });
    }

    return successResponse({ success: true, softDeleted: false });
  } catch (error) {
    console.error('Error deleting player:', error);
    return errorResponse('Failed to delete player', 500);
  }
}
