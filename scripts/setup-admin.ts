import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create or find player for Maks
  const player = await prisma.player.upsert({
    where: { id: 'maks-player-id' },
    update: {},
    create: {
      id: 'maks-player-id',
      name: 'Maks M',
    },
  });

  console.log('Player:', player.name);

  const passwordHash = await hash('password', 12);

  // Create admin user
  const user = await prisma.user.upsert({
    where: { username: 'maksm' },
    update: {
      role: 'ADMIN',
      player: {
        connect: { id: player.id },
      },
    },
    create: {
      username: 'maksm',

      passwordHash,
      role: 'ADMIN',
      player: {
        connect: { id: player.id },
      },
    },
  });

  console.log('✅ Admin user created/updated:', user.username, '- Role:', user.role);

  console.log('🔑 Password: password');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
