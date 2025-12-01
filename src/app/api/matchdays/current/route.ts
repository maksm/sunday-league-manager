import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Find the next scheduled matchday or one that is effectively "today"
    // For now, we look for the first SCHEDULED matchday >= today
    const currentMatchday = await prisma.matchday.findFirst({
      where: {
        status: 'SCHEDULED',
        date: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
      include: {
        matches: {
          include: {
            events: {
              orderBy: { timestamp: 'desc' },
            },
            stats: true,
          },
        },
        rsvps: {
          include: {
            player: true,
          },
        },
        season: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    if (!currentMatchday) {
      return NextResponse.json({ message: 'No current matchday found' }, { status: 404 });
    }

    return NextResponse.json(currentMatchday);
  } catch (error) {
    console.error('Error fetching current matchday:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
