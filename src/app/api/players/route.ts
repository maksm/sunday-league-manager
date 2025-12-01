import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const shadow = searchParams.get('shadow');

  const where = shadow === 'true' ? { userId: null, isActive: true } : { isActive: true };

  const players = await prisma.player.findMany({
    where,
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json(players);
}
