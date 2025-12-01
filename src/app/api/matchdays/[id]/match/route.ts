import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authOptions } from '../../../auth/[...nextauth]/route';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: matchdayId } = await params;
  const body = await request.json();
  const { teamAId, teamBId } = body;

  try {
    // Create match
    const match = await prisma.match.create({
      data: {
        matchdayId,
        result: '0-0',
      },
    });

    // If teams provided, populate stats
    if (teamAId && teamBId) {
      const teamA = await prisma.matchdayTeam.findUnique({
        where: { id: teamAId },
        include: { players: true },
      });
      const teamB = await prisma.matchdayTeam.findUnique({
        where: { id: teamBId },
        include: { players: true },
      });

      if (teamA && teamB) {
        const statsData = [
          ...teamA.players.map((p) => ({
            matchId: match.id,
            playerId: p.id,
            team: 'A',
          })),
          ...teamB.players.map((p) => ({
            matchId: match.id,
            playerId: p.id,
            team: 'B',
          })),
        ];

        await prisma.matchStat.createMany({
          data: statsData,
        });
      }
    }

    return NextResponse.json(match);
  } catch (error) {
    console.error('Error creating match:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
