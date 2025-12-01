import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@/types/api';
import { authOptions } from '../api/auth/[...nextauth]/route';
import AdminClient from './components/AdminClient';

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/login');
  }

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { username: session.user.name! },
  });

  if (!user || user.role !== UserRole.ADMIN) {
    redirect('/dashboard');
  }

  // Fetch all players for admin
  const players = await prisma.player.findMany({
    include: {
      user: {
        select: {
          username: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });

  return <AdminClient initialPlayers={players} />;
}
