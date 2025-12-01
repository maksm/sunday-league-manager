import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authOptions } from '../../../auth/[...nextauth]/route';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: matchId } = await params;
  const body = await request.json();
  const { type, playerId, assistId, subOutId, team } = body;

  if (!type) {
    return NextResponse.json({ error: 'Type is required' }, { status: 400 });
  }

  // Deduplication: Check for similar event in last 60 seconds
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
  const duplicate = await prisma.matchEvent.findFirst({
    where: {
      matchId,
      type,
      playerId,
      timestamp: {
        gte: oneMinuteAgo,
      },
    },
  });

  if (duplicate) {
    return NextResponse.json({ message: 'Duplicate event ignored', event: duplicate });
  }

  try {
    // Create the event
    const event = await prisma.matchEvent.create({
      data: {
        matchId,
        type,
        playerId,
        assistId,
        subOutId,
        team,
      },
    });

    // Handle side effects (Stats updates)
    if (type === 'GOAL' && playerId && team) {
      // Update Scorer Stats
      const scorerStat = await prisma.matchStat.findUnique({
        where: {
          matchId_playerId: {
            matchId,
            playerId,
          },
        },
      });

      if (scorerStat) {
        await prisma.matchStat.update({
          where: { id: scorerStat.id },
          data: { goals: { increment: 1 } },
        });
      } else {
        await prisma.matchStat.create({
          data: {
            matchId,
            playerId,
            team,
            goals: 1,
          },
        });
      }

      // Update Assister Stats
      if (assistId) {
        const assistStat = await prisma.matchStat.findUnique({
          where: {
            matchId_playerId: {
              matchId,
              playerId: assistId,
            },
          },
        });

        if (assistStat) {
          await prisma.matchStat.update({
            where: { id: assistStat.id },
            data: { assists: { increment: 1 } },
          });
        } else {
          await prisma.matchStat.create({
            data: {
              matchId,
              playerId: assistId,
              team, // Assuming assister is on same team
              assists: 1,
            },
          });
        }
      }

      // Update Match Result
      const match = await prisma.match.findUnique({
        where: { id: matchId },
      });

      if (match) {
        let [scoreA, scoreB] = (match.result || '0-0').split('-').map(Number);
        if (isNaN(scoreA)) scoreA = 0;
        if (isNaN(scoreB)) scoreB = 0;

        if (team === 'A') scoreA++;
        else if (team === 'B') scoreB++;

        await prisma.match.update({
          where: { id: matchId },
          data: { result: `${scoreA}-${scoreB}` },
        });
      }
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error('Error creating match event:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
