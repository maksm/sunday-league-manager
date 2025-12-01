import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const username = process.argv[2];
  const newPassword = process.argv[3];

  if (!username || !newPassword) {
    console.error('Usage: npx tsx scripts/reset-password.ts <username> <new-password>');
    process.exit(1);
  }

  console.log(`Resetting password for user: ${username}`);

  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) {
    console.error(`User '${username}' not found.`);
    process.exit(1);
  }

  const passwordHash = await hash(newPassword, 12);

  await prisma.user.update({
    where: { username },
    data: { passwordHash },
  });

  console.log(`Password for '${username}' has been reset to '${newPassword}'.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
