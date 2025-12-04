import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SessionUser, UserRole } from '@/types/api';
import type { AuthOptions } from 'next-auth';

export interface AuthResult {
  success: true;
  user: SessionUser;
}

export interface AuthError {
  success: false;
  response: NextResponse;
}

/**
 * Validates that the user is authenticated
 * Returns the session user or an error response
 */
export async function requireAuth(authOptions?: AuthOptions): Promise<AuthResult | AuthError> {
  const session = authOptions ? await getServerSession(authOptions) : await getServerSession();

  if (!session || !session.user) {
    return {
      success: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  return {
    success: true,
    user: session.user as SessionUser,
  };
}

/**
 * Validates that the user is authenticated and has admin role
 */
export async function requireAdmin(authOptions?: AuthOptions): Promise<AuthResult | AuthError> {
  const authResult = await requireAuth(authOptions);

  if (!authResult.success) {
    return authResult;
  }

  if (authResult.user.role !== UserRole.ADMIN) {
    return {
      success: false,
      response: NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 }),
    };
  }

  return authResult;
}

export interface PlayerResult {
  success: true;
  player: {
    id: string;
    name: string;
    matchesPlayed: number;
    goals: number;
    assists: number;
    motmCount: number;
    form: string;
    isActive: boolean;
    userId: string | null;
  };
}

export interface PlayerError {
  success: false;
  response: NextResponse;
}

/**
 * Gets the player profile for the authenticated user
 */
export async function getPlayerFromSession(user: SessionUser): Promise<PlayerResult | PlayerError> {
  const dbUser = await prisma.user.findUnique({
    where: { username: user.name! },
    include: { player: true },
  });

  if (!dbUser?.player) {
    return {
      success: false,
      response: NextResponse.json({ error: 'Player profile not found' }, { status: 404 }),
    };
  }

  if (!dbUser.player.isActive) {
    return {
      success: false,
      response: NextResponse.json({ error: 'Player account is inactive' }, { status: 403 }),
    };
  }

  return {
    success: true,
    player: dbUser.player,
  };
}

/**
 * Creates a standardized error response
 */
export function errorResponse(message: string, status: number = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Creates a standardized success response
 */
export function successResponse<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json(data, { status });
}
