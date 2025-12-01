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
    const history = await prisma.matchday.findMany({
      where: {
        status: 'COMPLETED',
      },
      include: {
        matches: {
          include: {
            stats: true,
          },
        },
        season: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    return NextResponse.json(history);
  } catch (error) {
    console.error('Error fetching matchday history:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
