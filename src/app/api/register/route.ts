import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';
import { validateRequest, registerSchema } from '@/lib/validation';
import { errorResponse, successResponse } from '@/lib/auth-helpers';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate input
    const validation = await validateRequest(registerSchema, body);
    if (!validation.success) {
      return errorResponse(validation.error, 400);
    }

    const { password, name, playerId, username: providedUsername, teamId } = validation.data;

    // Generate Username: Name + First letter of Surname (or random if no surname)
    let baseName = name || '';

    if (playerId) {
      const player = await prisma.player.findUnique({
        where: { id: playerId },
      });

      if (!player) {
        return errorResponse('Player not found', 404);
      }

      if (player.userId) {
        return errorResponse('Player already claimed', 400);
      }

      baseName = player.name;
    }

    let username = '';

    if (providedUsername) {
      // Use provided username
      username = providedUsername.trim().toLowerCase();

      // Validate format (alphanumeric only)
      if (!/^[a-z0-9]+$/.test(username)) {
        return errorResponse('Username must contain only letters and numbers', 400);
      }

      // Check if taken
      const existingUser = await prisma.user.findUnique({
        where: { username },
      });

      if (existingUser) {
        return errorResponse('Username is already taken', 400);
      }
    } else {
      // Generate username from name
      const parts = baseName.trim().split(/\s+/);
      username = parts[0] || 'user';

      if (parts.length > 1) {
        const lastName = parts[parts.length - 1];
        if (lastName.length > 0) {
          username += lastName[0];
        }
      }

      // Remove special chars and lowercase
      username = username.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

      // Fallback if username is empty
      if (!username) {
        username = 'user';
      }

      // Ensure uniqueness
      let uniqueUsername = username;
      let counter = 1;
      while (await prisma.user.findUnique({ where: { username: uniqueUsername } })) {
        uniqueUsername = `${username}${counter}`;
        counter++;
      }
      username = uniqueUsername;
    }

    const passwordHash = await hash(password, 12);

    // Use transaction to ensure atomicity
    const user = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      if (playerId) {
        // Claim existing player and reactivate if inactive
        await tx.player.update({
          where: { id: playerId },
          data: { isActive: true },
        });

        return await tx.user.create({
          data: {
            username: username,
            passwordHash,
            player: {
              connect: { id: playerId },
            },
          },
        });
      } else {
        // Check if an inactive player with this exact name exists
        const inactivePlayer = await tx.player.findFirst({
          where: {
            name: name!,
            userId: null,
            isActive: false,
          },
        });

        if (inactivePlayer) {
          // Reactivate and claim existing inactive player
          await tx.player.update({
            where: { id: inactivePlayer.id },
            data: { isActive: true },
          });

          return await tx.user.create({
            data: {
              username: username,
              passwordHash,
              player: {
                connect: { id: inactivePlayer.id },
              },
            },
          });
        }

        // Create new player
        return await tx.user.create({
          data: {
            username: username,
            passwordHash,
            player: {
              create: {
                name: name!,
                teamId: teamId || null,
              },
            },
          },
        });
      }
    });

    return successResponse(
      {
        user: { id: user.id, username: user.username },
      },
      201
    );
  } catch (error) {
    console.error('Registration error:', error);
    return errorResponse('Internal Server Error', 500);
  }
}
