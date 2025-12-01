import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { updateMatchdaySchema, validateRequest } from '@/lib/validation';
import { errorResponse } from '@/lib/auth-helpers';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return errorResponse('Unauthorized', 403);
    }

    const { id } = await params;

    await prisma.matchday.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting matchday:', error);
    return errorResponse('Internal Server Error', 500);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return errorResponse('Unauthorized', 403);
    }

    const { id } = await params;
    const body = await request.json();
    const validation = await validateRequest(updateMatchdaySchema, body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { date, seasonId, status } = validation.data;

    const matchday = await prisma.matchday.update({
      where: { id },
      data: {
        date: date ? new Date(date) : undefined,
        seasonId: seasonId === null ? null : seasonId,
        status,
      },
    });

    return NextResponse.json(matchday);
  } catch (error) {
    console.error('Error updating matchday:', error);
    return errorResponse('Internal Server Error', 500);
  }
}
