import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { updateSeasonSchema, validateRequest } from '@/lib/validation';
import { UpdateSeasonRequest } from '@/types/api';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const season = await prisma.season.findUnique({
      where: { id },
      include: {
        matchdays: {
          orderBy: { date: 'asc' },
        },
      },
    });

    if (!season) {
      return NextResponse.json({ error: 'Season not found' }, { status: 404 });
    }

    return NextResponse.json(season);
  } catch (error) {
    console.error('Error fetching season:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const validation = await validateRequest<UpdateSeasonRequest>(updateSeasonSchema, body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { name, startDate, endDate, location, matchday, startHour, endHour } = validation.data;

    const season = await prisma.season.update({
      where: { id },
      data: {
        name,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        location,
        matchday,
        startHour,
        endHour,
      },
    });

    return NextResponse.json(season);
  } catch (error) {
    console.error('Error updating season:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Find all matchdays in the season to get their IDs
    const matchdays = await prisma.matchday.findMany({
      where: { seasonId: id },
      select: { id: true },
    });
    const matchdayIds = matchdays.map((m) => m.id);

    // Delete all associated data in a transaction
    await prisma.$transaction([
      // Delete dependencies of matchdays
      prisma.vote.deleteMany({
        where: { matchdayId: { in: matchdayIds } },
      }),
      // Match stats are cascading deleted via Match, but RSVP is direct
      prisma.rSVP.deleteMany({
        where: { matchdayId: { in: matchdayIds } },
      }),
      // Delete matchdays (cascades to matches)
      prisma.matchday.deleteMany({
        where: { seasonId: id },
      }),
      // Delete season
      prisma.season.delete({
        where: { id },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting season:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
