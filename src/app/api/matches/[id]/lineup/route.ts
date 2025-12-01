import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authOptions } from '../../../auth/[...nextauth]/route';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: matchId } = await params;
  const body = await request.json();
  const { playerId, team, action } = body; // action: 'ADD' | 'REMOVE' | 'SWITCH'

  if (!playerId || !action) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }

  try {
    if (action === 'ADD') {
      if (!team) return NextResponse.json({ error: 'Team required for ADD' }, { status: 400 });

      await prisma.matchStat.create({
        data: {
          matchId,
          playerId,
          team,
        },
      });
    } else if (action === 'REMOVE') {
      await prisma.matchStat.delete({
        where: {
          matchId_playerId: {
            matchId,
            playerId,
          },
        },
      });
    } else if (action === 'SWITCH') {
      const currentStat = await prisma.matchStat.findUnique({
        where: { matchId_playerId: { matchId, playerId } },
      });
      if (currentStat) {
        await prisma.matchStat.update({
          where: { id: currentStat.id },
          data: { team: currentStat.team === 'A' ? 'B' : 'A' },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating lineup:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
