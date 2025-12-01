import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authOptions } from '../../auth/[...nextauth]/route';
import { createSeasonSchema, validateRequest } from '@/lib/validation';
import { CreateSeasonRequest } from '@/types/api';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const seasons = await prisma.season.findMany({
      orderBy: { startDate: 'desc' },
      include: {
        _count: {
          select: { matchdays: true },
        },
      },
    });

    return NextResponse.json(seasons);
  } catch (error) {
    console.error('Error fetching seasons:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const validation = await validateRequest<CreateSeasonRequest>(createSeasonSchema, body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { name, startDate, endDate, location, matchday, startHour, endHour } = validation.data;

    const season = await prisma.season.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        location,
        matchday,
        startHour,
        endHour,
      },
    });

    return NextResponse.json(season, { status: 201 });
  } catch (error) {
    console.error('Error creating season:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
