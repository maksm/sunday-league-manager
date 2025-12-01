import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authOptions } from '../../auth/[...nextauth]/route';
import { createMatchdaySchema, validateRequest } from '@/lib/validation';
import { errorResponse } from '@/lib/auth-helpers';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const validation = await validateRequest(createMatchdaySchema, body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { date, seasonId, startTime, endTime } = validation.data;

    const matchday = await prisma.matchday.create({
      data: {
        date: new Date(date),
        seasonId,
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
        matches: {
          create: {}, // Create a default match
        },
      },
    });

    return NextResponse.json(matchday);
  } catch (error) {
    console.error('Error creating matchday:', error);
    return errorResponse('Internal Server Error', 500);
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return errorResponse('Unauthorized', 401);
    }

    const user = await prisma.user.findUnique({
      where: { username: session.user.name! },
    });

    if (!user || user.role !== 'ADMIN') {
      return errorResponse('Forbidden', 403);
    }

    const matchdays = await prisma.matchday.findMany({
      include: {
        season: {
          select: { name: true },
        },
        matches: true, // Include matches
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(matchdays);
  } catch (error) {
    console.error('Error fetching matchdays:', error);
    return errorResponse('Internal Server Error', 500);
  }
}
