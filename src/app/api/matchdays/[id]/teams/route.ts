import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authOptions } from '../../../auth/[...nextauth]/route';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: matchdayId } = await params;

  try {
    const teams = await prisma.matchdayTeam.findMany({
      where: { matchdayId },
      include: { players: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(teams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: matchdayId } = await params;
  const body = await request.json();
  const { name, color } = body;

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  try {
    const team = await prisma.matchdayTeam.create({
      data: {
        matchdayId,
        name,
        color,
      },
      include: { players: true },
    });

    return NextResponse.json(team);
  } catch (error) {
    console.error('Error creating team:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: matchdayId } = await params;
  const body = await request.json();
  const { teamId, playerIds } = body;

  if (!teamId || !Array.isArray(playerIds)) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }

  try {
    // Update team players
    // First disconnect all, then connect new ones to ensure order/list is correct
    // Actually, for many-to-many, we can use set
    const team = await prisma.matchdayTeam.update({
      where: { id: teamId },
      data: {
        players: {
          set: playerIds.map((id: string) => ({ id })),
        },
      },
      include: { players: true },
    });

    return NextResponse.json(team);
  } catch (error) {
    console.error('Error updating team:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
