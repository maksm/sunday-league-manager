import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Check current state
  const players = await prisma.player.findMany({
    select: { id: true, name: true, isActive: true },
  });

  console.log('Current player states:');
  players.forEach((p) => {
    console.log(`- ${p.name}: isActive = ${p.isActive}`);
  });

  // Count inactive players
  const inactiveCount = players.filter((p) => !p.isActive).length;
  console.log(`\nFound ${inactiveCount} inactive players out of ${players.length} total`);

  if (inactiveCount > 0) {
    console.log('\nUpdating all players to active...');
    const result = await prisma.player.updateMany({
      where: { isActive: false },
      data: { isActive: true },
    });
    console.log(`✓ Updated ${result.count} players to active`);
  } else {
    console.log('\nAll players are already active!');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
