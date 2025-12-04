import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // 1. Cleanup existing data
  console.log('Cleaning up database...');
  // Delete in order of dependencies
  await prisma.vote.deleteMany();
  await prisma.rSVP.deleteMany();
  await prisma.matchStat.deleteMany();
  await prisma.match.deleteMany();
  await prisma.matchday.deleteMany();
  await prisma.season.deleteMany();
  await prisma.player.deleteMany();
  await prisma.user.deleteMany();
  await prisma.team.deleteMany();
  console.log('Database cleaned');

  // 2. Create the 2025/2026 season
  // 3rd Friday in September 2025: September 19, 2025
  // Last Friday in April 2026: April 24, 2026
  const seasonStartDate = new Date('2025-09-19T00:00:00.000Z');
  const seasonEndDate = new Date('2026-04-24T23:59:59.999Z');

  const season = await prisma.season.create({
    data: {
      name: '2025/2026 Season',
      startDate: seasonStartDate,
      endDate: seasonEndDate,
      location: 'TBD', // Can be updated later
      matchday: 'FRIDAY',
      startHour: '20:00',
      endHour: '21:30',
    },
  });

  console.log('Created season:', season);

  // 3. Create a matchday for next Friday
  const nextFriday = new Date();
  nextFriday.setDate(nextFriday.getDate() + ((5 + 7 - nextFriday.getDay()) % 7));
  nextFriday.setHours(20, 0, 0, 0);

  const matchday = await prisma.matchday.create({
    data: {
      date: nextFriday,
      status: 'SCHEDULED',
      seasonId: season.id,
    },
  });

  console.log('Created matchday:', matchday);

  // 4. Create Teams
  const beliBalet = await prisma.team.create({
    data: {
      name: 'Beli Balet',
      badge: '⚪',
    },
  });

  const cikaInter = await prisma.team.create({
    data: {
      name: 'Cika Internazionale',
      badge: '🔵',
    },
  });

  console.log('Created teams:', beliBalet.name, cikaInter.name);

  // 5. Create Admin User 'maks mržek'
  const adminPasswordHash = await hash('password', 12);
  const adminUser = await prisma.user.create({
    data: {
      username: 'maks mržek', // As requested, though spaces in username might be tricky for login if not handled
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      player: {
        create: {
          name: 'Maks Mržek',
        },
      },
    },
  });
  console.log('Created admin user:', adminUser.username);

  // 6. Create some dummy players with team assignments
  const players = [
    { name: 'Ronaldo', teamId: beliBalet.id },
    { name: 'Messi', teamId: cikaInter.id },
    { name: 'Neymar', teamId: beliBalet.id },
    { name: 'Mbappe', teamId: cikaInter.id },
    { name: 'Haaland', teamId: null }, // Free agent
  ];

  for (const p of players) {
    const username = p.name.toLowerCase();
    const passwordHash = await hash('password', 12);

    await prisma.user.upsert({
      where: { username },
      update: {},
      create: {
        username,
        passwordHash,
        role: 'USER',
        player: {
          create: {
            name: p.name,
            teamId: p.teamId,
          },
        },
      },
    });
  }

  console.log('Seeded players with team assignments');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
