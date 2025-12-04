import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/auth-helpers';

export async function GET() {
  try {
    const teams = await prisma.team.findMany({
      orderBy: { name: 'asc' },
    });

    return successResponse(teams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    return errorResponse('Internal Server Error', 500);
  }
}
